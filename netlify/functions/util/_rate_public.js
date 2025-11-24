// IP-based rate limiting for public endpoints (uses api_hits table)
import { getDb } from '../db/_client.js'
const WINDOW_SEC = 60, MAX_PER_WINDOW = 30
const HOUR_SEC = 3600, MAX_PER_HOUR = 300
export async function rateLimitPublic({ funcName, ip }){
  const sql = getDb()
  const now = new Date()
  const winFrom = new Date(now.getTime() - WINDOW_SEC * 1000).toISOString()
  const hourFrom = new Date(now.getTime() - HOUR_SEC * 1000).toISOString()
  const agentId = `public:${ip || 'unknown'}`
  await sql(`INSERT INTO api_hits (agent_id, func, ip) VALUES ($1,$2,$3)`, [agentId, funcName, ip || null])
  const [win, hour] = await Promise.all([
    sql(`SELECT COUNT(*)::int AS c FROM api_hits WHERE agent_id=$1 AND func=$2 AND ts>= $3`, [agentId, funcName, winFrom]),
    sql(`SELECT COUNT(*)::int AS c FROM api_hits WHERE agent_id=$1 AND func=$2 AND ts>= $3`, [agentId, funcName, hourFrom])
  ])
  if (win[0].c > MAX_PER_WINDOW) return { allowed:false, code:429, msg:`Too many requests (>${MAX_PER_WINDOW}/min)` }
  if (hour[0].c > MAX_PER_HOUR) return { allowed:false, code:429, msg:`Too many requests (>${MAX_PER_HOUR}/hour)` }
  return { allowed:true }
}
