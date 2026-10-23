import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { ALERT, seed, tok } from '../data/mock'
import { applyFix, distanceM, dueAlerts, elapsedMinutes } from '../lib/geo'
import { trackUrl } from '../lib/share'
import { toast as appToast } from '../lib/toast'
import { hashPassword, readData, readUsers, writeData, writeUsers } from '../services/auth'
import { readLive, writeLive } from '../services/live'
import { CHANNEL_LABEL, notifyGuardians, summarize } from '../services/mail'
import {
  notify,
  notifyPermission,
  notifySupported,
  requestNotifyPermission,
} from '../services/notify'

const Ctx = createContext()
export const useApp = () => useContext(Ctx)

const load = () => {
  try {
    const st = { ...seed, ...JSON.parse(localStorage.getItem('pg_state')) }
    // Drop sessions without a real account, and journeys saved by the old simulated tracker.
    if (st.user && !readUsers()[st.user.email]) st.user = null
    if (st.journey && !st.journey.dest) st.journey = null
    return st
  } catch {
    return seed
  }
}
// Per-account data. Every account starts empty; nothing is pre-filled.
const DATA_KEYS = [
  'contacts',
  'history',
  'alerts',
  'journey',
  'arrival',
  'esc',
  'precise',
  'notifyAlerts',
]
const pick = (o) => Object.fromEntries(DATA_KEYS.filter((k) => k in o).map((k) => [k, o[k]]))
const CLEAN = {
  contacts: [],
  history: [],
  alerts: [],
  journey: null,
  arrival: null,
  esc: 5,
  precise: true,
  notifyAlerts: false,
}
const now = () => new Date().toISOString()
const log = (j, msg) => j && { ...j, events: [{ t: now(), msg }, ...j.events] }
const names = (s, ids) =>
  s.contacts
    .filter((c) => ids.includes(c.id))
    .map((c) => c.name)
    .join(', ')
const mk = (type, esc, msg) => ({
  id: `a${Date.now()}${Math.random()}`,
  type,
  ...ALERT[type],
  msg: msg || ALERT[type].msg,
  at: now(),
  status: type === 'sos' ? 'escalated' : type === 'arrived' ? 'resolved' : 'open',
  escalateAt: type === 'sos' || type === 'arrived' ? null : Date.now() + esc * 60000,
})
const record = (j, status, s) => ({
  id: `h${Date.now()}`,
  from: j.from,
  to: j.to,
  mode: j.mode,
  date: j.start,
  end: now(),
  mins: Math.max(1, elapsedMinutes(j)),
  status,
  guardians: names(s, j.guardians),
  events: j.events,
})
const liveSnapshot = (s, j) => ({
  name: s.name,
  from: j.from,
  to: j.to,
  mode: j.mode,
  dest: j.dest,
  pos: s.precise
    ? j.pos
    : j.pos && { ...j.pos, lat: +j.pos.lat.toFixed(2), lng: +j.pos.lng.toFixed(2) },
  path: s.precise ? j.path.slice(-60) : [],
  progress: j.progress,
  remainingM: j.remainingM,
  paused: j.paused,
  share: j.share,
  status: s.alerts.some((a) => a.status === 'escalated')
    ? 'needs-help'
    : s.alerts.some((a) => a.status === 'open' || a.status === 'ack')
      ? 'attention'
      : 'on-track',
  events: j.events.slice(0, 8),
  done: false,
})

