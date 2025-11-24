import { getDb } from './db/_client.js'
import { requireAdmin } from './util/_auth.js'
export const handler = async (event) => {
  const chk = requireAdmin(event); if(!chk.ok) return chk.res
  const sql = getDb()
  const rows = await sql(`SELECT id, name, email, created_at, updated_at FROM agents ORDER BY created_at DESC`)
  return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify(rows) }
}
