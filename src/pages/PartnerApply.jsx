import { useState } from 'react'
import { submitPartnerApplication } from '../lib/api.js'

export default function PartnerApply(){
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e){
    e.preventDefault(); setBusy(true); setError('')
    const fd = new FormData(e.target)
    const data = {
      org_name: fd.get('org_name'),
      contact_name: fd.get('contact_name'),
      email: fd.get('email'),
      phone: fd.get('phone'),
      message: fd.get('message'),
      hp_field: fd.get('hp_field') || ''
    }
    try{
      const res = await submitPartnerApplication(data)
      if(res.ok){ setOk(true); e.target.reset() } else setError('Submission failed')
    }catch(err){ setError(err.message || 'Submission failed') }
    finally{ setBusy(false) }
  }

  if(ok){
    return (<div className="container" style={{padding:'24px 0'}}>
      <div className="card pad"><h2>Thanks — we received your application</h2>
      <p className="muted">Our team will get back to you soon.</p></div></div>)
  }

  return (
    <div className="container" style={{padding:'24px 0'}}>
      <div className="card pad" style={{maxWidth:740, margin:'0 auto'}}>
        <h2>Partner Application</h2>
        <form className="grid" style={{gap:12}} onSubmit={onSubmit}>
          <input className="input" name="org_name" placeholder="Organization" required />
          <input className="input" name="contact_name" placeholder="Contact name" required />
          <input className="input" type="email" name="email" placeholder="Email" required />
          <input className="input" name="phone" placeholder="Phone (optional)" />
          <textarea className="input" name="message" placeholder="Tell us about your services" rows={5} />
          {/* Honeypot */}
          <div style={{position:'absolute', left:'-10000px', width:'1px', height:'1px', overflow:'hidden'}}>
            <label>Leave empty<input name="hp_field" tabIndex={-1} autoComplete="off" /></label>
          </div>
          {error ? <div className="badge" style={{borderColor:'#b44', color:'#f88'}}>Error: {error}</div> : null}
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit application'}</button>
        </form>
      </div>
    </div>
  )
}
