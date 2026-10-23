import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { elapsedMinutes, etaMinutes } from '../lib/geo'

export default function useJourney() {
  const { s } = useApp(),
    j = s.journey,
    open = s.alerts.filter((a) => a.status !== 'resolved'),
    [, tick] = useState(0)
  // Re-render every 30 s so elapsed time and ETA stay current between GPS fixes.
  useEffect(() => {
    if (!j) return
    const t = setInterval(() => tick((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [j])
  return {
    j,
    open,
    eta: j ? etaMinutes(j) : 0,
    elapsed: j ? elapsedMinutes(j) : 0,
    status: !j
      ? 'No active journey'
      : j.paused
        ? 'Paused'
        : open.length
          ? 'Needs attention'
          : 'On track',
  }
}
