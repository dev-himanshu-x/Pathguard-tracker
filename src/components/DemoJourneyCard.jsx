import { BellRing, CheckCircle2, Clock, Navigation, Radio } from 'lucide-react'
import { useEffect, useState } from 'react'

const STEPS = [
  [Navigation, 'Start'],
  [Radio, 'Watching'],
  [BellRing, 'Check-in'],
  [CheckCircle2, 'Arrival'],
]
const EVENTS = [
  [0, 'Journey started · Ananya notified'],
  [25, 'Checkpoint 1 · on planned route'],
  [50, 'Unexpected stop detected (4 min)'],
  [58, 'Check-in sent. You replied "I am okay"'],
  [80, 'Back on route · ETA recalculated'],
  [100, 'Arrived safely · Ananya notified'],
]

// Self-playing simulation of one journey, looping. No real data or location.
export default function DemoJourneyCard({ id, className = '' }) {
  const [p, setP] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setP((x) => (x >= 112 ? 0 : x + 2)), 600)
    return () => clearInterval(t)
  }, [])
  const prog = Math.min(100, p),
    step = prog < 8 ? 0 : prog < 50 ? 1 : prog < 58 ? 2 : prog < 100 ? 1 : 3,
    checking = prog >= 50 && prog < 58,
    done = prog >= 100,
    shown = EVENTS.filter(([at]) => prog >= at)
      .slice(-4)
      .reverse(),
    eta = Math.max(0, Math.round((100 - prog) * 0.2))
  return (
    <div
      id={id}
      className={`card space-y-4 p-5 text-left text-navy dark:text-slate-100 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Journey in progress</h2>
        <span className="rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          Demo · simulated
        </span>
      </div>
      <p className="muted truncate text-sm">Raj Nagar Extension to KIET Campus · Cab</p>

      <ol className="grid grid-cols-4 gap-1" aria-label="How it works">
        {STEPS.map(([I, l], i) => (
          <li
            key={l}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition ${i === step ? (checking ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300') : 'muted'}`}
          >
            <I size={16} />
            {l}
          </li>
        ))}
      </ol>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm font-semibold">
          <span className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${done ? 'bg-mint' : checking ? 'animate-pulse bg-amber-500' : 'animate-pulse bg-mint'}`}
            />
            {done ? 'Arrived safely' : checking ? 'Checking in with you' : 'On track'}
          </span>
          <span className="muted flex items-center gap-1 text-xs font-medium">
            <Clock size={12} />
            {done ? 'Done' : `Arriving in ${eta} min`}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${checking ? 'bg-amber-500' : 'bg-mint'}`}
            style={{ width: `${prog}%` }}
          />
        </div>
      </div>

      <ul
        className="space-y-2 border-l-2 border-emerald-200 pl-3 dark:border-emerald-900"
        aria-live="off"
      >
        {shown.map(([at, m], i) => (
          <li key={at} className={`truncate text-sm ${i === 0 ? 'font-medium' : 'muted'}`}>
            {m}
          </li>
        ))}
      </ul>
    </div>
  )
}
