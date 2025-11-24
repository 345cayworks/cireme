import { getDb } from './db/_client.js'
import { requireAdmin } from './util/_auth.js'
export const handler = async (event) => {
  try {
    const chk = requireAdmin(event); if(!chk.ok) return chk.res
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') return { statusCode:405, body:'Method not allowed' }
    const { id, name, email, api_key } = JSON.parse(event.body || '{}')
    if (!id || !name || !email || !api_key) return { statusCode:400, body:'id,name,email,api_key required' }
    const sql = getDb()
    await sql(`
      INSERT INTO agents (id, name, email, api_key)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        api_key = EXCLUDED.api_key,
        updated_at = now()
    `, [id, name, email, api_key])
    return { statusCode:200, body: JSON.stringify({ ok:true, id }) }
  } catch (e) { return { statusCode:500, body: JSON.stringify({ error:e.message }) } }
}
