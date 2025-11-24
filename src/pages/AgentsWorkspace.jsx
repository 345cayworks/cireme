import { useState, useEffect } from 'react'
import { agentMyListings, agentUpsertListing, agentDeleteListing, agentCsvIngest } from '../lib/api.js'
import ImageUploader from '../components/ImageUploader.jsx'

const AG_KEY = 'cireme:agentCreds'

function useAgent(){
  const [agent,setAgent] = useState(()=>{ try{ return JSON.parse(localStorage.getItem(AG_KEY)||'null') }catch{return null} })
  function save(a){ setAgent(a); localStorage.setItem(AG_KEY, JSON.stringify(a)) }
  function logout(){ setAgent(null); localStorage.removeItem(AG_KEY) }
  return { agent, save, logout }
}

function ListingForm({ agent, initial, onSubmit, busy }){
  const [row,setRow] = useState(initial || { id:'', title:'', price:'', beds:'', baths:'', sqft:'', type:'House', district:'George Town', lat:'', lng:'', images:[] })
  useEffect(()=>{ setRow(initial || { id:'', title:'', price:'', beds:'', baths:'', sqft:'', type:'House', district:'George Town', lat:'', lng:'', images:[] }) },[initial])
  function change(k,v){ setRow(r=>({ ...r, [k]:v })) }
  function submit(e){ e.preventDefault(); const payload = { ...row,
    price:Number(row.price||0), beds:Number(row.beds||0), baths:Number(row.baths||0), sqft:Number(row.sqft||0),
    lat: row.lat === '' ? null : Number(row.lat), lng: row.lng === '' ? null : Number(row.lng),
    images: row.images || []
  }; onSubmit(payload) }
  return (
    <form onSubmit={submit} className="grid" style={{gap:8}}>
      <input className="input" placeholder="Listing ID (unique)" value={row.id} onChange={e=>change('id',e.target.value)} required />
      <input className="input" placeholder="Title" value={row.title} onChange={e=>change('title',e.target.value)} required />
      <div className="grid cols-2" style={{gap:8}}>
        <input className="input" type="number" placeholder="Price" value={row.price} onChange={e=>change('price',e.target.value)} />
        <input className="input" placeholder="Type (Condo/House/...)" value={row.type} onChange={e=>change('type',e.target.value)} />
      </div>
      <div className="grid cols-3" style={{gap:8}}>
        <input className="input" type="number" placeholder="Beds" value={row.beds} onChange={e=>change('beds',e.target.value)} />
        <input className="input" type="number" placeholder="Baths" value={row.baths} onChange={e=>change('baths',e.target.value)} />
        <input className="input" type="number" placeholder="Sqft" value={row.sqft} onChange={e=>change('sqft',e.target.value)} />
      </div>
      <div className="grid cols-2" style={{gap:8}}>
        <input className="input" placeholder="District" value={row.district} onChange={e=>change('district',e.target.value)} />
        <div>
          <div className="muted" style={{marginBottom:6}}>Photos</div>
          <ImageUploader agent={agent} value={row.images} onChange={urls=>change('images', urls)} />
        </div>
      </div>
      <div className="grid cols-2" style={{gap:8}}>
        <input className="input" placeholder="Lat" value={row.lat} onChange={e=>change('lat',e.target.value)} />
        <input className="input" placeholder="Lng" value={row.lng} onChange={e=>change('lng',e.target.value)} />
      </div>
      <button className="btn" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save listing'}</button>
    </form>
  )
}

export default function AgentsWorkspace(){
  const { agent, save, logout } = useAgent()
  const [items,setItems] = useState([])
  const [busy,setBusy] = useState(false)
  const [edit,setEdit] = useState(null)

  async function refresh(a=agent){ if(!a) return; const rows = await agentMyListings(a); setItems(rows) }
  useEffect(()=>{ if(agent) refresh(agent) },[agent])

  async function onSave(row){
    try{ setBusy(true); await agentUpsertListing(row, agent); setEdit(null); await refresh() } finally{ setBusy(false) }
  }
  async function onDelete(id){ if(!confirm('Delete this listing?')) return; await agentDeleteListing(id, agent); await refresh() }
  async function onCSV(e){
    const file = e.target.files?.[0]; if(!file) return
    try{ setBusy(true); await agentCsvIngest(file, agent); await refresh(); alert('CSV ingested on server.') }
    finally{ setBusy(false); e.target.value = '' }
  }

  if(!agent){
    function submit(e){
      e.preventDefault()
      const fd = new FormData(e.target); const id = fd.get('id'); const key = fd.get('key')
      if(!id || !key) return alert('Enter Agent ID and API Key.')
      save({ id, key })
    }
    return (
      <div className="container" style={{padding:'24px 0'}}>
        <div className="card pad">
          <h2>Agent Workspace — Sign in</h2>
          <form onSubmit={submit} className="grid" style={{gap:8}}>
            <input className="input" name="id" placeholder="Agent ID" required />
            <input className="input" name="key" placeholder="API Key" required />
            <button className="btn" type="submit">Sign in</button>
          </form>
          <p className="muted" style={{marginTop:8}}>Ask admin for your Agent ID & API Key.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{padding:'24px 0'}}>
      <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
        <h2>Agent Workspace</h2>
        <div className="row" style={{gap:8}}>
          <span className="badge">Agent: {agent.id}</span>
          <button className="btn outline" onClick={logout}>Sign out</button>
        </div>
      </div>

      <div className="card pad" style={{marginTop:12}}>
        <h3 style={{marginTop:0}}>Create / Edit Listing</h3>
        <ListingForm agent={agent} initial={edit} onSubmit={onSave} busy={busy} />
      </div>

      <div className="card pad" style={{marginTop:12}}>
        <h3 style={{marginTop:0}}>Bulk upload (CSV)</h3>
        <p className="muted">Columns: id,title,price,beds,baths,sqft,type,district,lat,lng,images</p>
        <input type="file" accept=".csv" onChange={onCSV} />
      </div>

      <div className="card pad" style={{marginTop:12}}>
        <h3 style={{marginTop:0}}>My Listings</h3>
        {items.length ? (
          <div className="grid" style={{gridTemplateColumns:'2fr 1fr auto auto', gap:8}}>
            <strong>Title (ID)</strong><strong>Price</strong><span/><span/>
            {items.map(it=>(
              <>
                <div key={it.id}>{it.title} <span className="muted">({it.id})</span></div>
                <div>${Number(it.price||0).toLocaleString()}</div>
                <button className="btn outline" onClick={()=>setEdit({
                  id:it.id, title:it.title, price:it.price||'', beds:it.beds||'', baths:it.baths||'', sqft:it.sqft||'',
                  type:it.type||'', district:it.district||'', lat:it.lat??'', lng:it.lng??'', images:(Array.isArray(it.images)?it.images:[]) })}>
                  Edit
                </button>
                <button className="btn outline" onClick={()=>onDelete(it.id)}>Delete</button>
              </>
            ))}
          </div>
        ) : <div className="muted">No listings yet.</div>}
      </div>
    </div>
  )
}
