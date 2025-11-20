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
    if (role(claims) !== "admin") throw Object.assign(new Error("Forbidden"), { statusCode: 403 });

    client = createClient(); await client.connect();

    if (event.httpMethod === "GET") {
      const limit = parseNum((event.queryStringParameters||{}).limit ?? 100, { min:1, max:200, integer:true });
      const offset = parseNum((event.queryStringParameters||{}).offset ?? 0, { min:0, integer:true });
      const rows = await client.query(
        `SELECT id, mls_listing_id AS mls_id, property_type::text, price, beds, baths, sqft,
                city, state, address_line1 AS address, status, is_active, listed_at, updated_at
         FROM mls_listings
         ORDER BY updated_at DESC
         LIMIT $1 OFFSET $2`, [limit, offset]
      );
      return json(rows.rows); // ARRAY
    }

    if (event.httpMethod === "POST") {
      const b = JSON.parse(event.body || "{}");
      const vals = [
        b.property_type || "RESIDENTIAL",
        parseNum(b.price ?? b.list_price, { min:0 }),
        parseNum(b.beds ?? b.bedrooms, { min:0, integer:true }),
        parseNum(b.baths ?? b.bathrooms, { min:0 }),
        b.sqft ?? b.square_feet ? parseNum(b.sqft ?? b.square_feet, { min:0, integer:true }) : null,
        b.city || b.district || null, b.state || "Grand Cayman", b.address || b.address_line1 || null,
        b.agent_id || null, b.office_id || null,
        b.desc_short || b.headline || null, b.desc_long || b.description || null,
        b.is_active !== false, (b.status ? String(b.status).toUpperCase() : "ACTIVE"),
        b.year_built ? parseNum(b.year_built, { min:1600, integer:true }) : null
      ];
      const res = await client.query(
        `INSERT INTO mls_listings
         (property_type, price, beds, baths, sqft, city, state, address_line1,
          agent_id, office_id, desc_short, desc_long, is_active, status, listed_at, updated_at, year_built)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now(), now(), $15)
         RETURNING id, mls_listing_id AS mls_id`, vals
      );
      return json({ success: true, id: res.rows[0].id, mls_id: res.rows[0].mls_id }, 201);
    }

    if (event.httpMethod === "PATCH") {
      const id = parseNum((event.queryStringParameters||{}).id, { min:1, integer:true });
      const b = JSON.parse(event.body || "{}");
      const sets = [], vals = [];
      const push = (c, v, p) => { if (v !== undefined) { sets.push(`${c}=$${sets.length+1}`); vals.push(p? p(v): v); } };

      push("property_type", b.property_type, v => String(v).toUpperCase());
      push("price", b.price ?? b.list_price, v => parseNum(v, { min:0 }));
      push("beds", b.beds ?? b.bedrooms, v => parseNum(v, { min:0, integer:true }));
      push("baths", b.baths ?? b.bathrooms, v => parseNum(v, { min:0 }));
      push("sqft", b.sqft ?? b.square_feet, v => parseNum(v, { min:0, integer:true }));
      push("city", b.city ?? b.district);
      push("state", b.state);
      push("address_line1", b.address ?? b.address_line1);
      push("desc_short", b.desc_short ?? b.headline);
      push("desc_long", b.desc_long ?? b.description);
      if (b.is_active !== undefined) push("is_active", !!b.is_active);
      if (b.status !== undefined) push("status", String(b.status).toUpperCase());
      if (b.year_built !== undefined) push("year_built", v => parseNum(v, { min:1600, integer:true }));

      if (!sets.length) return json({ error: "No fields to update" }, 400);
      vals.push(id);

      const res = await client.query(
        `UPDATE mls_listings SET ${sets.join(", ")}, updated_at = now() WHERE id = $${vals.length} RETURNING id`, vals
      );
      if (!res.rowCount) return json({ error: "Not found" }, 404);
      return json({ success: true, id: res.rows[0].id });
    }

    if (event.httpMethod === "DELETE") {
      const id = parseNum((event.queryStringParameters||{}).id, { min:1, integer:true });
      const res = await client.query(`DELETE FROM mls_listings WHERE id = $1`, [id]);
      if (!res.rowCount) return json({ error: "Not found" }, 404);
      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("admin-listings error:", err);
    const code = err.statusCode || 500;
    return json({ error: code === 400 ? err.message : "Internal server error" }, code);
  } finally {
    if (client) await client.end();
  }
};
