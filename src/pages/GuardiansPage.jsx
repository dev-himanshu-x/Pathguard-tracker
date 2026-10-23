import { Pencil, Phone, Plus, Radio, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from '@/lib/toast'
import { initials } from '@/components/AppSidebar'
import { EmptyState } from '@/components/badges'
import GuardianDialog from '@/components/GuardianDialog'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useApp } from '@/context/AppContext'
import { trackUrl } from '@/lib/share'
import { formatPhone, MAX_GUARDIANS } from '@/lib/validation'

export default function GuardiansPage() {
  const { s, removeContact } = useApp(),
    j = s.journey,
    [dialog, setDialog] = useState({ open: false, editing: null }),
    [del, setDel] = useState(null),
    atLimit = s.contacts.length >= MAX_GUARDIANS
  const add = () => setDialog({ open: true, editing: null })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Guardians</h1>
          <p className="text-muted-foreground">
            The people who follow your journeys and hear from PathGuard if you need help.
            {s.contacts.length > 0 && ` ${s.contacts.length} of ${MAX_GUARDIANS} added.`}
          </p>
        </div>
        <Button onClick={add} disabled={atLimit} size="lg">
          <Plus /> Add guardian
        </Button>
      </div>

      {j && (
        <Card className="border-primary/40 bg-accent/40">
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            <Radio className="mt-0.5 shrink-0 text-primary" size={18} />
            <p>
              A journey to <b>{j.to}</b> is live. Send the live link to the guardians following it
              below, so they can open it and watch your progress.{' '}
              <Link to="/app/active" className="font-medium underline">
                Open journey
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {s.contacts.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No guardians yet"
            text="Add the people you trust. When you start a journey they get your live location link, and your alerts if something looks wrong."
          >
            <Button onClick={add}>
              <Plus /> Add your first guardian
            </Button>
          </EmptyState>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guardian</TableHead>
                <TableHead className="hidden md:table-cell">Relationship</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Journeys</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.contacts.map((c) => {
                const following = j?.guardians.includes(c.id)
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-accent font-semibold text-accent-foreground">
                            {initials(c.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">{c.rel}</Badge>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-2 whitespace-nowrap hover:underline"
                      >
                        <Phone size={14} className="text-muted-foreground" />
                        {formatPhone(c.phone)}
                      </a>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {following && <Badge>Following now</Badge>}
                        {c.notify ? (
                          <Badge variant="outline">On every journey</Badge>
                        ) : (
                          !following && (
                            <span className="text-sm text-muted-foreground">Manual</span>
                          )
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {following && (
                          <ShareButtons
                            contact={c}
                            type="start"
                            data={{ name: s.name, destination: j.to, link: trackUrl(j.token) }}
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${c.name}`}
                          onClick={() => setDialog({ open: true, editing: c })}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${c.name}`}
                          onClick={() => setDel(c)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <GuardianDialog
        open={dialog.open}
        editing={dialog.editing}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
      />
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {del?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will stop receiving your journeys and alerts. You can add them again any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                removeContact(del.id)
                toast.success(`${del.name} removed`)
                setDel(null)
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
