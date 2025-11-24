import { useState } from 'react'
import { setAgentListings, getAgentListings } from '../lib/data.js'

function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(l=>l.trim().length)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h=>h.trim())
  const rows = lines.slice(1).map(line=>{
    const cols = line.split(',')
    const obj = {}
    headers.forEach((h,i)=>{ obj[h] = (cols[i]||'').trim() })
    return obj
  })
  return rows
}

export default function AgentsPortal(){
  const [count, setCount] = useState(getAgentListings().length)
  function onFile(e){
    const file = e.target.files?.[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try{
        const rows = parseCSV(String(reader.result||''))
        setAgentListings(rows)
        setCount(rows.length)
        alert(`Imported ${rows.length} listings.`)
      }catch(err){
        alert('Failed to import CSV. Ensure it is comma-separated with a header row.')
      }
    }
    reader.readAsText(file)
  }
  return (
    <div className="container" style={{padding:'24px 0'}}>
      <div className="card pad">
        <h2>Agent Upload (Local)</h2>
        <p className="muted">Upload your listings CSV to preview in the app. Columns: <code>id,title,price,beds,baths,sqft,type,district,lat,lng,images</code> (images pipe-separated).</p>
        <input type="file" accept=".csv" onChange={onFile} />
        <div className="badge" style={{marginTop:8}}>Loaded: {count} from CSV</div>
        <p className="muted">Demo stores to your browser only.</p>
      </div>
    </div>
  )
}
