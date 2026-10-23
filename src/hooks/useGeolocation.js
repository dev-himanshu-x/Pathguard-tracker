import { useCallback, useRef, useState } from 'react'
export default function useGeolocation() {
  const [status, setStatus] = useState('idle')
  const [coords, setCoords] = useState(null)
  const [error, setError] = useState('')
  const id = useRef(null)
  const supported = typeof navigator !== 'undefined' && !!navigator.geolocation
  const stop = useCallback(() => {
    if (id.current != null) {
      navigator.geolocation.clearWatch(id.current)
      id.current = null
    }
    setStatus((s) => (s === 'denied' ? s : 'idle'))
  }, [])
  const start = useCallback(() => {
    if (!supported) {
      setStatus('unsupported')
      return
    }
    setStatus('requesting')
    id.current = navigator.geolocation.watchPosition(
      (p) => {
        setStatus('active')
        setError('')
        setCoords({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          speed: p.coords.speed,
          heading: p.coords.heading,
          at: Date.now(),
        })
      },
      (e) => {
        setStatus(e.code === 1 ? 'denied' : 'error')
        setError(e.message)
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 12000 },
    )
  }, [supported])
  return { supported, status, coords, error, start, stop }
}
