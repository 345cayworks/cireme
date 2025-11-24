import { useState, useEffect } from 'react'
import { DISTRICTS, TYPES } from '../lib/data.js'
import { useSearchParams, useNavigate } from 'react-router-dom'

export default function SearchBar(){
  const [q,setQ] = useState('')
  const [district,setDistrict] = useState('')
  const [type,setType] = useState('')
  const [priceMin,setPriceMin] = useState('')
  const [priceMax,setPriceMax] = useState('')
  const [beds,setBeds] = useState('')
  const nav = useNavigate()
  const [params] = useSearchParams()
  useEffect(()=>{
    setQ(params.get('q')||'')
    setDistrict(params.get('district')||'')
    setType(params.get('type')||'')
    setPriceMin(params.get('priceMin')||'')
    setPriceMax(params.get('priceMax')||'')
    setBeds(params.get('beds')||'')
  },[params])
  function submit(e){
    e.preventDefault()
    const qp = new URLSearchParams()
    if(q) qp.set('q', q)
    if(district) qp.set('district', district)
    if(type) qp.set('type', type)
    if(priceMin) qp.set('priceMin', priceMin)
    if(priceMax) qp.set('priceMax', priceMax)
    if(beds) qp.set('beds', beds)
    nav(`/listings?${qp.toString()}`)
  }
  return (
    <form onSubmit={submit} className="grid cols-3 card pad" style={{gap:12}}>
      <input className="input" placeholder="Search by title, address, MLS#…" value={q} onChange={e=>setQ(e.target.value)} />
      <div className="row" style={{gap:12}}>
        <select value={district} onChange={e=>setDistrict(e.target.value)}>
          <option value="">All Districts</option>
          {DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <select value={type} onChange={e=>setType(e.target.value)}>
          <option value="">All Types</option>
          {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="row" style={{gap:12}}>
        <input className="input" type="number" min="0" placeholder="Min $" value={priceMin} onChange={e=>setPriceMin(e.target.value)} />
        <input className="input" type="number" min="0" placeholder="Max $" value={priceMax} onChange={e=>setPriceMax(e.target.value)} />
        <select value={beds} onChange={e=>setBeds(e.target.value)}>
          <option value="">Beds</option>
          {[0,1,2,3,4,5].map(b=><option key={b} value={b}>{b}+</option>)}
        </select>
        <button className="btn" type="submit">Search</button>
      </div>
    </form>
  )
}
