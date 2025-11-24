import { getFavorites } from '../lib/storage.js'
import { getAllListings } from '../lib/data.js'
import ListingCard from '../components/ListingCard.jsx'
import { useEffect, useState } from 'react'

export default function Favorites(){
  const [items,setItems] = useState([])
  useEffect(()=>{ getAllListings().then(rows=>{
    const favs = new Set(getFavorites())
    setItems(rows.filter(x=>favs.has(x.id)))
  }) },[])
  return (
    <div className="container" style={{padding:'24px 0'}}>
      <h2>Saved Homes</h2>
      <div className="results" style={{marginTop:12}}>
        {items.length ? items.map(it=><ListingCard key={it.id} item={it}/>) : <div className="card pad">No favorites yet.</div>}
      </div>
    </div>
  )
}
