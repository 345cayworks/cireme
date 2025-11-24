import { useParams } from 'react-router-dom'
import { getAllListings } from '../lib/data.js'
import MapView from '../components/MapView.jsx'
import { submitInquiry } from '../lib/api.js'
import { useEffect, useState } from 'react'

export default function ListingDetail(){
  const { id } = useParams()
  const [item,setItem] = useState(null)
  useEffect(()=>{ getAllListings().then(rows=> setItem(rows.find(x=>x.id===id))) },[id])
  if(!item) return <div className="container" style={{padding:'24px 0'}}><h2>Loading…</h2></div>
  async function onSubmit(e){
    e.preventDefault()
    const fd = new FormData(e.target)
    const payload = Object.fromEntries(fd.entries())
    payload.listingId = item.id
    try{
      await submitInquiry(payload)
      alert('Thanks! We will contact you shortly.')
      e.target.reset()
    }catch(err){
      alert('Failed to submit inquiry. Please try again.')
    }
  }
  return (
    <div className="container" style={{padding:'24px 0'}}>
      <div className="grid cols-2">
        <div className="card">
          <img className="listimg" src={item.images?.[0]} alt={item.title}/>
        </div>
        <div className="card pad">
          <h2 style={{marginTop:0}}>{item.title}</h2>
          <div className="kpi">${(item.price||0).toLocaleString()}</div>
          <div className="meta" style={{marginTop:8}}>
            <span className="badge">{item.type}</span>
            <span className="badge">{item.district}</span>
            {item.beds ? <span>{item.beds} bd</span> : null}
            {item.baths ? <span>{item.baths} ba</span> : null}
            {item.sqft ? <span>{item.sqft.toLocaleString()} sqft</span> : null}
          </div>
          <div style={{marginTop:16}}>
            <div className="row" style={{gap:8, marginBottom:8}}>
              <a className="btn outline" href={`/tools?listingId=${item.id}`}>Projection & Mortgage Tools</a>
            </div>
            <h3>Inquire</h3>
            <form onSubmit={onSubmit} className="grid" style={{gap:8}}>
              <input className="input" name="name" placeholder="Your name" required/>
              <input className="input" type="email" name="email" placeholder="Email" required/>
              <input className="input" name="phone" placeholder="Phone"/>
              <textarea className="input" name="message" placeholder="Message" rows="4" />
              <button className="btn" type="submit">Request info</button>
            </form>
          </div>
        </div>
      </div>
      <div style={{marginTop:12}} className="card pad">
        <h3>Location</h3>
        <MapView items={[item]}/>
      </div>
    </div>
  )
}
