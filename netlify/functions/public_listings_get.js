import { getDb } from './db/_client.js'
export const handler = async () => {
  try {
    const sql = getDb()
    const rows = await sql(`
      SELECT id, title, price, beds, baths, sqft, type, district, lat, lng, images, updated_at, agent_id
      FROM listings
      ORDER BY updated_at DESC
      LIMIT 1000
    `)
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify(rows) }
  } catch (e) {
    return { statusCode:500, body: e.message }
  }
}
