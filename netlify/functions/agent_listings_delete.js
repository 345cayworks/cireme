import { getDb } from './db/_client.js'
import { getAgentCreds } from './util/_auth.js'
export const handler = async (event) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') return { statusCode:405, body:'Method not allowed' }
  const cred = getAgentCreds(event); if(!cred.ok) return cred.res
  const sql = getDb()
  const ag = await sql(`SELECT id FROM agents WHERE id=$1 AND api_key=$2`, [cred.id, cred.key])
  if (!ag.length) return { statusCode:401, body:'Unauthorized (agent invalid)' }
  const { id } = JSON.parse(event.body || '{}')
  if (!id) return { statusCode:400, body:'id required' }
  await sql(`DELETE FROM listings WHERE id=$1 AND agent_id=$2`, [id, cred.id])
  return { statusCode:200, body: JSON.stringify({ ok:true }) }
}
