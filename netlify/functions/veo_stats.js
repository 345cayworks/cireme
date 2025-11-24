import * as cheerio from 'cheerio'
const SRC = 'https://www.caymanlandinfo.ky/Services/VEO/Statistics'
let CACHE = { at: 0, data: null }
const TTL_MS = 6 * 60 * 60 * 1000
export const handler = async () => {
  try {
    const now = Date.now()
    if (CACHE.data && now - CACHE.at < TTL_MS) return ok(CACHE.data, true)
    const res = await fetch(SRC, { headers: { 'user-agent': 'CIREME/1.0 NetlifyFunction', 'accept': 'text/html,application/xhtml+xml' } })
    if (!res.ok) return err(`Upstream ${res.status}`)
    const html = await res.text()
    const $ = cheerio.load(html)
    const tables = []; $('table').each((i, el) => {
      const $t = $(el)
      const caption = $t.prev('h1, h2, h3, h4, h5, h6').first().text().trim() || $t.find('caption').text().trim() || `Table ${i + 1}`
      const headers = []; const $head = $t.find('thead tr').first()
      if ($head.length) { $head.find('th,td').each((_, th) => headers.push($(th).text().trim())) }
      else { const $first = $t.find('tr').first(); $first.find('th,td').each((_, th) => headers.push($(th).text().trim())) }
      const rows = []; const $body = $t.find('tbody')
      if ($body.length) { $body.find('tr').each((_, tr) => { const row = []; $(tr).find('td,th').each((__, td) => row.push($(td).text().replace(/\s+/g,' ').trim())); if (row.length) rows.push(row) }) }
      else { const all = $t.find('tr').toArray().slice(1); all.forEach(tr => { const row = []; $(tr).find('td,th').each((__, td) => row.push($(td).text().replace(/\s+/g,' ').trim())); if (row.length) rows.push(row) }) }
      tables.push({ caption, headers, rows })
    })
    const links = []; $('a[href]').each((_, a) => { const href = $(a).attr('href') || ''; const text = $(a).text().trim(); const abs = new URL(href, SRC).toString(); if (/\.(csv|xlsx?|pdf)$/i.test(href)) links.push({ text, href: abs }) })
    const data = { fetchedAt: new Date().toISOString(), sourceUrl: SRC, tables, resources: links }
    CACHE = { at: now, data }
    return ok(data, false)
  } catch (e) { return err(e.message || 'Unknown error') }
}
function ok(payload, cached){ return { statusCode: 200, headers: { 'content-type':'application/json','cache-control':'public, max-age=0, s-maxage=21600' }, body: JSON.stringify({ cached, ...payload }) } }
function err(message){ return { statusCode: 502, body: JSON.stringify({ error: message }) } }
