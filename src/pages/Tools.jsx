
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import rppi from '../lib/rppi.json'
import { getAllListings, DISTRICTS } from '../lib/data.js'

// Minimal RPPI projection helper (5-year projection)
function getGrowthRate(district, scenario='p50'){
  // mapping rules:
  // - George Town, West Bay, Seven Mile Beach: use their own
  // - Cayman Brac, Little Cayman: map to 'Other Cayman Islands'
  // - All other districts -> 'Total Cayman Islands'
  const own = ['George Town','West Bay','Seven Mile Beach']
  const bracLittle = ['Cayman Brac','Little Cayman']
  let key = 'Total Cayman Islands'
  if (own.includes(district)) key = district
  else if (bracLittle.includes(district)) key = 'Other Cayman Islands'
  // clamp scenario key
  const s = (scenario || 'p50')
  const rec = (rppi.annualStats || {})[key] || (rppi.annualStats || {})['Total Cayman Islands']
  const v = rec?.[s] ?? rec?.p50 ?? 0.07
  return Number(v)
}

function projectValue({ price, district, years=5, scenario='p50' }){
  const r = getGrowthRate(district, scenario)
  const out = []
  let cur = Number(price||0)
  const y0 = new Date().getFullYear()
  for(let i=1;i<=years;i++){
    cur = cur * (1 + r)
    out.push({ year: y0 + i, value: cur })
  }
  return out
}

// Simple mortgage calculator
function computeMortgage({ principal, annualRate, years, taxRate=0, hoa=0 }){
  const r = (annualRate/100) / 12
  const n = years * 12
  const P = principal
  const m = r ? (P * r) / (1 - Math.pow(1 + r, -n)) : (P / n)
  const tax = (taxRate/100) * P / 12
  const total = m + tax + (hoa||0)
  return { monthly: m, taxMonthly: tax, hoa: hoa||0, total }
}

