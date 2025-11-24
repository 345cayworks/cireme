import { getDb } from './db/_client.js'
export const handler = async (event) => {
  try {
    const sql = getDb()
    const url = new URL(event.rawUrl)
    const q = url.searchParams.get('q')?.trim() || ''
    const district = url.searchParams.get('district')?.trim() || ''
    const type = url.searchParams.get('type')?.trim() || ''
    const priceMin = Number(url.searchParams.get('priceMin') || 0)
    const priceMax = Number(url.searchParams.get('priceMax') || 0)

    const clauses = []; const params = []
    if (q) { clauses.push(`(title ILIKE $${params.length+1} OR id ILIKE $${params.length+1})`); params.push(`%${q}%`) }
    if (district) { clauses.push(`district = $${params.length+1}`); params.push(district) }
    if (type) { clauses.push(`type = $${params.length+1}`); params.push(type) }
    if (priceMin) { clauses.push(`price >= $${params.length+1}`); params.push(priceMin) }
    if (priceMax) { clauses.push(`price <= $${params.length+1}`); params.push(priceMax) }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''

    const rows = await sql(`
      SELECT id, title, price, beds, baths, sqft, type, district, lat, lng, images
      FROM listings
      ${where}
      ORDER BY updated_at DESC
      LIMIT 200
    `, params)

    return { statusCode: 200, headers: {'content-type':'application/json'}, body: JSON.stringify(rows) }
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
