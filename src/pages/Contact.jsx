import { submitInquiry } from '../lib/api.js'
export default function Contact(){
  async function onSubmit(e){
    e.preventDefault()
    const fd = new FormData(e.target)
    const payload = Object.fromEntries(fd.entries())
    try{
      await submitInquiry(payload); alert('Thanks! We will contact you shortly.'); e.target.reset()
    }catch(err){ alert('Failed to submit inquiry. Please try again.') }
  }
  return (
    <div className="container" style={{padding:'24px 0'}}>
      <div className="grid cols-2">
        <div className="card pad">
          <h2>Contact</h2>
          <form onSubmit={onSubmit} className="grid" style={{gap:8}}>
            <input className="input" name="name" placeholder="Your name" required/>
            <input className="input" type="email" name="email" placeholder="Email" required/>
            <input className="input" name="phone" placeholder="Phone"/>
            <textarea className="input" name="message" placeholder="How can we help?" rows="5"/>
            <button className="btn" type="submit">Send</button>
          </form>
        </div>
        <div className="card pad">
          <h3>Office</h3>
          <p className="muted">Grand Cayman · Cayman Islands</p>
        </div>
      </div>
    </div>
  )
}
