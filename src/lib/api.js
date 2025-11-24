// FILE: src/lib/api.js
function assertOk(r, tag) { if (!r.ok) throw new Error(tag || `request failed: ${r.status}`); return r }
function agentHeaders(agent){ return { "x-agent-id": agent?.id || "", "x-agent-key": agent?.key || "", accept: "application/json" } }
function toBase64(file){ return new Promise((res,rej)=>{ const rd=new FileReader(); rd.onload=()=>res(String(rd.result).split(',').pop()||""); rd.onerror=rej; rd.readAsDataURL(file) }) }

// ===== PUBLIC =====
export async function fetchListings(){
  const r = await fetch("/.netlify/functions/public_listings_get", { headers:{ accept:"application/json" }})
  await assertOk(r, "public_listings_get"); return r.json()
}
export async function submitInquiry({ listing_id, name, email, phone, message, hp_field="" }){
  const r = await fetch("/.netlify/functions/public_submit_inquiry", {
    method:"POST", headers:{ "content-type":"application/json" },
    body: JSON.stringify({ listing_id, name, email, phone, message, hp_field })
  }); await assertOk(r, "public_submit_inquiry"); return r.json()
}
export async function submitPartnerApplication({ org_name, contact_name, email, phone, message, hp_field="" }){
  const r = await fetch("/.netlify/functions/partner_apply_submit", {
    method:"POST", headers:{ "content-type":"application/json" },
    body: JSON.stringify({ org_name, contact_name, email, phone, message, hp_field })
  }); await assertOk(r, "partner_apply_submit"); return r.json()
}
// compat shim used by some pages
export async function upsertListing(row, agent){ return agentUpsertListing(row, agent) }

// ===== ADMIN =====
export async function adminListAgents(token){
  const r = await fetch("/.netlify/functions/admin_agents_list", { headers:{ "x-admin-token":token, accept:"application/json" }})
  await assertOk(r, "admin_agents_list"); return r.json()
}
export async function adminUpsertAgent(row, token){
  const r = await fetch("/.netlify/functions/admin_agents_upsert", { method:"POST", headers:{ "content-type":"application/json", "x-admin-token":token }, body: JSON.stringify(row) })
  await assertOk(r, "admin_agents_upsert"); return r.json()
}
export async function adminListListings(token){
  const r = await fetch("/.netlify/functions/admin_listings_get", { headers:{ "x-admin-token":token, accept:"application/json" }})
  await assertOk(r, "admin_listings_get"); return r.json()
}
export async function adminDeleteListing(id, token){
  const r = await fetch("/.netlify/functions/admin_listings_delete", { method:"POST", headers:{ "content-type":"application/json", "x-admin-token":token }, body: JSON.stringify({ id }) })
  await assertOk(r, "admin_listings_delete"); return r.json()
}
export async function adminListLeads(token){
  const r = await fetch("/.netlify/functions/admin_leads_get", { headers:{ "x-admin-token":token, accept:"application/json" }})
  await assertOk(r, "admin_leads_get"); return r.json()
}
export async function adminAssignListingAgent(listing_id, agent_id, token){
  const r = await fetch("/.netlify/functions/admin_listings_assign_agent", { method:"POST", headers:{ "content-type":"application/json", "x-admin-token":token }, body: JSON.stringify({ listing_id, agent_id }) })
  await assertOk(r, "admin_listings_assign_agent"); return r.json()
}
export async function adminImportCireba(token){
  const r = await fetch("/.netlify/functions/admin_import_cireba", { method:"POST", headers:{ "x-admin-token":token } })
  await assertOk(r, "admin_import_cireba"); return r.json()
}

// ===== AGENT =====
export async function agentMyListings(agent){
  const r = await fetch("/.netlify/functions/agent_listings_get", { headers: agentHeaders(agent) })
  await assertOk(r, "agent_listings_get"); return r.json()
}
export async function agentUpsertListing(row, agent){
  const r = await fetch("/.netlify/functions/agent_listings_upsert", { method:"POST", headers:{ ...agentHeaders(agent), "content-type":"application/json" }, body: JSON.stringify(row) })
  await assertOk(r, "agent_listings_upsert"); return r.json()
}
export async function agentDeleteListing(id, agent){
  const r = await fetch("/.netlify/functions/agent_listings_delete", { method:"POST", headers:{ ...agentHeaders(agent), "content-type":"application/json" }, body: JSON.stringify({ id }) })
  await assertOk(r, "agent_listings_delete"); return r.json()
}

// ===== MEDIA / CSV (Agent) =====
export async function agentUploadImage(file, agent){
  const base64 = await toBase64(file)
  const r = await fetch("/.netlify/functions/agent_image_upload", { method:"POST", headers:{ ...agentHeaders(agent), "content-type":"application/json" }, body: JSON.stringify({ filename:file.name, contentType:file.type, base64 }) })
  await assertOk(r, "agent_image_upload"); return r.json()
}
export async function agentCsvIngest(file, agent){
  const base64 = await toBase64(file)
  const r = await fetch("/.netlify/functions/agent_csv_ingest", { method:"POST", headers:{ ...agentHeaders(agent), "content-type":"application/json" }, body: JSON.stringify({ csvBase64: base64 }) })
  await assertOk(r, "agent_csv_ingest"); return r.json()
}
