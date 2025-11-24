import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'
import { listings } from '../lib/data.js'
export default function Home(){
  const featured = listings.slice(0,3)
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Find your place in the Cayman Islands</h1>
          <p className="muted">Data‑driven insights, beautiful listings, and market transparency.</p>
          <SearchBar />
        </div>
      </section>
      <section className="container" style={{padding:'24px 0'}}>
        <h2>Featured Listings</h2>
        <div className="results" style={{marginTop:12}}>
          {featured.map(f=>(
            <div key={f.id} className="card">
              <Link to={`/listings/${f.id}`}><img className="listimg" src={f.images[0]} alt={f.title}/></Link>
              <div className="pad" style={{padding:16}}>
                <strong>${f.price.toLocaleString()}</strong>
                <h3 style={{margin:'6px 0'}}>{f.title}</h3>
                <div className="muted">{f.district}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:16}}><Link to="/listings" className="btn outline">Browse all listings</Link></div>
      </section>
    </>
  )
}
