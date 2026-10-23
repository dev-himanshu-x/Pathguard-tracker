// Real-location helpers: distances, progress toward the destination, ETA and alert rules.
const R = 6371000
const rad = (d) => (d * Math.PI) / 180

export function distanceM(a, b) {
  const dLat = rad(b.lat - a.lat),
    dLng = rad(b.lng - a.lng),
    h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
export const fmtDistance = (m) =>
  m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`

// Typical speeds (m/s) used for the ETA until real movement gives a better estimate.
const MODE_SPEED = { Walk: 1.4, Cab: 8, Auto: 6, Bike: 5, Metro: 12 }
export function etaMinutes(j) {
  const v = j.speed > 1 ? j.speed : MODE_SPEED[j.mode] || 6
  return Math.max(1, Math.round(j.remainingM / v / 60))
}
export const elapsedMinutes = (j, now = Date.now()) =>
  Math.max(0, Math.round((now - Date.parse(j.start)) / 60000))

export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(Object.assign(new Error('unsupported'), { code: 0 }))
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  })
}

// Folds a new GPS fix into the journey: position, trail, distance left, progress and speed.
export function applyFix(j, fix) {
  const pos = { lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy, t: fix.t },
    remainingM = distanceM(pos, j.dest),
    dt = (fix.t - (j.lastFixAt || fix.t)) / 1000,
    step = j.pos ? distanceM(j.pos, pos) : 0,
    inst = fix.speed != null && !Number.isNaN(fix.speed) ? fix.speed : dt > 0 ? step / dt : 0,
    speed = j.speed == null ? inst : j.speed * 0.6 + inst * 0.4,
    last = j.path[j.path.length - 1],
    moved = step > Math.max(15, (fix.accuracy || 0) / 2)
  return {
    ...j,
    pos,
    path: !last || distanceM(last, pos) > 15 ? [...j.path.slice(-199), pos] : j.path,
    remainingM,
    bestRemainingM: Math.min(j.bestRemainingM ?? remainingM, remainingM),
    progress: Math.min(100, Math.max(0, 100 * (1 - remainingM / Math.max(j.totalM, 1)))),
    speed,
    lastFixAt: fix.t,
    lastMoveAt: moved ? fix.t : j.lastMoveAt,
  }
}

// Alerts that are true right now. Each type is raised at most once per journey.
export function dueAlerts(j, now = Date.now()) {
  const raised = j.raised || {},
    idle = (now - j.lastMoveAt) / 60000,
    elapsed = elapsedMinutes(j, now),
    away = j.remainingM - j.bestRemainingM,
    out = []
  if (j.remainingM <= 300) return out
  if (!raised.stop && idle >= 5)
    out.push({
      type: 'stop',
      msg: `No movement for ${Math.round(idle)} min, ${fmtDistance(j.remainingM)} from ${j.to}.`,
    })
  if (!raised.deviation && away > 800)
    out.push({
      type: 'deviation',
      msg: `Heading away from ${j.to}: ${fmtDistance(away)} further than your closest point.`,
    })
  if (!raised.delay && elapsed > Math.max(j.dur * 1.5, j.dur + 10))
    out.push({
      type: 'delay',
      msg: `${elapsed} min in, expected about ${j.dur} min. ${fmtDistance(j.remainingM)} to go.`,
    })
  return out
}
