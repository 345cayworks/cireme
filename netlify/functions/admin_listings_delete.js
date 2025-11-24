import { getDb } from './db/_client.js'
import { requireAdmin } from './util/_auth.js'
export const handler = async (event) => {
  const chk = requireAdmin(event); if(!chk.ok) return chk.res
  if(event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') return { statusCode:405, body:'Method not allowed' }
  const { id } = JSON.parse(event.body || '{}')
  if (!id) return { statusCode:400, body:'id required' }
  const sql = getDb()
  await sql(`DELETE FROM listings WHERE id=$1`, [id])
  return { statusCode:200, body: JSON.stringify({ ok:true }) }
}