export function AppProvider({ children }) {
  const [s, setS] = useState(load)
  const sRef = useRef(s)
  sRef.current = s
  const prevJourney = useRef(s.journey)
  const arriving = useRef(null)

  useEffect(() => {
    localStorage.setItem('pg_state', JSON.stringify(s))
    document.documentElement.classList.toggle('dark', !!s.dark)
  }, [s])

  const toast = useCallback((m) => appToast(m), [])
  const set = (p) => setS((x) => ({ ...x, ...(typeof p === 'function' ? p(x) : p) }))

  // Notify a journey's guardians on every channel the server has set up (email, SMS, WhatsApp)
  // and record the outcome on the timeline.
  const mailGuardians = useCallback(async (type, journey, data, label) => {
    const contacts = sRef.current.contacts.filter((c) => journey.guardians.includes(c.id))
    if (!contacts.length) return
    const { results, error } = await notifyGuardians({
      type,
      contacts,
      data: { name: sRef.current.name, link: trackUrl(journey.token), ...data },
    })
    const { sent, failed } = summarize(results)
    if (error || (failed.length && !sent.length))
      appToast.warning('Could not notify your guardians', {
        description: error || failed[0].reason,
      })
    if (!sent.length) return
    const byName = {}
    for (const r of sent) byName[r.name] = [...(byName[r.name] || []), CHANNEL_LABEL[r.channel]]
    const line = Object.entries(byName)
      .map(([n, ch]) => `${n} (${ch.join(', ')})`)
      .join('; ')
    setS((x) => ({
      ...x,
      journey:
        x.journey && x.journey.token === journey.token
          ? log(x.journey, `${label}: notified ${line}`)
          : x.journey,
    }))
  }, [])

  const raiseAlert = useCallback(
    (type, msg) => {
      const p = sRef.current,
        a = mk(type, p.esc, msg)
      setS((x) => ({
        ...x,
        alerts: [a, ...x.alerts],
        journey:
          x.journey &&
          log(
            { ...x.journey, raised: { ...x.journey.raised, [type]: true } },
            `${a.label}: ${a.msg}`,
          ),
      }))
      if (type === 'sos') {
        appToast.error('SOS sent', { description: 'Your guardians are being notified.' })
        if (p.journey) mailGuardians('alert', p.journey, { label: a.label, message: a.msg }, 'SOS')
      } else
        appToast.warning(a.label, {
          description: `${a.msg} Are you okay? Respond within ${p.esc} min or your guardians are alerted.`,
          duration: 12000,
        })
      if (p.notifyAlerts) notify(a.label, a.msg)
    },
    [mailGuardians],
  )

  // Arrival: close the journey, log it, tell the traveller and the guardians' live page.
  const arrive = useCallback(
    (nj) => {
      const p = sRef.current
      if (!p.journey || p.journey.token !== nj.token || arriving.current === nj.token) return
      arriving.current = nj.token
      const j = log({ ...nj, progress: 100, remainingM: 0 }, `Reached ${nj.to} safely`),
        who = names(p, j.guardians),
        hadAlert = p.alerts.some((a) => a.type !== 'arrived' && a.at >= j.start),
        arrived = mk(
          'arrived',
          p.esc,
          `You reached ${j.to}.${who ? ' Their live link now shows you arrived.' : ''}`,
        )
      writeLive(j.token, {
        name: p.name,
        from: j.from,
        to: j.to,
        dest: j.dest,
        pos: j.dest,
        progress: 100,
        done: true,
        outcome: 'arrived',
        events: j.events.slice(0, 8),
      })
      mailGuardians('arrived', j, { destination: j.to }, 'Reached safely')
      setS((x) => ({
        ...x,
        journey: null,
        arrival: { id: arrived.id, to: j.to, at: now(), guardians: who, ids: j.guardians },
        alerts: [
          arrived,
          ...x.alerts.map((a) =>
            a.status === 'resolved' ? a : { ...a, status: 'resolved', escalateAt: null },
          ),
        ],
        history: [record(j, hadAlert ? 'Alert resolved' : 'Arrived safely', x), ...x.history],
      }))
      appToast.success('Reached safely', {
        description: `You arrived at ${j.to}.${who ? ' Their live link now shows you arrived.' : ''}`,
        duration: 10000,
      })
      notify('Reached safely', `You arrived at ${j.to}.`)
    },
    [mailGuardians],
  )

  // Publish the live snapshot guardians read on the share page.
  useEffect(() => {
    const j = s.journey,
      prev = prevJourney.current
    prevJourney.current = j
    if (j) writeLive(j.token, liveSnapshot(s, j))
    else if (prev && !readLive(prev.token)?.done)
      writeLive(prev.token, {
        name: s.name,
        from: prev.from,
        to: prev.to,
        dest: prev.dest,
        pos: prev.pos,
        progress: prev.progress,
        done: true,
        outcome: 'ended',
        events: prev.events.slice(0, 8),
      })
  }, [s])

  // Real tracking: follow the device GPS for the active journey.
  const token = s.journey?.token
  useEffect(() => {
    if (!token || !navigator.geolocation) return
    let errors = 0,
      stopped = false,
      battery
    const own = () => sRef.current.journey?.token === token
    const onFix = (p) => {
      if (stopped || !own()) return
      errors = 0
      const nj = applyFix(sRef.current.journey, {
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        accuracy: p.coords.accuracy,
        speed: p.coords.speed,
        t: p.timestamp || Date.now(),
      })
      if (nj.remainingM <= Math.max(75, Math.min(nj.pos.accuracy || 0, 150))) return arrive(nj)
      setS((x) =>
        x.journey?.token === token ? { ...x, journey: { ...nj, battery: x.journey.battery } } : x,
      )
    }
    const onErr = (e) => {
      if (stopped || !own() || sRef.current.journey.raised?.signal) return
      errors += 1
      if (e.code === 1)
        raiseAlert('signal', 'Location permission is off, so your guardians cannot follow you.')
      else if (errors >= 3) raiseAlert('signal')
    }
    const watch = navigator.geolocation.watchPosition(onFix, onErr, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 20000,
    })
    const beat = setInterval(() => {
      const j = sRef.current.journey
      if (!j || j.token !== token || j.paused) return
      for (const a of dueAlerts(j)) raiseAlert(a.type, a.msg)
    }, 15000)
    const setBattery = () =>
      battery &&
      setS((x) =>
        x.journey?.token === token
          ? { ...x, journey: { ...x.journey, battery: Math.round(battery.level * 100) } }
          : x,
      )
    navigator.getBattery?.().then((b) => {
      if (stopped) return
      battery = b
      setBattery()
      b.addEventListener('levelchange', setBattery)
    })
    return () => {
      stopped = true
      navigator.geolocation.clearWatch(watch)
      clearInterval(beat)
      battery?.removeEventListener('levelchange', setBattery)
    }
  }, [token, arrive, raiseAlert])

  // Escalation: an alert nobody answers in time goes to the guardians.
  useEffect(() => {
    const t = setInterval(() => {
      const p = sRef.current,
        due = p.alerts.filter(
          (a) => a.status === 'open' && a.escalateAt && a.escalateAt <= Date.now(),
        )
      if (!due.length) return
      setS((x) => ({
        ...x,
        alerts: x.alerts.map((a) =>
          due.some((d) => d.id === a.id) ? { ...a, status: 'escalated', escalatedAt: now() } : a,
        ),
        journey: log(x.journey, `No response to "${due[0].label}". Escalated to guardians.`),
      }))
      for (const a of due) {
        const j = p.journey
        if (j) mailGuardians('alert', j, { label: a.label, message: a.msg }, `Alert: ${a.label}`)
        appToast.error(`Escalated: ${a.label}`, {
          description: 'No response in time. Your guardians are being notified.',
          duration: 15000,
        })
        if (p.notifyAlerts) notify(`Escalated: ${a.label}`, 'No response. Guardians notified.')
      }
    }, 1000)
    return () => clearInterval(t)
  }, [mailGuardians])

  const enter = (user, data) => setS((p) => ({ ...p, ...data, name: user.name, user }))
  const api = {
    s,
    set,
    toast,
    signup: async ({ name, email, password }) => {
      const key = email.trim().toLowerCase(),
        users = readUsers()
      if (users[key]) throw new Error('An account with this email already exists. Sign in instead.')
      users[key] = { name: name.trim(), hash: await hashPassword(key, password) }
      writeUsers(users)
      enter({ name: users[key].name, email: key }, CLEAN)
    },
    signin: async ({ email, password }) => {
      const key = email.trim().toLowerCase(),
        u = readUsers()[key]
      if (!u) throw new Error('No account found for this email. Sign up first.')
      if (u.hash !== (await hashPassword(key, password))) throw new Error('Incorrect password.')
      enter({ name: u.name, email: key }, readData(key) || CLEAN)
    },
    logout: () => {
      if (s.user?.email) writeData(s.user.email, pick(s))
      setS((p) => ({ ...p, ...CLEAN, user: null }))
    },

    addContact: (c) =>
      setS((p) => ({ ...p, contacts: [...p.contacts, { ...c, id: `c${Date.now()}` }] })),
    updateContact: (id, c) =>
      setS((p) => ({ ...p, contacts: p.contacts.map((x) => (x.id === id ? { ...x, ...c } : x)) })),
    removeContact: (id) =>
      setS((p) => ({
        ...p,
        contacts: p.contacts.filter((x) => x.id !== id),
        journey: p.journey && {
          ...p.journey,
          guardians: p.journey.guardians.filter((g) => g !== id),
        },
      })),

    // f: { from, to, mode, dur, guardians, origin: {lat,lng,accuracy}, dest: {lat,lng}, consent }
    start: (f) => {
      const who = names(sRef.current, f.guardians),
        token = tok(),
        t = Date.now(),
        total = Math.max(1, Math.round(distanceM(f.origin, f.dest)))
      arriving.current = null
      set({
        arrival: null,
        journey: {
          ...f,
          id: `j${t}`,
          token,
          start: now(),
          pos: { ...f.origin, t },
          path: [{ ...f.origin, t }],
          totalM: total,
          remainingM: total,
          bestRemainingM: total,
          progress: 0,
          speed: null,
          lastFixAt: t,
          lastMoveAt: t,
          raised: {},
          battery: null,
          paused: false,
          share: f.consent.location,
          events: [{ t: now(), msg: `Journey started. Sharing with ${who}.` }],
        },
      })
      appToast.success('Journey started', {
        description: `${who} will be notified and can follow your live location.`,
      })
      mailGuardians(
        'start',
        { guardians: f.guardians, token },
        { destination: f.to },
        'Journey started',
      )
      if (notifySupported && notifyPermission() === 'default')
        requestNotifyPermission().then((r) => r === 'granted' && set({ notifyAlerts: true }))
    },
    pause: () =>
      set((p) => ({
        journey: log(
          { ...p.journey, paused: !p.journey.paused },
          p.journey.paused ? 'Journey resumed' : 'Journey paused by you',
        ),
      })),
    toggleShare: () =>
      set((p) => ({
        journey: log(
          { ...p.journey, share: !p.journey.share },
          p.journey.share ? 'Location sharing revoked by you' : 'Location sharing resumed',
        ),
      })),
    end: (status = 'Ended early') =>
      setS((p) => ({
        ...p,
        journey: null,
        alerts: p.alerts.map((a) =>
          a.status === 'open' || a.status === 'ack' ? { ...a, status: 'resolved' } : a,
        ),
        history: [record(p.journey, status, p), ...p.history],
      })),

    sos: () => raiseAlert('sos'),
    ack: (id) =>
      set((p) => ({
        alerts: p.alerts.map((a) => (a.id === id ? { ...a, status: 'ack', escalateAt: null } : a)),
      })),
    escalate: (id) => {
      const a = sRef.current.alerts.find((x) => x.id === id),
        j = sRef.current.journey
      if (a && j) mailGuardians('alert', j, { label: a.label, message: a.msg }, `Alert: ${a.label}`)
      set((p) => ({
        alerts: p.alerts.map((x) =>
          x.id === id ? { ...x, status: 'escalated', escalatedAt: now(), escalateAt: null } : x,
        ),
        journey: log(p.journey, 'You escalated an alert to your guardians'),
      }))
    },
    resolve: (id) => {
      set((p) => ({
        alerts: p.alerts.map((a) =>
          a.id === id ? { ...a, status: 'resolved', escalateAt: null } : a,
        ),
        journey: log(p.journey, 'You marked yourself safe'),
      }))
      appToast.success('Marked safe')
    },
    clearHistory: () => set({ history: [] }),
    reset: () => setS((p) => ({ ...p, ...CLEAN })),
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
