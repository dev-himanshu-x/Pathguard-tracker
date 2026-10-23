import { useEffect, useState } from 'react'
import { searchPlaces } from '../services/places'

// Debounced Ghaziabad place suggestions from OpenStreetMap; empty until 3+ characters.
export default function usePlaces(q) {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const query = q.trim()
    if (query.length < 3) {
      setList([])
      setLoading(false)
      return
    }
    const ctl = new AbortController()
    setLoading(true)
    const t = setTimeout(() => {
      searchPlaces(query, ctl.signal)
        .then(setList)
        .catch((e) => e.name !== 'AbortError' && setList([]))
        .finally(() => !ctl.signal.aborted && setLoading(false))
    }, 450)
    return () => {
      clearTimeout(t)
      ctl.abort()
    }
  }, [q])
  return { list, loading }
}
