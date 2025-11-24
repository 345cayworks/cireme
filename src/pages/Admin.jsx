import { useEffect, useState } from 'react'
import { adminListAgents, adminUpsertAgent, adminListListings, adminDeleteListing, adminListLeads } from '../lib/api.js'

const AD_KEY = 'cireme:adminToken'

export default function Admin(){
  const [token,setToken] = useState(localStorage.getItem(AD_KEY) || '')
  const [tab,setTab] = useState('agents')
  const [agents,setAgents] = useState([])
  const [listings,setListings] = useState([])
  const [leads,setLeads] = useState([])

  async function refresh(){
    if(!token) return
    if(tab==='agents'){ setAgents(await adminListAgents(token)) }
    if(tab==='listings'){ setListings(await adminListListings(token)) }
    if(tab==='leads'){ setLeads(await adminListLeads(token)) }
  }
  useEffect(()=>{ refresh() },[token, tab])

  function saveToken(e){ e.preventDefault(); const v = new FormData(e.target).get('token'); localStorage.setItem(AD_KEY, v); setToken(v) }
  function clearToken(){ localStorage.removeItem(AD_KEY); setToken('') }

  async function upsertAgent(e){
    e.preventDefault()
    const fd = new FormData(e.target)
    const row = { id:fd.get('id'), name:fd.get('name'), email:fd.get('email'), api_key:fd.get('api_key') }
    await adminUpsertAgent(row, token); e.target.reset(); await refresh()
  }
  async function delListing(id){ if(!confirm('Delete listing?')) return; await adminDeleteListing(id, token); await refresh() }

  if(!token){
    return (
      <div className="container" style={{padding:'24px 0'}}>
        <div className="card pad">
          <h2>Admin — Sign in</h2>
          <form onSubmit={saveToken} className="grid" style={{gap:8}}>
            <input className="input" name="token" placeholder="ADMIN_TOKEN" required />
            <button className="btn" type="submit">Sign in</button>
          </form>
          <p className="muted" style={{marginTop:8}}>Set ADMIN_TOKEN in Netlify env vars.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{padding:'24px 0'}}>
      <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
        <h2>Admin</h2>
        <div className="row" style={{gap:8}}>
          <button className={`btn ${tab==='agents'?'':'outline'}`} onClick={()=>setTab('agents')}>Agents</button>
          <button className={`btn ${tab==='listings'?'':'outline'}`} onClick={()=>setTab('listings')}>Listings</button>
          <button className={`btn ${tab==='leads'?'':'outline'}`} onClick={()=>setTab('leads')}>Leads</button>
          <button className="btn outline" onClick={clearToken}>Sign out</button>
        </div>
      </div>

      {tab==='agents' && (
        <div className="grid" style={{gap:12, marginTop:12}}>
          <div className="card pad">
            <h3 style={{marginTop:0}}>Create / Update Agent</h3>
            <form onSubmit={upsertAgent} className="grid" style={{gap:8}}>
              <input className="input" name="id" placeholder="Agent ID (e.g. CIREME-AG-001)" required />
              <input className="input" name="name" placeholder="Agent name" required />
              <input className="input" type="email" name="email" placeholder="Agent email" required />
              <input className="input" name="api_key" placeholder="API Key (share with agent)" required />
              <button className="btn" type="submit">Save agent</button>
            </form>
          </div>
          <div className="card pad">
            <h3 style={{marginTop:0}}>Agents</h3>
            {agents.length ? (
              <div className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
                <strong>ID</strong><strong>Name</strong><strong>Email</strong>
                {agents.map(a=>(<>
                  <div key={a.id}>{a.id}</div><div>{a.name}</div><div>{a.email}</div>
                </>))}
              </div>
            ) : <div className="muted">No agents yet.</div>}
          </div>
        </div>
      )}

      {tab==='listings' && (
        <div className="card pad" style={{marginTop:12}}>
          <h3 style={{marginTop:0}}>All Listings</h3>
          {listings.length ? (
            <div className="grid" style={{gridTemplateColumns:'2fr 1fr 1fr auto', gap:8}}>
              <strong>Title (ID)</strong><strong>Agent</strong><strong>Price</strong><span />
              {listings.map(l=>(<>
                <div key={l.id}>{l.title} <span className="muted">({l.id})</span></div>
                <div>{l.agent_id || <span className="muted">—</span>}</div>
                <div>${Number(l.price||0).toLocaleString()}</div>
                <button className="btn outline" onClick={()=>delListing(l.id)}>Delete</button>
              </>))}
            </div>
          ) : <div className="muted">No listings.</div>}
        </div>
      )}

      {tab==='leads' && (
        <div className="card pad" style={{marginTop:12}}>
          <h3 style={{marginTop:0}}>Leads</h3>
          {leads.length ? (
            <div className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr 2fr 1fr', gap:8}}>
              <strong>Date</strong><strong>Listing</strong><strong>Name</strong><strong>Contact</strong><strong>Phone</strong>
              {leads.map(ld=>(<>
                <div key={ld.id}>{new Date(ld.created_at).toLocaleString()}</div>
                <div>{ld.listing_id}</div>
                <div>{ld.name}</div>
                <div>{ld.email}</div>
                <div>{ld.phone || '—'}</div>
              </>))}
            </div>
          ) : <div className="muted">No leads yet.</div>}
        </div>
      )}
    </div>
  )
}
