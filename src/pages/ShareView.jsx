import { Bell, CheckCircle2, EyeOff, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, timeAgo } from '@/components/badges'
import LiveMap from '@/components/LiveMap'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { tm } from '@/data/mock'
import { readLive, subscribeLive } from '@/services/live'

const STATUS = {
  'on-track': ['On track', 'default'],
  attention: ['Needs attention', 'secondary'],
  'needs-help': ['Needs help', 'destructive'],
}

export default function ShareView() {
  const { token } = useParams(),
    [d, setD] = useState(() => readLive(token))
  useEffect(() => subscribeLive(token, setD), [token])
  const first = d?.name?.split(' ')[0] || 'They'
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-xl space-y-5">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <ShieldCheck className="text-primary" /> PathGuard
        </Link>
        {!d ? (
          <Card>
            <EmptyState
              icon={Users}
              title="Nothing to see here"
              text="This link is invalid, or the journey is not on this browser. Live sharing between different devices needs the PathGuard server."
            >
              <Button asChild>
                <Link to="/">Go to PathGuard</Link>
              </Button>
            </EmptyState>
          </Card>
        ) : d.done ? (
          <Card>
            <EmptyState
              icon={CheckCircle2}
              title={d.outcome === 'arrived' ? `${first} reached safely` : 'Journey ended'}
              text={
                d.outcome === 'arrived'
                  ? `${first} arrived at ${d.to}. ${timeAgo(d.updatedAt)}.`
                  : `${first} ended the journey to ${d.to}.`
              }
            />
          </Card>
        ) : !d.share ? (
          <Card>
            <EmptyState
              icon={EyeOff}
              title="Location sharing is paused"
              text={`${first} paused sharing. You will see live status again when they resume.`}
            />
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden">
              <div className="p-2">
                <LiveMap pos={d.pos} dest={d.dest} path={d.path} className="h-80" />
              </div>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">
                  {first} is heading to {d.to}
                </CardTitle>
                <Badge variant={STATUS[d.status]?.[1]}>
                  {d.paused ? 'Paused' : STATUS[d.status]?.[0] || 'On track'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <Progress value={d.progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {Math.round(d.progress)}% of the way · updated {timeAgo(d.updatedAt)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell size={16} /> Recent updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {d.events?.map((e) => (
                    <li key={e.t + e.msg}>
                      <span className="text-muted-foreground">{tm(e.t)}</span> {e.msg}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
