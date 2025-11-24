import { FEATURES } from '../lib/data.js'
import { useNavigate, useSearchParams } from 'react-router-dom'
export default function Filters(){
  const [params] = useSearchParams()
  const nav = useNavigate()
  const current = new Set((params.get('features')||'').split(',').filter(Boolean))
  function toggle(feature){
    if(current.has(feature)) current.delete(feature); else current.add(feature)
    const qp = new URLSearchParams(params)
    const list = [...current]
    if(list.length) qp.set('features', list.join(',')); else qp.delete('features')
    nav(`/listings?${qp.toString()}`)
  }
  return (
    <div className="row wrap" style={{gap:8}}>
      {FEATURES.map(f=>(
        <button key={f} className="pill" onClick={()=>toggle(f)}>
          <input type="checkbox" readOnly checked={current.has(f)}/> {f}
        </button>
      ))}
    </div>
  )
}
