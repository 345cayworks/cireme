import { Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Listings from './pages/Listings.jsx'
import ListingDetail from './pages/ListingDetail.jsx'
import Trends from './pages/Trends.jsx'
import Favorites from './pages/Favorites.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Partners from './pages/Partners.jsx'
import PartnerApply from './pages/PartnerApply.jsx'
import Tools from './pages/Tools.jsx'
import AgentsPortal from './pages/AgentsPortal.jsx'

function ThemeToggle(){
  function cycle(){
    const cur = document.documentElement.getAttribute('data-theme') || 'dark'
    const next = cur === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('cireme:theme', next)
  }
  const label = (document.documentElement.getAttribute('data-theme')||'dark') === 'dark' ? 'Light' : 'Dark'
  return <button className="theme-toggle" onClick={cycle} title="Toggle theme">{label} mode</button>
}

function Header(){
  const nav = useNavigate()
  return (
    <header>
      <div className="container">
        <nav>
          <Link to="/" className="brand"><img src="/logo.svg" alt="CIREME" style={{height:28}}/></Link>
          <div className="navlinks">
            <NavLink to="/listings" className={({isActive})=> isActive? "active": undefined}>Listings</NavLink>
            <NavLink to="/trends" className={({isActive})=> isActive? "active": undefined}>Market Trends</NavLink>
            <NavLink to="/tools" className={({isActive})=> isActive? "active": undefined}>Tools</NavLink>
            <NavLink to="/favorites" className={({isActive})=> isActive? "active": undefined}>Favorites</NavLink>
            <NavLink to="/partners" className={({isActive})=> isActive? "active": undefined}>Partners</NavLink>
            <NavLink to="/about" className={({isActive})=> isActive? "active": undefined}>About</NavLink>
            <ThemeToggle />
          </div>
          <button className="btn" onClick={()=>nav('/contact')}>Contact</button>
        </nav>
      </div>
    </header>
  )
}
function Footer(){
  return (
    <footer>
      <div className="container" style={{padding:'24px 0', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap'}}>
        <div className="muted">© {new Date().getFullYear()} CIREME · Cayman Islands Real Estate Market Explorer</div>
        <div className="row muted" style={{gap:16}}>
          <a href="/about" className="badge">About</a>
          <a href="/partners" className="badge">Partners</a>
          <a href="/listings" className="badge">Listings</a>
          <a href="/agents" className="badge">Agent Upload</a>
        </div>
      </div>
    </footer>
  )
}

export default function App(){
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/listings" element={<Listings/>}/>
        <Route path="/listings/:id" element={<ListingDetail/>}/>
        <Route path="/trends" element={<Trends/>}/>
        <Route path="/tools" element={<Tools/>}/>
        <Route path="/favorites" element={<Favorites/>}/>
        <Route path="/about" element={<About/>}/>
        <Route path="/contact" element={<Contact/>}/>
        <Route path="/partners" element={<Partners/>}/>
        <Route path="/partners/apply" element={<PartnerApply/>}/>
        <Route path="/agents" element={<AgentsPortal/>}/>
      </Routes>
      <Footer />
    </>
  )
}
