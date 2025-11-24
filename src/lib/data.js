import { fetchListings } from './api.js'

export const DISTRICTS = ["West Bay","George Town","Seven Mile Beach","Bodden Town","East End","North Side","Cayman Brac","Little Cayman"]
export const TYPES = ["Condo","House","Townhome","Land","Commercial"]
export const FEATURES = ["Waterfront","New Build","Pool","Dock","Gated","Pet Friendly"]

export const listings = [
  { id: "CIREME-1001", title: "Seven Mile Beach Oceanfront Condo", price: 1450000, beds: 2, baths: 2, sqft: 1380, type: "Condo", district: "Seven Mile Beach", lat: 19.3337, lng: -81.3804, images: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200"], features: ["Waterfront","Pool","Gated"] },
  { id: "CIREME-1002", title: "Modern Villa in West Bay", price: 980000, beds: 3, baths: 3, sqft: 2100, type: "House", district: "West Bay", lat: 19.3692, lng: -81.4031, images: ["https://images.unsplash.com/photo-1502005229762-cf1b2da7c65f?q=80&w=1200"], features: ["Pool","Pet Friendly","Gated"] },
  { id: "CIREME-1003", title: "George Town Commercial Space", price: 1250000, beds: 0, baths: 1, sqft: 3200, type: "Commercial", district: "George Town", lat: 19.2869, lng: -81.3671, images: ["https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1200"], features: [] }
]

export function getAgentListings(){
  try { return JSON.parse(localStorage.getItem('cireme:agent_listings') || '[]') } catch { return [] }
}
export function setAgentListings(rows){
  localStorage.setItem('cireme:agent_listings', JSON.stringify(rows||[]))
}

export async function getAllListings(){
  try {
    const rows = await fetchListings({})
    return rows.map((r) => ({
      ...r,
      price: Number(r.price||0),
      beds: Number(r.beds||0),
      baths: Number(r.baths||0),
      sqft: Number(r.sqft||0),
      images: Array.isArray(r.images) ? r.images : (r.images ? String(r.images).split('|') : [])
    })).concat(getAgentListings())
  } catch {
    return [...listings, ...getAgentListings()]
  }
}
