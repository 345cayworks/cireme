import { getDb } from './db/_client.js'
export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
    const payload = JSON.parse(event.body || '{}')
    const { listingId, name, email, phone, message } = payload
    if (!listingId || !name || !email) return { statusCode: 400, body: 'listingId, name, email required' }
    const sql = getDb()
    await sql(`INSERT INTO leads (listing_id, name, email, phone, message) VALUES ($1,$2,$3,$4,$5)`, [listingId, name, email, phone || null, message || null])
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (e) { return { statusCode: 500, body: JSON.stringify({ error: e.message }) } }
}
