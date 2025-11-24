import { getDb } from './db/_client.js'
import { getAgentCreds } from './util/_auth.js'

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode:405, body:'Method not allowed' }
    const cred = getAgentCreds(event); if(!cred.ok) return cred.res

    const sql = getDb()
    const ag = await sql(`SELECT id FROM agents WHERE id=$1 AND api_key=$2`, [cred.id, cred.key])
    if (!ag.length) return { statusCode:401, body:'Unauthorized (agent invalid)' }

    const { csvBase64 } = JSON.parse(event.body || '{}')
    if (!csvBase64) return { statusCode:400, body:'csvBase64 required' }

    const text = Buffer.from(csvBase64, 'base64').toString('utf8')
    const lines = text.split(/\r?\n/).filter(l=>l.trim().length)
    if (lines.length < 2) return { statusCode:400, body:'CSV has no rows' }
    const headers = lines[0].split(',').map(h=>h.trim())
    const required = ['id','title']
    for (const r of required) if (!headers.includes(r)) return { statusCode:400, body:`CSV missing required column: ${r}` }

    const rows = lines.slice(1).map(line => {
      const cols = line.split(',')
      const obj = {}
      headers.forEach((h,i)=> obj[h] = (cols[i]||'').trim())
      return obj
    })

    for (const obj of rows) {
      if (!obj.id || !obj.title) continue
      await sql(`
        INSERT INTO listings (id,title,price,beds,baths,sqft,type,district,lat,lng,images,agent_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO UPDATE SET
          title=EXCLUDED.title, price=EXCLUDED.price, beds=EXCLUDED.beds, baths=EXCLUDED.baths,
          sqft=EXCLUDED.sqft, type=EXCLUDED.type, district=EXCLUDED.district,
          lat=EXCLUDED.lat, lng=EXCLUDED.lng, images=EXCLUDED.images, agent_id=$12, updated_at=now()
      `, [
        obj.id,
        obj.title,
        Number(obj.price||0),
        Number(obj.beds||0),
        Number(obj.baths||0),
        Number(obj.sqft||0),
        obj.type || 'House',
        obj.district || 'George Town',
        obj.lat ? Number(obj.lat) : null,
        obj.lng ? Number(obj.lng) : null,
        (obj.images||'').split('|').filter(Boolean),
        cred.id
      ])
    }

    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true, count: rows.length }) }
  } catch (e) { return { statusCode:500, body: JSON.stringify({ error: e.message }) } }
}
