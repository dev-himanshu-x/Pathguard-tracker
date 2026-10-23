import { z } from 'zod'

export const RELATIONS = [
  'Parent',
  'Sibling',
  'Partner',
  'Friend',
  'Roommate',
  'Colleague',
  'Other',
]
export const MAX_GUARDIANS = 8

// Indian mobiles only: 10 digits starting 6-9, with an optional 0, 91 or +91 prefix.
export function normalizePhone(raw = '') {
  const d = raw.replace(/[\s\-().]/g, '')
  return /^(0|\+?91)?[6-9]\d{9}$/.test(d) ? `+91${d.slice(-10)}` : null
}
export function formatPhone(p = '') {
  const m = p.match(/^\+91(\d{5})(\d{5})$/)
  return m ? `+91 ${m[1]} ${m[2]}` : p
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const contactSchema = (contacts, editingId) =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Enter a name with at least 2 characters')
        .max(50, 'Keep the name under 50 characters')
        .regex(/^[\p{L}][\p{L} .'-]*$/u, 'Use letters only'),
      rel: z.enum(RELATIONS, { message: 'Choose how you know them' }),
      phone: z
        .string()
        .trim()
        .min(1, 'Phone number is required')
        .refine((v) => normalizePhone(v), 'Enter a valid Indian mobile number, e.g. 98765 43210'),
      email: z
        .string()
        .trim()
        .refine((v) => v === '' || EMAIL.test(v), 'Enter a valid email address'),
      notify: z.boolean(),
    })
    .superRefine((v, ctx) => {
      const others = contacts.filter((c) => c.id !== editingId),
        phone = normalizePhone(v.phone)
      if (phone && others.some((c) => normalizePhone(c.phone) === phone))
        ctx.addIssue({ code: 'custom', path: ['phone'], message: 'This number is already added' })
      if (v.email && others.some((c) => c.email?.toLowerCase() === v.email.toLowerCase()))
        ctx.addIssue({ code: 'custom', path: ['email'], message: 'This email is already added' })
      if (!editingId && contacts.length >= MAX_GUARDIANS)
        ctx.addIssue({
          code: 'custom',
          path: ['name'],
          message: `You can add up to ${MAX_GUARDIANS} guardians`,
        })
    })

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 characters')
    .max(50, 'Keep it under 50 characters'),
})

export const journeySchema = z.object({
  to: z.string().trim().min(3, 'Enter your destination'),
  mode: z.string().min(1),
  dur: z.number().min(5, 'At least 5 minutes').max(240, 'At most 4 hours'),
  guardians: z.array(z.string()).min(1, 'Choose at least one guardian'),
})
