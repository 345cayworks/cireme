import { getDb } from './db/_client.js'
import { rateLimitPublic } from './util/_rate_public.js'
function s(x,n){ return String(x||'').trim().slice(0,n) }
export const handler = async (event) => {
  try{
    if(event.httpMethod!=='POST') return { statusCode:405, body:'Method not allowed' }
    const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || ''
    const r = await rateLimitPublic({ funcName:'public_submit_inquiry', ip }); if(!r.allowed) return { statusCode:r.code, body:r.msg }
    const p = JSON.parse(event.body||'{}'); if(p.hp_field) return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true }) }
    const { listing_id, name, email, phone, message } = p
    if(!listing_id || !name || !email) return { statusCode:400, body:'listing_id, name, email required' }
    const sql = getDb()
    await sql(`INSERT INTO leads (listing_id, name, email, phone, message) VALUES ($1,$2,$3,$4,$5)`, [ s(listing_id,512), s(name,200), s(email,200), s(phone,50), s(message,2000) ])
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true }) }
  }catch(e){ return { statusCode:500, body: e.message } }
}
