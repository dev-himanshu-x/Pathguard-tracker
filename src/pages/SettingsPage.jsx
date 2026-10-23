import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, LocateFixed, Mail, MapPin, ShieldCheck, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from '@/lib/toast'
import { MapView } from '@/components/common'
import { notifyGuardians, summarize } from '@/services/mail'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/context/AppContext'
import useGeolocation from '@/hooks/useGeolocation'
import { profileSchema } from '@/lib/validation'
import {
  notify,
  notifyPermission,
  notifySupported,
  requestNotifyPermission,
} from '@/services/notify'

const Section = ({ icon: Icon, title, description, children }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base">
        <Icon size={17} /> {title}
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-4">{children}</CardContent>
  </Card>
)
const Row = ({ id, title, text, children }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="min-w-0">
      <Label htmlFor={id} className="text-sm font-medium">
        {title}
      </Label>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
    {children}
  </div>
)

function Profile() {
  const { s, set } = useApp(),
    form = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: s.name || '' } })
  useEffect(() => form.reset({ name: s.name || '' }), [s.name, form])
  return (
    <Section icon={User} title="Profile" description="How your guardians see you.">
      <Form {...form}>
        <form
          noValidate
          className="space-y-4"
          onSubmit={form.handleSubmit((v) => {
            set({ name: v.name.trim() })
            toast.success('Profile saved')
          })}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={s.user?.email || ''} disabled readOnly />
          </div>
          <Button type="submit" disabled={!form.formState.isDirty}>
            Save profile
          </Button>
        </form>
      </Form>
    </Section>
  )
}

function Notifications() {
  const { s, set } = useApp(),
    [perm, setPerm] = useState(notifyPermission())
  const toggle = async (on) => {
    if (!on) return set({ notifyAlerts: false })
    const p = notifyPermission() === 'granted' ? 'granted' : await requestNotifyPermission()
    setPerm(p)
    if (p === 'granted') {
      set({ notifyAlerts: true })
      toast.success('Notifications on')
    } else
      toast.error('Notifications are blocked', {
        description: 'Allow them in your browser site settings.',
      })
  }
  return (
    <Section
      icon={Bell}
      title="Notifications"
      description="Browser notifications for alerts and when you reach your destination."
    >
      {!notifySupported ? (
        <p className="text-sm text-muted-foreground">
          This browser does not support notifications.
        </p>
      ) : (
        <>
          <Row id="notif" title="Notify me" text="Alerts, escalations and safe arrival.">
            <Switch
              id="notif"
              checked={s.notifyAlerts && perm === 'granted'}
              disabled={perm === 'denied'}
              onCheckedChange={toggle}
            />
          </Row>
          {perm === 'denied' && (
            <p className="text-sm text-destructive">
              Notifications are blocked for this site. Allow them in your browser settings.
            </p>
          )}
          <Button
            variant="outline"
            disabled={perm !== 'granted'}
            onClick={() => notify('PathGuard test', 'Notifications are working.')}
          >
            Send a test notification
          </Button>
        </>
      )}
    </Section>
  )
}

function EmailTest() {
  const { s } = useApp(),
    [busy, setBusy] = useState(false)
  const send = async () => {
    setBusy(true)
    const { results, error } = await notifyGuardians({
      type: 'test',
      contacts: [{ name: s.name, email: s.user?.email }],
      channels: ['email'],
      data: { name: s.name },
    })
    setBusy(false)
    const { sent, failed, skipped } = summarize(results)
    if (sent.length)
      toast.success('Test email sent', {
        description: sent[0].previewUrl
          ? `Test inbox: ${sent[0].previewUrl}`
          : `Check ${s.user?.email}.`,
      })
    else
      toast.error('Email failed', {
        description: error || failed[0]?.reason || skipped[0]?.reason || 'Something went wrong.',
      })
  }
  return (
    <Section
      icon={Mail}
      title="Notifications to guardians"
      description="Guardians are notified automatically (email, plus SMS and WhatsApp when set up) when a journey starts, an alert escalates, and you arrive."
    >
      <Button variant="outline" disabled={busy} onClick={send}>
        {busy ? 'Sending…' : 'Send me a test email'}
      </Button>
    </Section>
  )
}

function Safety() {
  const { s, set } = useApp()
  return (
    <Section
      icon={ShieldCheck}
      title="Safety"
      description="How PathGuard behaves during a journey."
    >
      <Row
        id="esc"
        title="Escalate unanswered alerts after"
        text="Guardians are told if you do not respond."
      >
        <Select value={String(s.esc)} onValueChange={(v) => set({ esc: +v })}>
          <SelectTrigger id="esc" className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 3, 5, 10, 15].map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m} min
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
      <Separator />
      <Row id="precise" title="Share precise location" text="Off shares only the general area.">
        <Switch id="precise" checked={s.precise} onCheckedChange={(v) => set({ precise: v })} />
      </Row>
    </Section>
  )
}

function DeviceLocation() {
  const geo = useGeolocation(),
    real = geo.status === 'active' ? geo.coords : null,
    busy = geo.status === 'active' || geo.status === 'requesting'
  return (
    <Section
      icon={MapPin}
      title="Device location"
      description="Check that your browser can share your real position. Nothing is stored."
    >
      <Button variant="outline" onClick={() => (busy ? geo.stop() : geo.start())}>
        <LocateFixed />
        {geo.status === 'active'
          ? 'Stop'
          : geo.status === 'requesting'
            ? 'Requesting…'
            : 'Test my location'}
      </Button>
      {geo.status === 'denied' && (
        <p className="text-sm text-destructive">Permission denied. Allow location for this site.</p>
      )}
      {geo.status === 'unsupported' && (
        <p className="text-sm text-muted-foreground">Not supported in this browser.</p>
      )}
      {real && (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-lg border">
            <MapView real={real} className="h-56" live />
          </div>
          <p className="text-xs text-muted-foreground">
            {real.lat.toFixed(5)}, {real.lng.toFixed(5)} · ±{Math.round(real.accuracy || 0)} m
          </p>
        </div>
      )}
    </Section>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Settings</h1>
        <p className="text-muted-foreground">Your profile, notifications and safety preferences.</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Profile />
          <Notifications />
        </div>
        <div className="space-y-6">
          <Safety />
          <EmailTest />
          <DeviceLocation />
        </div>
      </div>
    </div>
  )
}
