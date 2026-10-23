import {
  Battery,
  Bell,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Flag,
  Navigation,
  Pause,
  Play,
  Siren,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from '@/lib/toast'
import { EmptyState } from '@/components/badges'
import LiveMap from '@/components/LiveMap'
import ShareButtons from '@/components/ShareButtons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/context/AppContext'
import { tm } from '@/data/mock'
import { fmtDistance } from '@/lib/geo'
import useJourney from '@/hooks/useJourney'
import { trackUrl } from '@/lib/share'

function SosCountdown({ onDone, onCancel }) {
  const [n, setN] = useState(5),
    done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    if (n === 0) return done.current()
    const t = setTimeout(() => setN(n - 1), 1000)
    return () => clearTimeout(t)
  }, [n])
  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <p className="text-6xl font-extrabold text-destructive">{n}</p>
          <DialogTitle className="text-center">Sending SOS</DialogTitle>
          <DialogDescription className="text-center">
            Your guardians will be alerted in {n} seconds.
          </DialogDescription>
        </DialogHeader>
        <Button autoFocus onClick={onCancel} className="w-full">
          Cancel, I am okay
        </Button>
      </DialogContent>
    </Dialog>
  )
}

function Arrival({ arrival, guardians, name, onClose }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
            <CheckCircle2 size={36} />
          </div>
          <DialogTitle className="text-2xl">You reached safely</DialogTitle>
          <DialogDescription>
            You arrived at <b>{arrival.to}</b>. The journey is closed and saved to your history.
          </DialogDescription>
        </DialogHeader>
        {guardians.length > 0 && (
          <div className="space-y-3 rounded-lg border p-3">
            <p className="text-sm font-medium">Let them know you&apos;re safe</p>
            {guardians.map((g) => (
              <div key={g.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm">{g.name}</span>
                <ShareButtons contact={g} type="arrived" data={{ name, destination: arrival.to }} />
              </div>
            ))}
          </div>
        )}
        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} size="lg">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ActiveJourney() {
  const { s, set, pause, toggleShare, end, sos: sendSos } = useApp(),
    { j, open, eta, elapsed, status } = useJourney(),
    nav = useNavigate(),
    [sos, setSos] = useState(false),
    [confirmEnd, setConfirmEnd] = useState(false),
    had = useRef(false)

  useEffect(() => {
    if (j) had.current = true
    else if (had.current) {
      had.current = false
      if (!s.arrival) {
        toast.success('Journey saved to history')
        nav('/app/history')
      }
    }
  }, [j, s.arrival, nav])

  if (!j) {
    if (s.arrival)
      return (
        <Arrival
          arrival={s.arrival}
          guardians={s.contacts.filter((c) => s.arrival.ids?.includes(c.id))}
          name={s.name}
          onClose={() => {
            set({ arrival: null })
            nav('/app')
          }}
        />
      )
    return (
      <Card className="mx-auto max-w-md">
        <EmptyState
          icon={Navigation}
          title="No active journey"
          text="Start a journey to see live progress here."
        >
          <Button asChild>
            <Link to="/app/start">Start journey</Link>
          </Button>
        </EmptyState>
      </Card>
    )
  }

  const who = s.contacts.filter((c) => j.guardians.includes(c.id)),
    link = trackUrl(j.token),
    copy = () => {
      navigator.clipboard?.writeText(link)
      toast.success('Live link copied')
    }
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="overflow-hidden lg:sticky lg:top-6 lg:col-span-3 lg:self-start">
          <div className="p-2">
            <LiveMap
              pos={j.pos}
              dest={j.dest}
              path={j.path}
              className="h-[42vh] min-h-72 lg:h-[calc(100vh-14rem)]"
              label={`Live GPS · ±${Math.round(j.pos?.accuracy || 0)} m`}
            />
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          {open.length > 0 && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="flex items-center justify-between gap-3 p-4 text-sm">
                <span className="flex items-center gap-2 font-medium text-destructive">
                  <Bell size={16} /> {open.length} alert{open.length > 1 ? 's' : ''} need a response
                </span>
                <Button asChild size="sm" variant="destructive">
                  <Link to="/app/alerts">Respond</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardDescription>Heading to</CardDescription>
                <CardTitle className="text-xl">{j.to}</CardTitle>
              </div>
              <Badge variant={status === 'On track' ? 'default' : 'secondary'}>{status}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Progress value={j.progress} className="h-2.5" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {Math.round(j.progress)}% of the way · {fmtDistance(j.remainingM)} to go
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                {[
                  [Clock, `${elapsed} min`, 'elapsed'],
                  [Navigation, `~${eta} min`, 'ETA'],
                  j.battery != null
                    ? [Battery, `${j.battery}%`, 'battery']
                    : [Navigation, fmtDistance(j.remainingM), 'to go'],
                ].map(([I, v, l]) => (
                  <div key={l} className="rounded-lg border p-2">
                    <I size={16} className="mx-auto text-primary" />
                    <b className="block">{v}</b>
                    <span className="text-xs text-muted-foreground">{l}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {j.share ? <Eye size={16} /> : <EyeOff size={16} />} Location sharing
              </CardTitle>
              <CardDescription>
                {who.length} guardian{who.length === 1 ? '' : 's'} can follow this journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">
                  {j.share ? 'Sharing live location' : 'Sharing paused'}
                </span>
                <Switch
                  checked={j.share}
                  onCheckedChange={toggleShare}
                  aria-label="Share location"
                />
              </div>
              {j.share && (
                <>
                  <div className="flex gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs">
                      {link}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copy}
                      aria-label="Copy live link"
                    >
                      <Copy />
                    </Button>
                  </div>
                  {who.map((g) => (
                    <div key={g.id} className="space-y-1.5">
                      <p className="text-sm font-medium">{g.name}</p>
                      <ShareButtons
                        contact={g}
                        type="start"
                        data={{ name: s.name, destination: j.to, link }}
                      />
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 border-l-2 pl-4">
                {j.events.slice(0, 6).map((e) => (
                  <li key={e.t + e.msg} className="text-sm">
                    <span className="text-xs text-muted-foreground">{tm(e.t)}</span>
                    <br />
                    {e.msg}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-3 z-20 mx-auto flex max-w-xl gap-2 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur">
        <Button variant="outline" className="flex-1" onClick={pause}>
          {j.paused ? <Play /> : <Pause />}
          {j.paused ? 'Resume' : 'Pause'}
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => setConfirmEnd(true)}>
          <Flag /> End
        </Button>
        <Button variant="destructive" className="flex-1" onClick={() => setSos(true)}>
          <Siren /> SOS
        </Button>
      </div>

      {sos && (
        <SosCountdown
          onCancel={() => setSos(false)}
          onDone={() => {
            setSos(false)
            sendSos()
          }}
        />
      )}
      <AlertDialog open={confirmEnd} onOpenChange={setConfirmEnd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this journey early?</AlertDialogTitle>
            <AlertDialogDescription>
              Your guardians will stop seeing your location. It is saved to history as ended early.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction onClick={() => end()}>End journey</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
