# CIREME — Supabase + Neon Overlay

Unzip into your repo root and allow overwrite/add. Then update two files:

## 1) `src/lib/api.js`
Append these helpers if missing:
```js
function agentHeaders(agent){ return { 'x-agent-id':agent?.id||'', 'x-agent-key':agent?.key||'', accept:'application/json' } }

export async function adminListAgents(t){ const r = await fetch('/.netlify/functions/admin_agents_list',{ headers:{'x-admin-token':t,accept:'application/json'} }); if(!r.ok) throw new Error('admin_agents_list'); return r.json() }
export async function adminUpsertAgent(row,t){ const r = await fetch('/.netlify/functions/admin_agents_upsert',{ method:'POST', headers:{'content-type':'application/json','x-admin-token':t}, body:JSON.stringify(row) }); if(!r.ok) throw new Error('admin_agents_upsert'); return r.json() }
export async function adminListListings(t){ const r = await fetch('/.netlify/functions/admin_listings_get',{ headers:{'x-admin-token':t,accept:'application/json'} }); if(!r.ok) throw new Error('admin_listings_get'); return r.json() }
export async function adminDeleteListing(id,t){ const r = await fetch('/.netlify/functions/admin_listings_delete',{ method:'POST', headers:{'content-type':'application/json','x-admin-token':t}, body:JSON.stringify({id}) }); if(!r.ok) throw new Error('admin_listings_delete'); return r.json() }
export async function adminListLeads(t){ const r = await fetch('/.netlify/functions/admin_leads_get',{ headers:{'x-admin-token':t,accept:'application/json'} }); if(!r.ok) throw new Error('admin_leads_get'); return r.json() }

export async function agentMyListings(a){ const r = await fetch('/.netlify/functions/agent_listings_get',{ headers:agentHeaders(a) }); if(!r.ok) throw new Error('agent_listings_get'); return r.json() }
export async function agentUpsertListing(row,a){ const r = await fetch('/.netlify/functions/agent_listings_upsert',{ method:'POST', headers:{...agentHeaders(a),'content-type':'application/json'}, body:JSON.stringify(row) }); if(!r.ok) throw new Error('agent_listings_upsert'); return r.json() }
export async function agentDeleteListing(id,a){ const r = await fetch('/.netlify/functions/agent_listings_delete',{ method:'POST', headers:{...agentHeaders(a),'content-type':'application/json'}, body:JSON.stringify({id}) }); if(!r.ok) throw new Error('agent_listings_delete'); return r.json() }

function toBase64(file){ return new Promise((res,rej)=>{ const rd=new FileReader(); rd.onload=()=>res(String(rd.result).split(',').pop()||''); rd.onerror=rej; rd.readAsDataURL(file) }) }
export async function agentUploadImage(file,a){ const base64 = await toBase64(file); const r = await fetch('/.netlify/functions/agent_image_upload',{ method:'POST', headers:{...agentHeaders(a),'content-type':'application/json'}, body:JSON.stringify({ filename:file.name, contentType:file.type, base64 }) }); if(!r.ok) throw new Error('agent_image_upload'); return r.json() }
export async function agentCsvIngest(file,a){ const base64 = await toBase64(file); const r = await fetch('/.netlify/functions/agent_csv_ingest',{ method:'POST', headers:{...agentHeaders(a),'content-type':'application/json'}, body:JSON.stringify({ csvBase64: base64 }) }); if(!r.ok) throw new Error('agent_csv_ingest'); return r.json() }
```

## 2) `src/App.jsx`
Add imports and routes:
```js
import AgentsWorkspace from './pages/AgentsWorkspace.jsx'
import Admin from './pages/Admin.jsx'
// ...
<Routes>
  {/* ...existing routes... */}
  <Route path="/agents/workspace" element={<AgentsWorkspace/>}/>
  <Route path="/admin" element={<Admin/>}/>
</Routes>
```

## 3) Env variables (Netlify)
```
NEON_DB_URL=postgres://user:pass@host/dbname?sslmode=require
ADMIN_TOKEN=<strong-admin-token>

STORAGE_PROVIDER=supabase
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_BUCKET=cireme-media
```

## 4) DB schema
Run `db/schema.sql` in Neon SQL editor (create tables + indexes).

## 5) package.json (ensure deps)
- react-router-dom
- @neondatabase/serverless
- cheerio
(install if missing)

## 6) Build/Deploy
```
npm i
npm run build
# Netlify: Publish dir = dist, Functions dir = netlify/functions
```

Done. Visit `/admin` (use ADMIN_TOKEN) to add agents, then `/agents/workspace` to manage listings.
