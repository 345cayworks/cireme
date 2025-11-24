import { Link } from 'react-router-dom'
export default function Partners(){
  return (
    <div className="container" style={{padding:'24px 0'}}>
      <div className="card pad">
        <h2>Partner with CIREME</h2>
        <p className="muted">We welcome Banks, Agents/Brokerages, Valuators/Appraisers, and Advertisers.</p>
        <div className="row wrap" style={{gap:8, marginTop:12}}>
          <Link to="/partners/apply?role=bank" className="btn">Bank — Apply</Link>
          <Link to="/partners/apply?role=agent" className="btn outline">Agent/Broker — Apply</Link>
          <Link to="/partners/apply?role=valuator" className="btn outline">Valuator — Apply</Link>
          <Link to="/partners/apply?role=advertiser" className="btn outline">Advertiser — Apply</Link>
        </div>
        <div className="muted" style={{marginTop:12}}>Agents can also <a href="/agents">upload listings (CSV)</a> for preview.</div>
      </div>
    </div>
  )
}
