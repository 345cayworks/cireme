import { getDb } from './db/_client.js'
import { getAgentCreds } from './util/_auth.js'
export const handler = async (event) => {
  const cred = getAgentCreds(event); if(!cred.ok) return cred.res
  const sql = getDb()
  const ag = await sql(`SELECT id FROM agents WHERE id=$1 AND api_key=$2`, [cred.id, cred.key])
  if (!ag.length) return { statusCode:401, body:'Unauthorized (agent invalid)' }
  const rows = await sql(`
    SELECT id,title,price,beds,baths,sqft,type,district,lat,lng,images,updated_at
      FROM listings WHERE agent_id=$1 ORDER BY updated_at DESC`, [cred.id])
  return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify(rows) }
}
