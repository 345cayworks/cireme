import React, { useMemo, useState, useEffect } from 'react'
import rppiTS from '../lib/datafeeds/rppi_timeseries.json'
import kpis from '../lib/datafeeds/kpis.json'
import tx from '../lib/datafeeds/transactions_monthly.json'
import { getVeoStats } from '../lib/veo.js'

function Line({ series, w=800, h=240, pad=28, label, seriesB, showB=true, formatX }){
  if(!series || series.length < 2) return <div className="muted">Not enough data</div>
  const xs = [...series, ...(showB && seriesB ? seriesB : [])].map(d=>d.x)
  const ys = [...series, ...(showB && seriesB ? seriesB : [])].map(d=>d.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const fx = x => pad + ( (x - minX) / (maxX - minX || 1) ) * (w - 2*pad)
  const fy = y => h - pad - ( (y - minY) / (maxY - minY || 1) ) * (h - 2*pad)
  const path = series.map((d,i)=>`${i?'L':'M'}${fx(d.x)},${fy(d.y)}`).join(' ')
  const pathB = seriesB && seriesB.length ? seriesB.map((d,i)=>`${i?'L':'M'}${fx(d.x)},${fy(d.y)}`).join(' ') : null
  const ticks = Array.from({length:5}, (_,i)=>minY + i*(maxY-minY)/4)

  const [hover, setHover] = React.useState(null)
  const rafRef = React.useRef(0)
  function onMove(e){
    if(rafRef.current) return
    rafRef.current = requestAnimationFrame(()=> {
      rafRef.current = 0
      const svg = e.currentTarget
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
      const ctm = svg.getScreenCTM().inverse(); const sp = pt.matrixTransform(ctm)
      const xVal = minX + ((sp.x - pad) / ((w - 2*pad) || 1)) * (maxX - minX)
      const nearest = series.reduce((acc, d) => { const dist = Math.abs(d.x - xVal); return dist < acc.dist ? { d, dist } : acc }, { d: series[0], dist: Infinity })
      const bpt = (showB && seriesB && seriesB.length) ? seriesB.reduce((acc, d) => { const dist = Math.abs(d.x - nearest.d.x); return dist < acc.dist ? { d, dist } : acc }, { d: seriesB[0], dist: Infinity }) : null
      setHover({ a: nearest.d, b: bpt ? bpt.d : null })
    })
  }
  function onLeave(){ setHover(null) }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} aria-label={label || 'chart'} onMouseMove={onMove} onMouseLeave={onLeave}>
      <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad} stroke="currentColor" opacity="0.2"/>
      <line x1={pad} y1={pad} x2={pad} y2={h-pad} stroke="currentColor" opacity="0.2"/>
      {ticks.map((t,i)=>(<g key={i}>
        <line x1={pad} y1={h - ( (t-minY)/(maxY-minY || 1) )*(h-2*pad) - pad} x2={w-pad} y2={h - ( (t-minY)/(maxY-minY || 1) )*(h-2*pad) - pad} stroke="currentColor" opacity="0.08"/>
        <text x={w-pad+6} y={h - ( (t-minY)/(maxY-minY || 1) )*(h-2*pad) - pad} fontSize="10" className="muted">{t.toFixed(0)}</text>
      </g>))}
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" />
      {showB && pathB ? (<path d={pathB} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55" strokeDasharray="6 6" />) : null}
      <rect x={pad} y={pad} width={w-2*pad} height={h-2*pad} fill="transparent" />
      {hover ? (
        <g>
          <line x1={pad + ((hover.a.x - minX)/(maxX-minX || 1))*(w-2*pad)} y1={pad} x2={pad + ((hover.a.x - minX)/(maxX-minX || 1))*(w-2*pad)} y2={h-pad} stroke="currentColor" opacity="0.3" />
          <circle cx={pad + ((hover.a.x - minX)/(maxX-minX || 1))*(w-2*pad)} cy={fy(hover.a.y)} r="3" fill="currentColor" />
          {hover.b ? <circle cx={pad + ((hover.a.x - minX)/(maxX-minX || 1))*(w-2*pad)} cy={fy(hover.b.y)} r="3" fill="currentColor" opacity="0.6" /> : null}
        </g>
      ) : null}
    </svg>
  )
}