function Line({ series, w=800, h=240, pad=28, formatX }){
  if(!series || !series.length) return <div className="muted">No data</div>
  const xs = series.map(d=>d.x)
  const ys = series.map(d=>d.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const fx = x => pad + ((x - minX)/(maxX-minX || 1))*(w-2*pad)
  const fy = y => h - pad - ((y - minY)/(maxY-minY || 1))*(h-2*pad)
  const path = series.map((d,i)=>`${i?'L':'M'}${fx(d.x)},${fy(d.y)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="currentColor" opacity="0.2"/>
      <line x1={pad} y1={pad} x2={pad} y2={h-pad} stroke="currentColor" opacity="0.2"/>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
      {series.map((d,i)=>(<g key={i}><circle cx={fx(d.x)} cy={fy(d.y)} r="2.5" fill="currentColor"/></g>))}
      {series.map((d,i)=>(<text key={'t'+i} x={fx(d.x)+6} y={fy(d.y)-6} fontSize="10" className="muted">{formatX?formatX(d.x):d.x}  ${d.y.toLocaleString(undefined,{maximumFractionDigits:0})}</text>))}
    </svg>
  )
}

export default function Tools(){
  const [params] = useSearchParams()
  const [listing, setListing] = useState(null)
  const listingId = params.get('listingId') || ''

  const [price, setPrice] = useState('')
  const [district, setDistrict] = useState('George Town')
  const [scenario, setScenario] = useState('p50')
  const [years, setYears] = useState(5)

  const [rate, setRate] = useState(6.5)
  const [term, setTerm] = useState(25)
  const [downPct, setDownPct] = useState(20)
  const [hoa, setHoa] = useState(0)
  const [taxRate, setTaxRate] = useState(0)

  useEffect(()=>{
    if(!listingId){ setListing(null); return }
    getAllListings().then(rows=>{
      const row = rows.find(r => r.id === listingId)
      if (row){
        setListing(row)
        setPrice(String(row.price||''))
        setDistrict(row.district || 'George Town')
      }
    })
  },[listingId])

  const proj = useMemo(()=>{
    const basePrice = Math.max(0, Number(price||0))
    const pts = projectValue({ price: basePrice, district, years: Number(years||5), scenario })
    return pts
  },[price, district, years, scenario])

  const mortgage = useMemo(()=>{
    const P = Math.max(0, Number(price||0)) * (1 - (Number(downPct||0)/100))
    return computeMortgage({ principal: P, annualRate: Number(rate||0), years: Number(term||25), taxRate: Number(taxRate||0), hoa: Number(hoa||0) })
  },[price, rate, term, downPct, hoa, taxRate])

  return (
    <div className="container" style={{padding:'24px 0'}}>
      <div className="grid cols-2">
        <div className="card pad">
          <h2 style={{marginTop:0}}>Value Projection</h2>
          <div className="row wrap" style={{gap:12, marginTop:8}}>
            <input className="input" type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} placeholder="Current price (USD)" />
            <select value={district} onChange={e=>setDistrict(e.target.value)}>
              {DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
            <select value={scenario} onChange={e=>setScenario(e.target.value)} title="Choose growth percentile">
              <option value="p10">Conservative (P10)</option>
              <option value="p50">Median (P50)</option>
              <option value="p90">Optimistic (P90)</option>
            </select>
            <select value={years} onChange={e=>setYears(e.target.value)}>
              {[1,3,5,7,10].map(y=><option key={y} value={y}>{y}y</option>)}
            </select>
            {listing ? <span className="badge">From listing: <Link to={`/listings/${listing.id}`}>{listing.id}</Link></span> : null}
          </div>

          <div className="card pad" style={{marginTop:12}}>
            <h3 style={{marginTop:0}}>Projection ({scenario.toUpperCase()})</h3>
            <Line
              series={proj.map(p=>({ x: p.year, y: p.value }))}
              formatX={(x)=>String(Math.round(x))}
            />
          </div>

          <div className="card pad" style={{marginTop:12}}>
            <h3 style={{marginTop:0}}>Table</h3>
            <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:8}}>
              <strong>Year</strong><strong>Projected Value</strong>
              {proj.map(p=>(<><div key={'y'+p.year}>{p.year}</div><div key={'v'+p.year}>${p.value.toLocaleString(undefined,{maximumFractionDigits:0})}</div></>))}
            </div>
          </div>
        </div>

        <div className="card pad">
          <h2 style={{marginTop:0}}>Mortgage Calculator</h2>
          <div className="grid" style={{gap:8}}>
            <label>Purchase Price<input className="input" type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} /></label>
            <label>Down Payment (%)<input className="input" type="number" min="0" max="100" value={downPct} onChange={e=>setDownPct(e.target.value)} /></label>
            <label>Rate (% APR)<input className="input" type="number" step="0.01" value={rate} onChange={e=>setRate(e.target.value)} /></label>
            <label>Term (years)<input className="input" type="number" min="1" value={term} onChange={e=>setTerm(e.target.value)} /></label>
            <label>HOA / Insurance (monthly)<input className="input" type="number" min="0" value={hoa} onChange={e=>setHoa(e.target.value)} /></label>
            <label>Property tax (% of price / yr)<input className="input" type="number" min="0" step="0.01" value={taxRate} onChange={e=>setTaxRate(e.target.value)} /></label>
          </div>
          <div className="card pad" style={{marginTop:12}}>
            <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:8}}>
              <div className="muted">Loan amount</div><div><strong>${(Math.max(0, Number(price||0))*(1-Number(downPct||0)/100)).toLocaleString(undefined,{maximumFractionDigits:0})}</strong></div>
              <div className="muted">Principal+Interest</div><div><strong>${mortgage.monthly.toLocaleString(undefined,{maximumFractionDigits:0})}</strong>/mo</div>
              <div className="muted">Taxes</div><div>${mortgage.taxMonthly.toLocaleString(undefined,{maximumFractionDigits:0})}/mo</div>
              <div className="muted">HOA/Ins</div><div>${mortgage.hoa.toLocaleString(undefined,{maximumFractionDigits:0})}/mo</div>
              <div className="muted">Estimated Monthly</div><div className="kpi">${mortgage.total.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
            </div>
          </div>
          <p className="muted" style={{marginTop:8}}>Estimates only. Confirm terms with your lender.</p>
        </div>
      </div>
    </div>
  )
}
