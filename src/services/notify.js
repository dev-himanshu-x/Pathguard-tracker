export const notifySupported = typeof window !== 'undefined' && 'Notification' in window
export const notifyPermission = () => (notifySupported ? Notification.permission : 'unsupported')
export const requestNotifyPermission = async () =>
  notifySupported ? await Notification.requestPermission() : 'unsupported'
export const notify = (title, body) => {
  if (!notifySupported || Notification.permission !== 'granted') return false
  try {
    new Notification(title, { body, icon: '/icon.svg', tag: 'pathguard', renotify: true })
    return true
  } catch {
    return false
  }
}
