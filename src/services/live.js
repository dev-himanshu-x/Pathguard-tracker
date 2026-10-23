// Live journey snapshot that the guardian share page reads. It lives in localStorage, so it is
// shared across tabs of the same browser only; a real deployment needs a backend (see README).
const key = (token) => `pg_live:${token}`
export const writeLive = (token, data) => {
  try {
    localStorage.setItem(
      key(token),
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() }),
    )
  } catch {}
}
export const readLive = (token) => {
  try {
    return JSON.parse(localStorage.getItem(key(token)))
  } catch {
    return null
  }
}
export const subscribeLive = (token, fn) => {
  const on = (e) => (!e.key || e.key === key(token)) && fn(readLive(token))
  window.addEventListener('storage', on)
  const t = setInterval(() => fn(readLive(token)), 3000)
  return () => {
    window.removeEventListener('storage', on)
    clearInterval(t)
  }
}
