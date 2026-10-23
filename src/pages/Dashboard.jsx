import {
  Bell,
  BellRing,
  CheckCircle2,
  Circle,
  Clock,
  History,
  MapPin,
  Navigation,
  Radio,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AlertStatusBadge,
  EmptyState,
  OutcomeBadge,
  SeverityBadge,
  timeAgo,
} from '@/components/badges'
import LiveMap from '@/components/LiveMap'
import { initials } from '@/components/AppSidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useApp } from '@/context/AppContext'
import { dt } from '@/data/mock'
import useJourney from '@/hooks/useJourney'
import { formatPhone } from '@/lib/validation'

const Stat = ({ icon: Icon, label, value, hint, to }) => (
  <Card className="transition hover:shadow-md">
    <Link to={to} className="block">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
        </div>
      </CardContent>
    </Link>
  </Card>
)

export default function Dashboard() {
  const { s } = useApp(),
    { j, open, eta, status } = useJourney(),
    h = new Date().getHours(),
    greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening',
    first = (s.name || 'there').split(' ')[0],
    safe = s.history.filter((x) => x.status !== 'Ended early').length,
    who = j ? s.contacts.filter((c) => j.guardians.includes(c.id)) : [],
    recentAlerts = s.alerts.slice(0, 4)
  const steps = [
    {
      done: s.contacts.length > 0,
      label: 'Add a guardian',
      text: 'Someone who follows your trips',
      to: '/app/guardians',
      icon: Users,
    },
    {
      done: s.notifyAlerts,
      label: 'Turn on notifications',
      text: 'Get alerts and arrival confirmations',
      to: '/app/settings',
      icon: BellRing,
    },
    {
      done: s.history.length > 0 || !!j,
      label: 'Start your first journey',
      text: 'Share it with your guardians',
      to: '/app/start',
      icon: Navigation,
    },
  ]
  const doneCount = steps.filter((x) => x.done).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">
            {greet}, {first}.{' '}
            {open.length
              ? `${open.length} alert${open.length > 1 ? 's' : ''} need your attention.`
              : j
                ? 'Your journey is being watched.'
                : 'All quiet. Start a journey when you head out.'}
          </p>
        </div>
        <Button asChild size="lg">
          <Link to={j ? '/app/active' : '/app/start'}>
            {j ? <Radio /> : <Navigation />}
            {j ? 'Open live journey' : 'Start journey'}
          </Link>
        </Button>
      </div>

      {doneCount < steps.length && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Get set up</CardTitle>
                <CardDescription>
                  {doneCount} of {steps.length} done. Finish these so your guardians can follow you.
                </CardDescription>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round((doneCount / steps.length) * 100)}%
              </span>
            </div>
            <Progress value={(doneCount / steps.length) * 100} className="mt-2 h-2" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {steps.map((x) => (
              <Link
                key={x.label}
                to={x.to}
                className="flex items-start gap-3 rounded-lg border p-3 transition hover:bg-accent/50"
              >
                {x.done ? (
                  <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={20} />
                ) : (
                  <Circle className="mt-0.5 shrink-0 text-muted-foreground" size={20} />
                )}
                <span>
                  <span
                    className={`block text-sm font-medium ${x.done ? 'line-through opacity-60' : ''}`}
                  >
                    {x.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{x.text}</span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Guardians" value={s.contacts.length} to="/app/guardians" />
        <Stat icon={Navigation} label="Journeys" value={s.history.length} to="/app/history" />
        <Stat
          icon={ShieldCheck}
          label="Safe arrivals"
          value={safe}
          hint={
            s.history.length ? `${Math.round((safe / s.history.length) * 100)}% of trips` : null
          }
          to="/app/history"
        />
        <Stat icon={Bell} label="Open alerts" value={open.length} to="/app/alerts" />
      </div>

      {j && (
        <Card className="overflow-hidden">
          <div className="grid lg:grid-cols-5">
            <div className="p-2 lg:col-span-3">
              <LiveMap pos={j.pos} dest={j.dest} path={j.path} className="h-72 lg:h-[22rem]" />
            </div>
            <div className="flex flex-col gap-4 p-5 lg:col-span-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Heading to</p>
                  <h2 className="text-lg font-semibold">{j.to}</h2>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin size={13} /> from {j.from} · {j.mode}
                  </p>
                </div>
                <Badge variant={status === 'On track' ? 'default' : 'secondary'}>{status}</Badge>
              </div>
              <div>
                <Progress value={j.progress} className="h-2" />
                <p className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock size={13} />
                  {Math.round(j.progress)}% · about {eta} min to go
                </p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Following you</p>
                <div className="flex flex-wrap gap-2">
                  {who.map((c) => (
                    <Badge key={c.id} variant="outline" className="gap-1.5 py-1 pl-1">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="bg-accent text-[10px] text-accent-foreground">
                          {initials(c.name)}
                        </AvatarFallback>
                      </Avatar>
                      {c.name}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Location sharing is {j.share ? 'on' : 'paused'}.
                </p>
              </div>
              <Button asChild variant="outline" className="mt-auto">
                <Link to="/app/active">Manage journey</Link>
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <History size={16} /> Recent journeys
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/app/history">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {s.history.length === 0 ? (
              <EmptyState
                icon={Navigation}
                title="No journeys yet"
                text="Trips you finish appear here with how they ended."
              />
            ) : (
              <ul className="divide-y">
                {s.history.slice(0, 4).map((x) => (
                  <li
                    key={x.id}
                    className="flex items-center justify-between gap-3 px-6 py-3 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {x.from} to {x.to}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dt(x.date)} · {x.mins} min · {x.mode}
                      </span>
                    </span>
                    <OutcomeBadge status={x.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell size={16} /> Latest alerts
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/app/alerts">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentAlerts.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">
                  No alerts. Nice and quiet.
                </p>
              ) : (
                <ul className="divide-y">
                  {recentAlerts.map((a) => (
                    <li key={a.id} className="space-y-1 px-6 py-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{a.label}</span>
                        <AlertStatusBadge status={a.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <SeverityBadge sev={a.sev} /> {timeAgo(a.at)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users size={16} /> Guardians
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/app/guardians">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {s.contacts.length === 0 ? (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Nobody is following your trips yet.</p>
                  <Button asChild size="sm">
                    <Link to="/app/guardians">Add a guardian</Link>
                  </Button>
                </div>
              ) : (
                s.contacts.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-accent text-accent-foreground">
                        {initials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.rel} · {formatPhone(c.phone)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
