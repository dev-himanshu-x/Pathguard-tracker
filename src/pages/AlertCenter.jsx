import {
  BellOff,
  CheckCircle2,
  Clock,
  MapPinOff,
  PauseCircle,
  Route,
  ShieldAlert,
  Siren,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { AlertStatusBadge, EmptyState, SeverityBadge, timeAgo } from '@/components/badges'
import ShareButtons from '@/components/ShareButtons'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApp } from '@/context/AppContext'
import { tm } from '@/data/mock'
import { trackUrl } from '@/lib/share'
import { cn } from '@/lib/utils'

const ICON = {
  stop: PauseCircle,
  deviation: Route,
  delay: Clock,
  sos: Siren,
  arrived: CheckCircle2,
  signal: MapPinOff,
}
const EDGE = {
  open: 'border-l-amber-500',
  ack: 'border-l-sky-500',
  escalated: 'border-l-destructive',
  resolved: 'border-l-emerald-500',
}

function Countdown({ until }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = Math.max(0, Math.round((until - now) / 1000))
  return (
    <span className="tabular-nums">
      {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
    </span>
  )
}

function AlertCard({ a, guardians, token, name }) {
  const { ack, resolve, escalate } = useApp(),
    Icon = ICON[a.type] || ShieldAlert,
    live = a.status === 'open' || a.status === 'ack' || a.status === 'escalated'
  return (
    <Card className={cn('border-l-4', EDGE[a.status])}>
      <CardContent className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{a.label}</p>
              <SeverityBadge sev={a.sev} />
              <AlertStatusBadge status={a.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{a.msg}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {timeAgo(a.at)} · {tm(a.at)}
            </p>
          </div>
        </div>

        {a.status === 'open' && a.escalateAt && (
          <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            Guardians are alerted in{' '}
            <b>
              <Countdown until={a.escalateAt} />
            </b>{' '}
            unless you respond.
          </p>
        )}
        {a.status === 'escalated' && (
          <div className="space-y-2 rounded-md bg-destructive/10 p-3">
            <p className="text-sm font-medium text-destructive">
              This alert has been escalated. Tell your guardians now:
            </p>
            {guardians.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No guardians to notify. Add one first.
              </p>
            ) : (
              guardians.map((g) => (
                <div key={g.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{g.name}</span>
                  <ShareButtons
                    contact={g}
                    call
                    type="alert"
                    data={{
                      name,
                      label: a.label,
                      message: a.msg,
                      link: token ? trackUrl(token) : '',
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {live && a.status !== 'resolved' && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => resolve(a.id)}>
              <CheckCircle2 /> I&apos;m okay
            </Button>
            {a.status === 'open' && (
              <Button size="sm" variant="outline" onClick={() => ack(a.id)}>
                Acknowledge, I&apos;m checking
              </Button>
            )}
            {a.status !== 'escalated' && (
              <Button size="sm" variant="destructive" onClick={() => escalate(a.id)}>
                <ShieldAlert /> Alert guardians now
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AlertCenter() {
  const { s } = useApp(),
    [tab, setTab] = useState('attention'),
    j = s.journey
  const needs = s.alerts.filter((a) => a.status !== 'resolved'),
    list =
      tab === 'attention'
        ? needs
        : tab === 'resolved'
          ? s.alerts.filter((a) => a.status === 'resolved')
          : s.alerts,
    who = s.contacts.filter((c) => (j ? j.guardians.includes(c.id) : true))
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Alerts</h1>
          <p className="text-muted-foreground">
            {needs.length
              ? `${needs.length} need${needs.length === 1 ? 's' : ''} your attention.`
              : 'Nothing needs your attention.'}{' '}
            Unanswered alerts escalate to your guardians after {s.esc} min.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="attention">Needs attention ({needs.length})</TabsTrigger>
          <TabsTrigger value="all">All ({s.alerts.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <Card>
          <EmptyState
            icon={BellOff}
            title={tab === 'attention' ? 'All clear' : 'No alerts'}
            text="Unexpected stops, detours, delays and SOS events show up here during a journey."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <AlertCard key={a.id} a={a} guardians={who} token={j?.token} name={s.name} />
          ))}
        </div>
      )}
    </div>
  )
}
