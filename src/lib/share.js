export const trackUrl = (token) => `${window.location.origin}/share/${token}`
export const startMessage = (name, to, token) =>
  `${name} started a journey to ${to} and is sharing live progress with you on PathGuard: ${trackUrl(token)}`
export const alertMessage = (name, alert, token) =>
  `PathGuard alert for ${name}: ${alert.label}. ${alert.msg} Follow live: ${trackUrl(token)}`
export const arrivedMessage = (name, to) => `${name} reached ${to} safely.`
export const waLink = (phone, text) =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
export const smsLink = (phone, text) => `sms:${phone}?body=${encodeURIComponent(text)}`
export const mailLink = (email, subject, text) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
export const telLink = (phone) => `tel:${phone}`
