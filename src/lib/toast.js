import { toast as shadcnToast } from '@/hooks/use-toast'

// Thin helper over shadcn's toast: toast('Saved'), toast.success('Saved', { description }), etc.
const show =
  (variant) =>
  (title, { description, duration = 5000 } = {}) =>
    shadcnToast({ title, description, variant, duration })

export const toast = Object.assign((title, opts) => show('default')(title, opts), {
  success: show('success'),
  warning: show('warning'),
  error: show('destructive'),
  info: show('default'),
})
