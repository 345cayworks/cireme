import { getDb } from './db/_client.js'
import { getAgentCreds } from './util/_auth.js'
export const handler = async (event) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') return { statusCode:405, body:'Method not allowed' }
  const cred = getAgentCreds(event); if(!cred.ok) return cred.res
  const sql = getDb()
  const ag = await sql(`SELECT id FROM agents WHERE id=$1 AND api_key=$2`, [cred.id, cred.key])
  if (!ag.length) return { statusCode:401, body:'Unauthorized (agent invalid)' }
  const { id, title, price, beds, baths, sqft, type, district, lat, lng, images=[] } = JSON.parse(event.body || '{}')
  if (!id || !title) return { statusCode:400, body:'id and title required' }
  await sql(`
    INSERT INTO listings (id,title,price,beds,baths,sqft,type,district,lat,lng,images,agent_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (id) DO UPDATE SET
      title=EXCLUDED.title, price=EXCLUDED.price, beds=EXCLUDED.beds, baths=EXCLUDED.baths,
      sqft=EXCLUDED.sqft, type=EXCLUDED.type, district=EXCLUDED.district,
      lat=EXCLUDED.lat, lng=EXCLUDED.lng, images=EXCLUDED.images, agent_id=$12, updated_at=now()
  `, [id, title, price||0, beds||0, baths||0, sqft||0, type||'House', district||'George Town', lat ?? null, lng ?? null, images, cred.id])
  return { statusCode:200, body: JSON.stringify({ ok:true, id }) }
}
