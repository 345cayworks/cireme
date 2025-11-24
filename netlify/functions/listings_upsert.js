import { getDb } from './db/_client.js'
export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST' && event.httpMethod !== 'PUT') return { statusCode: 405, body: 'Method not allowed' }
    const token = event.headers['x-admin-token'] || event.headers['X-Admin-Token']
    if (!token || token !== process.env.ADMIN_TOKEN) return { statusCode: 401, body: 'Unauthorized' }
    const payload = JSON.parse(event.body || '{}')
    const { id, title, price, beds, baths, sqft, type, district, lat, lng, images = [] } = payload
    if (!id || !title) return { statusCode: 400, body: 'id and title are required' }
    const sql = getDb()
    await sql(`
      INSERT INTO listings (id, title, price, beds, baths, sqft, type, district, lat, lng, images)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        price = EXCLUDED.price,
        beds = EXCLUDED.beds,
        baths = EXCLUDED.baths,
        sqft = EXCLUDED.sqft,
        type = EXCLUDED.type,
        district = EXCLUDED.district,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        images = EXCLUDED.images,
        updated_at = NOW()
    `, [id, title, price||0, beds||0, baths||0, sqft||0, type||'House', district||'George Town', lat ?? null, lng ?? null, images])
    return { statusCode: 200, body: JSON.stringify({ ok: true, id }) }
  } catch (e) { return { statusCode: 500, body: JSON.stringify({ error: e.message }) } }
}
