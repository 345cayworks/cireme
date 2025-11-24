import { getDb } from './db/_client.js'
import { rateLimitPublic } from './util/_rate_public.js'
function s(x,n){ return String(x||'').trim().slice(0,n) }
function isEmail(x){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(x||'').trim()) }
export const handler = async (event) => {
  try{
    if(event.httpMethod!=='POST') return { statusCode:405, body:'Method not allowed' }
    const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || ''
    const r = await rateLimitPublic({ funcName:'partner_apply_submit', ip }); if(!r.allowed) return { statusCode:r.code, body:r.msg }
    const p = JSON.parse(event.body||'{}'); if(p.hp_field) return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true }) }
    const org_name = s(p.org_name,200), contact_name=s(p.contact_name,200), email=s(p.email,200), phone=s(p.phone,50), message=s(p.message,4000)
    if(!org_name || !contact_name || !email) return { statusCode:400, body:'org_name, contact_name, email required' }
    if(!isEmail(email)) return { statusCode:400, body:'invalid email' }
    const sql = getDb()
    await sql(`INSERT INTO partner_applications (org_name, contact_name, email, phone, message, ip) VALUES ($1,$2,$3,$4,$5,$6)`, [org_name, contact_name, email, phone, message, ip])
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ ok:true }) }
  }catch(e){ return { statusCode:500, body: e.message } }
}
