// Notification server for PathGuard (email via Nodemailer, SMS/WhatsApp via Twilio). Run with `npm run server` (the Vite dev server proxies /api to it).
// Free options: a Gmail account with an App Password, or any SMTP provider. With no SMTP_* set it
// falls back to an Ethereal test inbox (emails are not delivered; a preview link is returned).
import express from 'express'
import nodemailer from 'nodemailer'

const PORT = process.env.PORT || 8787
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const esc = (s = '') =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
const clip = (s, n = 120) => String(s ?? '').slice(0, n)

let transport
let usingTest = false
async function getTransport() {
  if (transport) return transport
  if (process.env.SMTP_HOST || process.env.SMTP_USER) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE ?? 'true') !== 'false',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  } else {
    const acct = await nodemailer.createTestAccount()
    usingTest = true
    transport = nodemailer.createTransport({
      host: acct.smtp.host,
      port: acct.smtp.port,
      secure: acct.smtp.secure,
      auth: { user: acct.user, pass: acct.pass },
    })
  }
  return transport
}

// Message content is built here from a few validated fields, so the endpoint cannot be used to
// send arbitrary text to arbitrary people.
const TEMPLATES = {
  test: (d) => ({
    subject: 'PathGuard test email',
    text: `Hi ${d.name}, email notifications from PathGuard are working.`,
  }),
  start: (d) => ({
    subject: `${d.name} started a journey`,
    text: `${d.name} started a journey to ${d.destination} and is sharing live progress with you.\n\nFollow along: ${d.link}`,
  }),
  alert: (d) => ({
    subject: `PathGuard alert for ${d.name}: ${d.label}`,
    text: `${d.label}\n${d.message}\n\nThey did not respond in time. Please check on ${d.name}.\nFollow live: ${d.link}`,
  }),
  arrived: (d) => ({
    subject: `${d.name} reached safely`,
    text: `${d.name} reached ${d.destination} safely.`,
  }),
}

const hits = new Map()
const limited = (ip, n) => {
  const now = Date.now(),
    recent = (hits.get(ip) || []).filter((t) => now - t < 3600_000)
  for (let i = 0; i < n; i++) recent.push(now)
  hits.set(ip, recent)
  return recent.length > 60
}

// SMS and WhatsApp go through Twilio's REST API (free trial credit; WhatsApp has a free sandbox).
const TW = {
  sid: process.env.TWILIO_ACCOUNT_SID,
  token: process.env.TWILIO_AUTH_TOKEN,
  sms: process.env.TWILIO_SMS_FROM,
  whatsapp: process.env.TWILIO_WHATSAPP_FROM,
}
const configured = (ch) =>
  ch === 'email' ? true : Boolean(TW.sid && TW.token && (ch === 'sms' ? TW.sms : TW.whatsapp))
async function twilioSend(ch, to, body) {
  const wa = ch === 'whatsapp'
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TW.sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${TW.sid}:${TW.token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: wa ? `whatsapp:${to}` : to,
      From: wa ? TW.whatsapp : TW.sms,
      Body: body,
    }),
  })
  if (!res.ok)
    throw new Error((await res.json().catch(() => ({}))).message || `Twilio ${res.status}`)
}

const PHONE = /^\+91[6-9]\d{9}$/
const CHANNELS = ['email', 'sms', 'whatsapp']

const app = express()
app.use(express.json({ limit: '10kb' }))

app.get('/api/health', async (_req, res) => {
  try {
    await getTransport()
    res.json({
      ok: true,
      email: usingTest ? 'test-inbox' : 'smtp',
      sms: configured('sms'),
      whatsapp: configured('whatsapp'),
    })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// Body: { type, recipients: [{ name, email, phone }], channels: ['email','sms','whatsapp'], data }
// Each recipient/channel pair is attempted; channels that are not set up are reported as skipped.
app.post('/api/notify', async (req, res) => {
  const { type, recipients, channels, data = {} } = req.body || {}
  if (!TEMPLATES[type]) return res.status(400).json({ error: 'Unknown message type.' })
  const list = (Array.isArray(recipients) ? recipients : []).slice(0, 5)
  const chans = (Array.isArray(channels) ? channels : []).filter((c) => CHANNELS.includes(c))
  if (list.length === 0 || chans.length === 0)
    return res.status(400).json({ error: 'Provide recipients and channels.' })
  if (limited(req.ip, list.length * chans.length))
    return res.status(429).json({ error: 'Too many messages, try again later.' })
  const d = {
    name: clip(data.name, 60) || 'Your contact',
    destination: clip(data.destination),
    label: clip(data.label, 60),
    message: clip(data.message, 200),
    link: '',
  }
  if (data.link) {
    try {
      const u = new URL(data.link)
      if (!/^https?:$/.test(u.protocol)) throw new Error()
      d.link = u.toString()
    } catch {
      return res.status(400).json({ error: 'Invalid link.' })
    }
  }
  const { subject, text } = TEMPLATES[type](d)
  const results = []
  for (const r of list) {
    for (const ch of chans) {
      const base = { name: clip(r.name, 60), channel: ch }
      const target = ch === 'email' ? r.email : r.phone
      if (!target || !(ch === 'email' ? EMAIL.test(target) : PHONE.test(target))) {
        results.push({
          ...base,
          status: 'skipped',
          reason: `No valid ${ch === 'email' ? 'email' : 'phone number'}`,
        })
        continue
      }
      if (!configured(ch)) {
        results.push({
          ...base,
          status: 'skipped',
          reason: `${ch === 'sms' ? 'SMS' : 'WhatsApp'} is not set up on the server`,
        })
        continue
      }
      try {
        if (ch === 'email') {
          const t = await getTransport()
          const info = await t.sendMail({
            from:
              process.env.MAIL_FROM ||
              process.env.SMTP_USER ||
              'PathGuard <no-reply@pathguard.app>',
            to: target,
            subject,
            text,
            html: `<p>${esc(text).replace(/\n/g, '<br>')}</p>`,
          })
          results.push({
            ...base,
            status: 'sent',
            previewUrl: usingTest ? nodemailer.getTestMessageUrl(info) : undefined,
          })
        } else {
          await twilioSend(ch, target, text)
          results.push({ ...base, status: 'sent' })
        }
      } catch (e) {
        console.error(`${ch} failed:`, e.message)
        results.push({
          ...base,
          status: 'failed',
          reason: ch === 'email' ? 'Could not send the email' : e.message,
        })
      }
    }
  }
  res.json({ results })
})

app
  .listen(PORT, () => console.log(`PathGuard notify server on http://localhost:${PORT}`))
  .on('error', (e) => {
    if (e.code !== 'EADDRINUSE') throw e
    console.log(`Notify server already running on port ${PORT}; reusing it.`)
  })
