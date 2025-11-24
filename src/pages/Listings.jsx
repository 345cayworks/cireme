import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import Filters from '../components/Filters.jsx'
import { getAllListings } from '../lib/data.js'
import ListingCard from '../components/ListingCard.jsx'
import MapView from '../components/MapView.jsx'

const PROMO_KEY = 'cireme:promotedId'
const ADMIN_KEY = 'cireme:admin'

function applyFilters(data, qp){
  const q = (qp.get('q')||'').toLowerCase()
  const district = qp.get('district')||''
  const type = qp.get('type')||''
  const beds = parseInt(qp.get('beds')||'0', 10)
  const priceMin = parseInt(qp.get('priceMin')||'0',10)
  const priceMax = parseInt(qp.get('priceMax')||'0',10)
  const features = new Set((qp.get('features')||'').split(',').filter(Boolean))
  return data.filter(x=>{
    if(q && !(x.title.toLowerCase().includes(q) || (x.id||'').toLowerCase().includes(q))) return false
    if(district && x.district !== district) return false
    if(type && x.type !== type) return false
    if(beds && (x.beds||0) < beds) return false
    if(priceMin && (x.price||0) < priceMin) return false
    if(priceMax && (x.price||0) > priceMax) return false
    if(features.size && ![...features].every(f=>x.features?.includes(f))) return false
    return true
  })
}

export default function Listings(){
  const [params, setParams] = useSearchParams()
  const [items,setItems] = useState([])
  const [promotedId, setPromotedId] = useState(localStorage.getItem(PROMO_KEY) || '')
  const [adminMode, setAdminMode] = useState(localStorage.getItem(ADMIN_KEY) === '1')

  useEffect(()=>{
    let changed=false
    const p = params.get('promote')
    if(p){ localStorage.setItem(PROMO_KEY, p); setPromotedId(p); params.delete('promote'); changed=true }
    const adm = params.get('admin')
    if(adm==='1'){ localStorage.setItem(ADMIN_KEY, '1'); setAdminMode(true); params.delete('admin'); changed=true }
    if(changed) setParams(params, { replace: true })
  }, [params, setParams])

  useEffect(()=>{ getAllListings().then(rows=> setItems(applyFilters(rows, params))) },[params])

  const count = items.length
  const promoted = useMemo(()=> items.find(x => x.id === promotedId) || null, [items, promotedId])
  const visible = useMemo(()=> items.filter(x => x.id !== promotedId), [items, promotedId])

  function adminSetPromoted(){
    const id = prompt('Enter Listing ID to promote:', promotedId || (items[0]?.id || ''))
    if(!id) return
    localStorage.setItem(PROMO_KEY, id)
    setPromotedId(id)
  }
  function adminClearPromoted(){
    localStorage.removeItem(PROMO_KEY)
    setPromotedId('')
  }
  function toggleAdmin(e){
    const on = e.target.checked
    setAdminMode(on)
    localStorage.setItem(ADMIN_KEY, on ? '1' : '0')
  }
  function handlePromote(id){ localStorage.setItem(PROMO_KEY, id); setPromotedId(id) }
  function handleUnpromote(){ localStorage.removeItem(PROMO_KEY); setPromotedId('') }

  return (
    <div className="container" style={{padding:'24px 0'}}>
      <SearchBar />

      <div className="card pad" style={{marginTop:12}}>
        <h3 style={{marginTop:0}}>Map</h3>
        <MapView items={items}/>
      </div>

      <div className="card pad" style={{marginTop:12}}>
        <div className="row wrap" style={{justifyContent:'space-between'}}>
          <div className="row wrap" style={{gap:8}}>
            {[...params.entries()].filter(([_,v])=>v).map(([k,v])=><span key={k} className="badge">{k}:{v}</span>)}
          </div>
          <div className="row wrap" style={{gap:8, alignItems:'center'}}>
            <div className="muted">{count} result{count!==1?'s':''}</div>
            <label className="row" style={{gap:8}}>
              <input type="checkbox" checked={adminMode} onChange={toggleAdmin} />
              <span className="muted">Admin mode</span>
            </label>
            <button className="btn outline" onClick={adminSetPromoted} title="Set Promoted Listing ID">Set promoted</button>
            {promotedId ? <button className="btn outline" onClick={adminClearPromoted} title="Remove promoted listing">Clear</button> : null}
            {promotedId ? <span className="badge">Promoted: {promotedId}</span> : null}
          </div>
        </div>
        <div style={{marginTop:12}}><Filters/></div>
      </div>

      <div className="grid" style={{gridTemplateColumns:'3fr 1fr', gap:16, marginTop:12}}>
        <div>
          <div className="results">
            {visible.map(item=>(
              <ListingCard
                key={item.id}
                item={item}
                showPromote={adminMode}
                onPromote={handlePromote}
                onUnpromote={handleUnpromote}
                isPromoted={item.id === promotedId}
                adminMode={adminMode}
              />
            ))}
          </div>
        </div>
        <aside>
          <div className="card pad" style={{marginBottom:12}}>
            <h3 style={{marginTop:0}}>Promoted Listing</h3>
            <p className="muted">Use Admin mode, the button on a card, or <code>?promote=&lt;ID&gt;</code>.</p>
          </div>
          {promoted ? (
            <ListingCard
              item={promoted}
              showPromote={adminMode}
              onPromote={handlePromote}
              onUnpromote={handleUnpromote}
              isPromoted={true}
              adminMode={adminMode}
            />
          ) : (
            <div className="card pad">No promoted listing.</div>
          )}
        </aside>
      </div>
    </div>
  )
}
