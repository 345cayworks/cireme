import { getDb } from './db/_client.js'
import { requireAdmin } from './util/_auth.js'
export const handler = async (event) => {
  const chk = requireAdmin(event); if(!chk.ok) return chk.res
  const sql = getDb()
  const rows = await sql(`
    SELECT id, title, price, beds, baths, sqft, type, district, lat, lng, images, agent_id, updated_at
    FROM listings ORDER BY updated_at DESC LIMIT 1000`)
  return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify(rows) }
}
