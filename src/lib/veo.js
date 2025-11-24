export async function getVeoStats() {
  const res = await fetch('/.netlify/functions/veo_stats', { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error('Failed to fetch VEO stats')
  return res.json()
}
