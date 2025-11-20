const { createClient, corsHeaders, json, requireJWT, role, parseNum } = require("./_common");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: corsHeaders(), body: "" };
  let client;
  try {
    let claims;
    try { claims = requireJWT(event); }
    catch (e) {
      const token = (event.queryStringParameters||{}).token;
      if (!token) throw e;
      event.headers = { ...(event.headers||{}), authorization: `Bearer ${token}` };
      claims = requireJWT(event);
    }
    const r = role(claims);
    if (!["agent","admin"].includes(r)) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
    const agentId = claims.agent_id || claims.agentId;
    if (!agentId && r !== "admin") throw Object.assign(new Error("Missing agent_id claim"), { statusCode: 403 });

    client = createClient(); await client.connect();

    if (event.httpMethod === "GET") {
      const limit = parseNum((event.queryStringParameters||{}).limit ?? 50, { min:1, max:100, integer:true });
      const offset = parseNum((event.queryStringParameters||{}).offset ?? 0, { min:0, integer:true });
      const vals = [];
      let where = "1=1";
      if (r === "agent") { vals.push(agentId); where = "agent_id = $1"; }
      const rows = await client.query(
        `SELECT id, mls_listing_id AS mls_id, property_type::text AS property_type, price AS list_price,
                beds AS bedrooms, baths AS bathrooms, sqft AS square_feet,
                city, state, address_line1 AS address, status, is_active, listed_at
         FROM mls_listings
         WHERE ${where}
         ORDER BY updated_at DESC
         LIMIT $${vals.length+1} OFFSET $${vals.length+2};`,
        [...vals, limit, offset]
      );
      return json(rows.rows); // ARRAY
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const TYPE_MAP = { single_family:"RESIDENTIAL", condo:"CONDO", townhouse:"TOWNHOUSE", land:"LAND", commercial:"COMMERCIAL" };
      const mappedType = TYPE_MAP[(body.property_type || "").toLowerCase()] || "RESIDENTIAL";

      const city = body.district || body.city || null;
      const state = body.state || (city ? "Grand Cayman" : null);

      const price = parseNum(body.list_price, { min:0 });
      const beds = parseNum(body.bedrooms, { min:0, integer:true });
      const baths = parseNum(body.bathrooms, { min:0 });
      const sqft  = body.square_feet !== undefined ? parseNum(body.square_feet, { min:0, integer:true }) : null;
      const yearBuilt = body.year_built !== undefined ? parseNum(body.year_built, { min:1600, integer:true }) : null;

      const descShort = body.headline || null;
      const descLong = [body.description || "", body.parcel_id ? `\nParcel: ${body.parcel_id}` : ""].join("").trim() || null;

      const vals = [
        mappedType, price, beds, baths, sqft,
        city, state, body.address || null,
        r === "admin" ? (body.agent_id || null) : agentId,
        body.office_id || null,
        descShort, descLong,
        body.is_active !== false, "ACTIVE",
        yearBuilt
      ];
      const result = await client.query(
        `INSERT INTO mls_listings
           (property_type, price, beds, baths, sqft, city, state, address_line1, agent_id, office_id,
            desc_short, desc_long, is_active, status, listed_at, updated_at, year_built)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now(), now(), $15)
         RETURNING id, mls_listing_id AS mls_id;`, vals
      );
      return json({ success: true, id: result.rows[0].id, mls_id: result.rows[0].mls_id }, 201);
    }

    if (event.httpMethod === "PATCH") {
      const id = parseNum((event.queryStringParameters||{}).id, { min:1, integer:true });
      const body = JSON.parse(event.body || "{}");

      const sets = []; const vals = [];
      const push = (c, v, p) => { if (v !== undefined) { sets.push(`${c} = $${sets.length+1}`); vals.push(p? p(v): v); } };

      push("price", body.list_price, v => parseNum(v, { min:0 }));
      push("beds", body.bedrooms, v => parseNum(v, { min:0, integer:true }));
      push("baths", body.bathrooms, v => parseNum(v, { min:0 }));
      push("sqft", body.square_feet, v => parseNum(v, { min:0, integer:true }));
      push("city", body.city || body.district);
      push("state", body.state);
      push("address_line1", body.address);
      push("desc_short", body.headline);
      push("desc_long", body.description);
      if (body.is_active !== undefined) push("is_active", !!body.is_active);
      if (body.status !== undefined) push("status", String(body.status).toUpperCase());
      if (body.year_built !== undefined) push("year_built", v => parseNum(v, { min:1600, integer:true }));

      if (!sets.length) return json({ error: "No fields to update" }, 400);

      let where = `id = $${sets.length+1}`; vals.push(id);
      if (r === "agent") { where += ` AND agent_id = $${sets.length+2}`; vals.push(agentId); }

      const sql = `UPDATE mls_listings SET ${sets.join(", ")}, updated_at = now() WHERE ${where} RETURNING id;`;
      const res = await client.query(sql, vals);
      if (!res.rowCount) return json({ error: "Not found or forbidden" }, 404);
      return json({ success: true, id: res.rows[0].id });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("my-listings error:", err);
    const code = err.statusCode || 500;
    return json({ error: code === 400 ? err.message : "Internal server error" }, code);
  } finally {
    if (client) await client.end();
  }
};
