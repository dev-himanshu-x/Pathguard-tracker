import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/context/AppContext'
import { contactSchema, normalizePhone, RELATIONS } from '@/lib/validation'

const EMPTY = { name: '', rel: undefined, phone: '', email: '', notify: true }

export default function GuardianDialog({ open, onOpenChange, editing }) {
  const { s, addContact, updateContact } = useApp(),
    schema = useMemo(() => contactSchema(s.contacts, editing?.id), [s.contacts, editing?.id]),
    form = useForm({ resolver: zodResolver(schema), defaultValues: EMPTY })

  useEffect(() => {
    if (open) form.reset(editing ? { ...EMPTY, ...editing } : EMPTY)
  }, [open, editing, form])

  const submit = (v) => {
    const data = {
      ...v,
      name: v.name.trim(),
      phone: normalizePhone(v.phone),
      email: v.email.trim(),
    }
    if (editing) {
      updateContact(editing.id, data)
      toast.success(`${data.name} updated`)
    } else {
      addContact(data)
      toast.success(`${data.name} added`, {
        description: 'They will be offered on your next journey.',
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit guardian' : 'Add a guardian'}</DialogTitle>
          <DialogDescription>
            Guardians receive your live link when you start a journey, and your alerts if you
            don&apos;t respond.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ananya Sharma" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How do you know them?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RELATIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile number</FormLabel>
                  <FormControl>
                    <Input type="tel" inputMode="tel" placeholder="98765 43210" {...field} />
                  </FormControl>
                  <FormDescription>
                    Indian mobile numbers only. Used for WhatsApp, SMS and calls.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <span className="font-normal text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notify"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <FormLabel>Include on every journey</FormLabel>
                    <FormDescription>Pre-selected when you start a journey.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? 'Save changes' : 'Add guardian'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
