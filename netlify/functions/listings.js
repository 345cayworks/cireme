// ARRAY default; add ?meta=1 for meta wrapper
const { createClient, corsHeaders, json, parseNum } = require("./_common");

function parseQuery(qs = {}) {
  const pick = (s) => (s === undefined ? undefined : String(s));
  return {
    q: pick(qs.q),
    city: pick(qs.city) || pick(qs.district),
    state: pick(qs.state),
    minPrice: parseNum(qs.minPrice, { min: 0 }),
    maxPrice: parseNum(qs.maxPrice, { min: 0 }),
    beds: parseNum(qs.beds, { min: 0, integer: true }),
    baths: parseNum(qs.baths, { min: 0 }),
    limit: parseNum(qs.limit ?? 20, { min: 1, max: 100, integer: true }),
    offset: parseNum(qs.offset ?? 0, { min: 0, integer: true }),
    sort: pick(qs.sort),
    meta: qs.meta != null ? (qs.meta === "1" || qs.meta === 1) : false
  };
}

function buildWhere(p, v) {
  const w = ["is_active = true", "status = 'ACTIVE'"];
  if (p.q) { v.push(`%${p.q}%`); w.push(`(city ilike $${v.length} or state ilike $${v.length} or address_line1 ilike $${v.length})`); }
  if (p.city)  { v.push(p.city);  w.push(`city ilike $${v.length}`); }
  if (p.state) { v.push(p.state); w.push(`state ilike $${v.length}`); }
  if (p.minPrice !== undefined) { v.push(p.minPrice); w.push(`price >= $${v.length}`); }
  if (p.maxPrice !== undefined) { v.push(p.maxPrice); w.push(`price <= $${v.length}`); }
  if (p.beds !== undefined)  { v.push(p.beds);  w.push(`beds >= $${v.length}`); }
  if (p.baths !== undefined) { v.push(p.baths); w.push(`baths >= $${v.length}`); }
  return w;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: corsHeaders(), body: "" };
  try {
    const p = parseQuery(event.queryStringParameters || {});
    const client = createClient(); await client.connect();

    const vals = [];
    const where = buildWhere(p, vals);
    const order = p.sort === "price_desc" ? "price DESC"
                : p.sort === "price_asc"  ? "price ASC"
                : "listed_at DESC NULLS LAST";

    const sql = `
      SELECT
        id,
        mls_listing_id              AS mls_id,
        property_type::text         AS property_type,
        COALESCE(city, state, 'Unknown') AS district,
        address_line1               AS address,
        price                       AS list_price,
        beds                        AS bedrooms,
        baths                       AS bathrooms,
        sqft                        AS square_feet,
        CASE WHEN is_active AND status='ACTIVE' THEN 'active'
             WHEN NOT is_active THEN 'inactive'
             ELSE lower(status) END AS status,
        listed_at                   AS list_date
      FROM mls_listings
      WHERE ${where.join(" AND ")}
      ORDER BY ${order}
      LIMIT $${vals.length+1} OFFSET $${vals.length+2};
    `;
    vals.push(p.limit, p.offset);

    const [rowsRes, countRes] = await Promise.all([
      client.query(sql, vals),
      client.query(`SELECT count(*)::int AS total FROM mls_listings WHERE ${where.join(" AND ")}`, vals.slice(0, -2))
    ]);

    if (p.meta) return json({ total: countRes.rows[0].total, limit: p.limit, offset: p.offset, listings: rowsRes.rows });
    return json(rowsRes.rows);
  } catch (err) {
    console.error("listings error:", err);
    const code = err.statusCode || 500;
    return json({ error: code === 400 ? err.message : "Internal server error" }, code);
  }
};
