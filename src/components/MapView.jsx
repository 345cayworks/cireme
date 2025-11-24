import { useEffect } from 'react'
import L from 'leaflet'
export default function MapView({ items=[] }){
  useEffect(()=>{
    const map = L.map('map', { zoomControl: true, scrollWheelZoom: false })
    const center = [19.3133, -81.2546]
    map.setView(center, 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'&copy; OpenStreetMap' }).addTo(map)
    const group = L.layerGroup().addTo(map)
    items.forEach(it=>{
      if(typeof it.lat==='number' && typeof it.lng==='number'){
        L.marker([it.lat, it.lng]).addTo(group).bindPopup(`<strong>${it.title}</strong><br/>$${(it.price||0).toLocaleString()}`)
      }
    })
    if(items.length){
      const coords = items.filter(i=>typeof i.lat==='number'&&typeof i.lng==='number').map(i=>[i.lat,i.lng])
      if(coords.length){
        const bounds = L.latLngBounds(coords)
        if(bounds.isValid()) map.fitBounds(bounds.pad(0.2))
      }
    }
    return ()=>{ map.remove() }
  },[items])
  return <div id="map" style={{width:'100%', height: '360px'}}></div>
}
