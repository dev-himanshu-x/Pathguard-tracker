// Sends templated notifications through the PathGuard server (server/index.js):
// email via Nodemailer, SMS and WhatsApp via Twilio. Nothing opens on the user's device.
export const CHANNELS = ['email', 'sms', 'whatsapp']
export const CHANNEL_LABEL = { email: 'Email', sms: 'SMS', whatsapp: 'WhatsApp' }

export async function notifyGuardians({ type, contacts, channels = CHANNELS, data }) {
  const recipients = contacts.map((c) => ({
    name: c.name,
    email: c.email || '',
    phone: c.phone || '',
  }))
  if (recipients.length === 0) return { results: [] }
  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, recipients, channels, data }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || `Server returned ${res.status}`)
    return { results: body.results }
  } catch (e) {
    return {
      results: [],
      error:
        e.message === 'Failed to fetch'
          ? 'The notify server is not running (npm run dev:all).'
          : e.message,
    }
  }
}

export const summarize = (results) => ({
  sent: results.filter((r) => r.status === 'sent'),
  failed: results.filter((r) => r.status === 'failed'),
  skipped: results.filter((r) => r.status === 'skipped'),
})
