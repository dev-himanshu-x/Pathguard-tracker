// Demo-grade accounts kept in localStorage. Passwords are salted + SHA-256 hashed so they are
// never stored in plain text, but this is not a substitute for a real backend.
const USERS = 'pg_users'

export const readUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(USERS)) || {}
  } catch {
    return {}
  }
}
export const writeUsers = (u) => localStorage.setItem(USERS, JSON.stringify(u))
export const readData = (email) => {
  try {
    return JSON.parse(localStorage.getItem(`pg_data:${email}`))
  } catch {
    return null
  }
}
export const writeData = (email, data) =>
  localStorage.setItem(`pg_data:${email}`, JSON.stringify(data))

export async function hashPassword(email, password) {
  const bytes = new TextEncoder().encode(`pathguard:${email}:${password}`)
  const buf = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
