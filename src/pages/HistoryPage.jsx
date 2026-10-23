import { Download, History, Search, SearchX, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from '@/lib/toast'
import { EmptyState, OutcomeBadge } from '@/components/badges'
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
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useApp } from '@/context/AppContext'
import { dt, tm } from '@/data/mock'

const STATUSES = ['Arrived safely', 'Alert resolved', 'Ended early']

function exportCsv(rows) {
  const head = ['From', 'To', 'Mode', 'Date', 'Minutes', 'Status', 'Guardians'],
    body = rows.map((h) => [h.from, h.to, h.mode, h.date, h.mins, h.status, h.guardians || ''])
  const csv = [head, ...body]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n'),
    url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
    a = document.createElement('a')
  a.href = url
  a.download = 'pathguard-history.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke later: revoking straight after click can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export default function HistoryPage() {
  const { s, clearHistory } = useApp(),
    [q, setQ] = useState(''),
    [st, setSt] = useState('all'),
    [sel, setSel] = useState(null),
    [confirm, setConfirm] = useState(false)
  const rows = s.history.filter(
    (h) =>
      (st === 'all' || h.status === st) &&
      `${h.from} ${h.to}`.toLowerCase().includes(q.trim().toLowerCase()),
  )
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">History</h1>
          <p className="text-muted-foreground">Every journey you have finished and how it ended.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={!rows.length} onClick={() => exportCsv(rows)}>
            <Download /> Export CSV
          </Button>
          <Button variant="outline" disabled={!s.history.length} onClick={() => setConfirm(true)}>
            <Trash2 /> Clear
          </Button>
        </div>
      </div>

      {s.history.length === 0 ? (
        <Card>
          <EmptyState
            icon={History}
            title="No journeys yet"
            text="When you finish a journey it is saved here with its route, duration and outcome."
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-56 flex-1">
              <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <Input
                aria-label="Search journeys"
                placeholder="Search places"
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={st} onValueChange={setSt}>
              <SelectTrigger className="w-48" aria-label="Filter by outcome">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outcomes</SelectItem>
                {STATUSES.map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card>
            {rows.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No journeys match"
                text="Try a different search or filter."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Mode</TableHead>
                    <TableHead className="hidden md:table-cell">Duration</TableHead>
                    <TableHead className="text-right">Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((h) => (
                    <TableRow key={h.id} className="cursor-pointer" onClick={() => setSel(h)}>
                      <TableCell className="max-w-[18rem]">
                        <span className="block truncate font-medium">
                          {h.from} to {h.to}
                        </span>
                        <span className="text-xs text-muted-foreground sm:hidden">
                          {dt(h.date)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{dt(h.date)}</TableCell>
                      <TableCell className="hidden md:table-cell">{h.mode}</TableCell>
                      <TableCell className="hidden md:table-cell">{h.mins} min</TableCell>
                      <TableCell className="text-right">
                        <OutcomeBadge status={h.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="sm:max-w-lg">
          {sel && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {sel.from} to {sel.to}
                </DialogTitle>
                <DialogDescription>
                  {dt(sel.date)} · {tm(sel.date)}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Outcome', <OutcomeBadge key="o" status={sel.status} />],
                  ['Mode', sel.mode],
                  ['Duration', `${sel.mins} min`],
                  ['Followed by', sel.guardians || 'Not recorded'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              {sel.events?.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Timeline</p>
                  <ol className="max-h-56 space-y-2 overflow-y-auto border-l-2 pl-4 text-sm">
                    {[...sel.events].reverse().map((e) => (
                      <li key={e.t + e.msg}>
                        <span className="text-xs text-muted-foreground">{tm(e.t)}</span>
                        <br />
                        {e.msg}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all history?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes all {s.history.length} saved journeys. It can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearHistory()
                toast.success('History cleared')
              }}
            >
              Clear history
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
