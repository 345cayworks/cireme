const KEY = "cireme:favorites"
export function getFavorites(){ try { return JSON.parse(localStorage.getItem(KEY) || "[]") } catch { return [] } }
export function toggleFavorite(id){ const set = new Set(getFavorites()); if(set.has(id)) set.delete(id); else set.add(id); localStorage.setItem(KEY, JSON.stringify([...set])); return [...set] }
export function isFavorite(id){ return new Set(getFavorites()).has(id) }