export default function Trends(){
  const districts = useMemo(()=>{
    const sample = (rppiTS.records||[]).find(Boolean) || {}
    const keys = Object.keys(sample).filter(k=>k.startsWith('index::')).map(k=>k.replace('index::',''))
    return Array.from(new Set(keys)).sort()
  },[])
  const [selected, setSelected] = useState('Total Cayman Islands')
  const rppiSeries = useMemo(()=>{
    const key = 'index::' + selected
    const rows = (rppiTS.records||[]).filter(r => r[key] && (r.year ?? null) !== null)
    return rows.sort((a,b)=>a.year-b.year).map(r=>({ x: r.year, y: r[key] }))
  },[selected])

  const txSeriesRaw = useMemo(()=>{
    const parseX = (d)=>{ const [y,m] = String(d).split('-').map(n=>parseInt(n,10)); return y + (m-1)/12 }
    const rows = (tx.series||[]).map(r=>({ x: parseX(r.date), y: r.transactions }))
    return rows.sort((a,b)=>a.x-b.x)
  },[])

  const [veo, setVeo] = useState(null)
  const [showOverlay, setShowOverlay] = useState(true)
  useEffect(()=>{ getVeoStats().then(setVeo).catch(()=>setVeo({ error:true })) },[])
  function extractMonthlyVeo(stats){
    if(!stats || !stats.tables) return { year:null, series:[] }
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
    let best = { year:null, series:[] }
    for(const t of stats.tables){
      const headers = (t.headers||[]).map(h=>String(h||'').trim().toLowerCase())
      const monthCols = headers.map((h,i)=> months.find(m=>h.startsWith(m)) ? i : -1).filter(i=>i>=0)
      if(!monthCols.length) continue
      let latestRow = null, latestYear = null
      for(const r of (t.rows||[])){
        const y = parseInt((r[0]||'').replace(/[^0-9]/g,''),10)
        if(!isNaN(y) && (latestYear===null || y>latestYear)){ latestYear=y; latestRow=r }
      }
      if(latestYear===null){
        const ycap = parseInt(String(t.caption||'').replace(/[^0-9]/g,''),10)
        latestYear = isNaN(ycap) ? null : ycap
      }
      let values = []
      if(latestRow){
        values = monthCols.map(ci => parseFloat(String(latestRow[ci]||'').replace(/[^0-9.\-]/g,'')) || 0)
      }else{
        const sums = new Array(monthCols.length).fill(0)
        for(const r of (t.rows||[])){
          monthCols.forEach((ci,idx)=>{
            const v = parseFloat(String(r[ci]||'').replace(/[^0-9.\-]/g,'')) || 0
            sums[idx]+=v
          })
        }
        values = sums
      }
      if(values.some(v=>v>0)){
        const year = latestYear || new Date().getFullYear()
        const series = values.map((v,i)=>({ x: year + i/12, y: v }))
        if(!best.year || year>=best.year) best = { year, series }
      }
    }
    return best
  }
  const veoMonthly = useMemo(()=> extractMonthlyVeo(veo), [veo])

  const txSeries = useMemo(()=>{
    if(!veoMonthly?.year) return txSeriesRaw
    const y = veoMonthly.year
    return txSeriesRaw.filter(pt => pt.x >= y && pt.x < (y+1))
  },[txSeriesRaw, veoMonthly])

  function toCSV(rows, header){
    const esc = v => '"' + String(v).replaceAll('"','""') + '"'
    return header.join(',') + '\n' + rows.map(r=> r.map(esc).join(',')).join('\n')
  }
  function download(name, text){
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], {type:'text/csv'}))
    a.download = name
    document.body.appendChild(a); a.click(); a.remove()
  }
  function fmtMonthX(x){
    const y = Math.floor(x); const m = Math.round((x - y)*12) + 1; return `${y}-${String(m).padStart(2,'0')}`
  }
  function downloadRPPI(){ download(`rppi_${selected.replace(/\s+/g,'_')}.csv`, toCSV(rppiSeries.map(p=>[p.x, p.y]), ['Year','RPPI'])) }
  function downloadTx(){
    const map = new Map()
    txSeries.forEach(p=>{ map.set(p.x.toFixed(6), { x: p.x, a: p.y, b: '' }) })
    if(veoMonthly?.series?.length){
      veoMonthly.series.forEach(p=>{
        const k = p.x.toFixed(6)
        const prev = map.get(k) || { x: p.x, a: '', b: '' }
        prev.b = p.y
        map.set(k, prev)
      })
    }
    const rows = [...map.values()].sort((u,v)=>u.x - v.x).map(r=>[fmtMonthX(r.x), r.a, r.b])
    download('transactions_monthly_overlay.csv', toCSV(rows, ['Month','XLSX','VEO']))
  }

  const Swatch = ({ dashed=false, label }) => (
    <span className="row" style={{gap:6, alignItems:'center'}}>
      <svg width="22" height="10" aria-hidden="true">
        <line x1="0" y1="6" x2="22" y2="6" stroke="currentColor" strokeWidth="3" {...(dashed ? { strokeDasharray: "6 6", opacity: 0.55 } : {})} />
      </svg>
      <span className="muted">{label}</span>
    </span>
  )

  return (
    <div className="container" style={{padding:'24px 0'}}>
      <h2>Market Trends</h2>
      <div className="grid cols-3" style={{marginTop:12}}>
        <div className="card pad">
          <div className="muted">RPPI (Total Cayman Islands)</div>
          <div className="kpi">{kpis.rppi_total_latest ? kpis.rppi_total_latest.toFixed(0) : '—'}</div>
          <div className="muted">{kpis.rppi_total_yoy ? `${(kpis.rppi_total_yoy*100).toFixed(2)}% YoY` : ''}</div>
        </div>
        <div className="card pad"><div className="muted">Source</div><div className="kpi">RPPI + Lands & Survey + VEO</div><div className="muted">as provided</div></div>
        <div className="card pad">
          <div className="muted">RPPI District</div>
          <select className="input" value={selected} onChange={e=>setSelected(e.target.value)}>
            {districts.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="card pad" style={{marginTop:12}}>
        <h3 style={{marginTop:0}}>RPPI — {selected}</h3>
        <div className="row" style={{gap:8, margin:'4px 0 8px'}}>
          <span className="badge">Legend</span>
          <Swatch label="RPPI Index (yearly)" />
        </div>
        <div className="row" style={{gap:8, marginBottom:8}}>
          <button className="btn outline" onClick={downloadRPPI}>Download CSV</button>
        </div>
        <Line series={rppiSeries} label={`RPPI Index for ${selected} (yearly)`} formatX={(x)=>String(Math.round(x))} />
      </div>

      <div className="card pad" style={{marginTop:12}}>
        <h3 style={{marginTop:0}}>Monthly Transactions — All Districts</h3>
        <div className="row" style={{gap:12, margin:'4px 0 8px', alignItems:'center'}}>
          <span className="badge">Legend</span>
          <Swatch label="XLSX (monthly)" />
          <Swatch dashed label="VEO (monthly, latest year)" />
          <label className="row" style={{gap:8, marginLeft:'12px', alignItems:'center'}}>
            <input type="checkbox" checked={showOverlay} onChange={e=>setShowOverlay(e.target.checked)} />
            <span className="muted">Show VEO overlay</span>
          </label>
        </div>
        <div className="row" style={{gap:8, marginBottom:8}}>
          <button className="btn outline" onClick={downloadTx}>Download CSV</button>
        </div>
        <Line
          series={txSeries}
          seriesB={veoMonthly.series||[]}
          showB={showOverlay}
          label="Transactions (XLSX monthly)"
          formatX={(x)=>{ const y = Math.floor(x); const m = Math.round((x - y)*12) + 1; return `${y}-${String(m).padStart(2,'0')}` }}
        />
        <div className="muted" style={{marginTop:6}}>
          {veoMonthly?.year ? `Overlay year: ${veoMonthly.year} (VEO)` : 'Overlay appears when a VEO table with monthly columns is detected.'}
        </div>
      </div>
    </div>
  )
}
