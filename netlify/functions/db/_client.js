// Neon serverless client
import { neon } from '@neondatabase/serverless'
export function getDb() {
  const url = process.env.NEON_DB_URL
  if (!url) throw new Error('NEON_DB_URL not set')
  return neon(url)
}
