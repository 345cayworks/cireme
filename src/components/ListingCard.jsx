import { Link } from 'react-router-dom'
import { isFavorite, toggleFavorite } from '../lib/storage.js'
import { useState, useEffect } from 'react'

export default function ListingCard({
  item,
  showPromote = false,
  onPromote = () => {},
  onUnpromote = () => {},
  isPromoted = false,
  adminMode = false
}){
  const [fav,setFav] = useState(false)
  useEffect(()=>{ setFav(isFavorite(item.id)) },[item.id])
  function onFav(){ setFav(toggleFavorite(item.id).includes(item.id)) }

  return (
    <div className="card" style={{position:'relative', overflow:'hidden'}}>
      {adminMode && isPromoted ? (
        <div
          style={{
            position:'absolute', top:10, left:10, zIndex:2,
            background:'linear-gradient(90deg, rgba(212,175,55,.95), rgba(212,175,55,.75))',
            color:'#111', fontWeight:700, borderRadius:999, padding:'4px 10px',
            border:'1px solid rgba(0,0,0,.2)', boxShadow:'0 1px 2px rgba(0,0,0,.25)', fontSize:12
          }}
          aria-label="Promoted listing (admin view)"
          title="Promoted listing (admin view)"
        >Admin · Promoted</div>
      ) : null}

      <img className="listimg" src={item.images?.[0]} alt={item.title} />
      <div className="pad" style={{padding:16}}>
        <div className="row" style={{justifyContent:'space-between'}}>
          <strong>${(item.price||0).toLocaleString()}</strong>
          <span className="fav" onClick={onFav} title={fav ? 'Remove from favorites' : 'Save to favorites'}>{fav ? '♥' : '♡'}</span>
        </div>

        <div className="row" style={{justifyContent:'space-between', alignItems:'center', gap:8}}>
          <Link to={`/listings/${item.id}`} style={{flex:1, minWidth:0}}><h3 style={{margin:'8px 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{item.title}</h3></Link>
          {isPromoted ? <span className="badge" title="Promoted listing">Promoted</span> : null}
        </div>

        <div className="meta">
          <span className="badge">{item.type}</span>
          <span className="badge">{item.district}</span>
          {item.beds ? <span>{item.beds} bd</span> : null}
          {item.baths ? <span>{item.baths} ba</span> : null}
          {item.sqft ? <span>{item.sqft.toLocaleString()} sqft</span> : null}
        </div>

        <div className="row" style={{gap:8, marginTop:10, flexWrap:'wrap'}}>
          <Link className="btn outline" to={`/tools?listingId=${item.id}`}>Project</Link>
          <Link className="btn" to={`/listings/${item.id}`}>Details</Link>
          {showPromote && !isPromoted ? <button className="btn outline" onClick={()=>onPromote(item.id)} title="Pin this listing">Promote this</button> : null}
          {adminMode && isPromoted ? <button className="btn outline" onClick={()=>onUnpromote(item.id)} title="Unpin this listing">Unpromote</button> : null}
        </div>
      </div>
    </div>
  )
}
