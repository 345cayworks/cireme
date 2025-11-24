import { getDb } from './db/_client.js'
import { getAgentCreds } from './util/_auth.js'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/avif'])

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode:405, body:'Method not allowed' }
    const cred = getAgentCreds(event); if(!cred.ok) return cred.res

    const sql = getDb()
    const ag = await sql(`SELECT id FROM agents WHERE id=$1 AND api_key=$2`, [cred.id, cred.key])
    if (!ag.length) return { statusCode:401, body:'Unauthorized (agent invalid)' }

    const { filename, contentType, base64 } = JSON.parse(event.body || '{}')
    if (!filename || !contentType || !base64) return { statusCode:400, body:'filename, contentType, base64 required' }
    if (!ALLOWED.has(contentType)) return { statusCode:400, body:'Unsupported contentType' }

    const provider = (process.env.STORAGE_PROVIDER || '').toLowerCase()
    if (provider !== 'supabase') return { statusCode:500, body:'Set STORAGE_PROVIDER=supabase' }

    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    const bucket = process.env.SUPABASE_BUCKET
    if(!url || !key || !bucket) return { statusCode:500, body:'Supabase env vars missing' }

    const bytes = Buffer.from(base64, 'base64')
    if (bytes.length > MAX_BYTES) return { statusCode:413, body:'File too large' }

    const objectKey = `agents/${cred.id}/${Date.now()}_${sanitize(filename)}`
    const resp = await fetch(`${url.replace(/\/$/,'')}/storage/v1/object/${encodeURIComponent(bucket)}/${objectKey}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': contentType, 'x-upsert': 'true' },
      body: bytes
    })
    if(!resp.ok) return { statusCode:502, body: `Supabase upload failed: ${resp.status}` }
    const publicUrl = `${url.replace(/\/$/,'')}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeURI(objectKey)}`
    return { statusCode:200, headers:{'content-type':'application/json'}, body: JSON.stringify({ url: publicUrl }) }
  } catch (e) { return { statusCode:500, body: JSON.stringify({ error: e.message }) } }
}
function sanitize(name){ return String(name).replace(/[^a-zA-Z0-9._-]/g,'_') }
