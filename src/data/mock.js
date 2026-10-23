export const ROUTE = [
  [28.6692, 77.4538],
  [28.685, 77.462],
  [28.701, 77.47],
  [28.718, 77.48],
  [28.734, 77.49],
  [28.7527, 77.4985],
]
export const posAt = (p) => {
  const n = ROUTE.length - 1,
    x = (Math.min(p, 99.99) / 100) * n,
    i = Math.floor(x),
    f = x - i
  return [
    ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * f,
    ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * f,
  ]
}
export const MODES = ['Cab', 'Walk', 'Metro', 'Bike', 'Auto']
export const ALERT = {
  stop: {
    label: 'Unexpected stop',
    msg: 'Stopped for 4 min away from the planned route.',
    sev: 'Medium',
  },
  deviation: {
    label: 'Route deviation',
    msg: 'Moved 600 m away from the planned route.',
    sev: 'High',
  },
  delay: { label: 'Unusual delay', msg: 'Running 12 min behind the expected arrival.', sev: 'Low' },
  arrived: { label: 'Reached safely', msg: 'You reached your destination.', sev: 'Info' },
  signal: {
    label: 'Location unavailable',
    msg: 'PathGuard cannot get your location right now.',
    sev: 'Medium',
  },
  sos: {
    label: 'SOS triggered',
    msg: 'SOS sent to guardians (demo, no real services contacted).',
    sev: 'Critical',
  },
}
export const tm = (i) => new Date(i).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
export const dt = (i) =>
  new Date(i).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
export const tok = () =>
  Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
export const seed = {
  dark: false,
  journey: null,
  arrival: null,
  esc: 5,
  precise: true,
  notifyAlerts: false,
  contacts: [],
  history: [],
  alerts: [],
}
