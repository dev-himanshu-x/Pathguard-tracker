import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const SEV = {
  Critical: 'border-destructive/30 bg-destructive/10 text-destructive',
  High: 'border-destructive/30 bg-destructive/10 text-destructive',
  Medium: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  Low: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  Info: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
}
const STATUS = {
  open: [
    'Needs response',
    'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  ],
  ack: ['Acknowledged', 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'],
  escalated: ['Escalated', 'border-destructive/30 bg-destructive/10 text-destructive'],
  resolved: [
    'Resolved',
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  ],
}
const OUTCOME = {
  'Arrived safely': SEV.Info,
  'Alert resolved': SEV.Low,
  'Ended early': 'border-border bg-muted text-muted-foreground',
}
export const SeverityBadge = ({ sev }) => (
  <Badge variant="outline" className={cn('font-medium', SEV[sev])}>
    {sev}
  </Badge>
)
export const AlertStatusBadge = ({ status }) => (
  <Badge variant="outline" className={cn('font-medium', STATUS[status]?.[1])}>
    {STATUS[status]?.[0] || status}
  </Badge>
)
export const OutcomeBadge = ({ status }) => (
  <Badge variant="outline" className={cn('font-medium', OUTCOME[status])}>
    {status}
  </Badge>
)
export const EmptyState = ({ icon: Icon, title, text, children }) => (
  <div className="flex flex-col items-center px-6 py-12 text-center">
    <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
      <Icon size={22} />
    </div>
    <p className="font-semibold">{title}</p>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
    {children && <div className="mt-4">{children}</div>}
  </div>
)
export const timeAgo = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  if (m < 1440) return `${Math.round(m / 60)} h ago`
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' })
}
