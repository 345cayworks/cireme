import { useState } from 'react'
import { agentUploadImage } from '../lib/api.js'

export default function ImageUploader({ agent, value=[], onChange }){
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function onFilesSelected(files){
    setErr('')
    setBusy(true)
    try{
      const urls = []
      for (const f of files){
        if(!/^image\//.test(f.type)) { setErr('Only images allowed'); continue }
        const { url } = await agentUploadImage(f, agent)
        urls.push(url)
      }
      onChange([...(value||[]), ...urls])
    }catch(e){ setErr(e.message || 'Upload failed') }
    finally{ setBusy(false) }
  }
  function onInput(e){ const files = Array.from(e.target.files||[]); onFilesSelected(files) }
  function onDrop(e){ e.preventDefault(); const files = Array.from(e.dataTransfer.files||[]); onFilesSelected(files) }
  function onDrag(e){ e.preventDefault() }
  function removeAt(i){ const next = [...value]; next.splice(i,1); onChange(next) }

  return (
    <div>
      <div
        onDrop={onDrop} onDragOver={onDrag}
        className="card pad"
        style={{ textAlign:'center', borderStyle:'dashed', cursor:'pointer' }}
        onClick={()=>document.getElementById('imgpick').click()}
      >
        <input id="imgpick" type="file" accept="image/*" multiple style={{display:'none'}} onChange={onInput} />
        <div>{busy ? 'Uploading…' : 'Click or drop images to upload'}</div>
        <div className="muted" style={{marginTop:4}}>PNG, JPG, WebP, AVIF. Up to 10MB each.</div>
      </div>

      {err ? <div className="badge" style={{marginTop:8, borderColor:'#b44', color:'#f88'}}>Error: {err}</div> : null}

      <div className="grid" style={{gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:8}}>
        {(value||[]).map((u,i)=>(
          <div key={u} className="card" style={{position:'relative'}}>
            <img src={u} alt="" style={{width:'100%', aspectRatio:'4/3', objectFit:'cover'}}/>
            <button className="btn ghost" style={{position:'absolute', top:6, right:6}} onClick={()=>removeAt(i)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}
