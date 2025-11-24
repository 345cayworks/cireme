export function requireAdmin(event) {
  const token = event.headers['x-admin-token'] || event.headers['X-Admin-Token']
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return { ok: false, res: { statusCode: 401, body: 'Unauthorized (admin)' } }
  }
  return { ok: true }
}
export function getAgentCreds(event) {
  const id  = event.headers['x-agent-id']  || event.headers['X-Agent-Id']
  const key = event.headers['x-agent-key'] || event.headers['X-Agent-Key']
  if (!id || !key) return { ok:false, res: { statusCode: 401, body: 'Unauthorized (agent headers missing)' } }
  return { ok:true, id, key }
}
