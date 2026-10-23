// Place search via OpenStreetMap Nominatim (public, no key), limited to the Ghaziabad area.
// Usage policy: ≤1 req/s, so callers must debounce.
const BOX = '77.33,28.88,77.65,28.55' // left,top,right,bottom
const short = (r) => r.display_name.split(', ').slice(0, 3).join(', ')

async function query(q, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&bounded=1&viewbox=${BOX}&q=${encodeURIComponent(`${q}, Ghaziabad`)}`
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  return (await res.json()).map((r) => ({ name: short(r), lat: +r.lat, lng: +r.lon }))
}

// OpenStreetMap is strict about spelling ("Centre" vs "Center"), so if the exact text finds
// nothing, retry with common spelling fixes and then fewer words.
export async function searchPlaces(q, signal) {
  const words = q.trim().split(/\s+/),
    tries = [
      q.trim(),
      q.replace(/centre/gi, 'center'),
      words.slice(0, 2).join(' '),
      words[0],
    ].filter((t, i, all) => t && all.indexOf(t) === i)
  for (const t of tries) {
    const found = await query(t, signal)
    if (found.length) return found
  }
  return []
}

// Human-readable name for a coordinate (used as the journey's starting label).
export async function reverseName(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat=${lat}&lon=${lng}`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) throw new Error()
    const r = await res.json()
    return short(r)
  } catch {
    return 'My current location'
  }
}
