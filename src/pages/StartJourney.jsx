import { zodResolver } from '@hookform/resolvers/zod'
import { LocateFixed, MapPin, Navigation, Users } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { initials } from '@/components/AppSidebar'
import { EmptyState } from '@/components/badges'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useApp } from '@/context/AppContext'
import { MODES } from '@/data/mock'
import usePlaces from '@/hooks/usePlaces'
import { cn } from '@/lib/utils'
import { getPosition } from '@/lib/geo'
import { formatPhone, journeySchema } from '@/lib/validation'
import { reverseName, searchPlaces } from '@/services/places'

function PlaceInput({ field, placeholder, id, onPick }) {
  const [focus, setFocus] = useState(false),
    { list, loading } = usePlaces(field.value || ''),
    sug = list.filter((p) => p.name !== field.value)
  return (
    <div className="relative">
      <MapPin size={16} className="absolute left-3 top-3 text-muted-foreground" />
      <FormControl>
        <Input
          id={id}
          className="pl-9"
          placeholder={placeholder}
          autoComplete="off"
          {...field}
          onFocus={() => setFocus(true)}
          onBlur={() => {
            field.onBlur()
            setTimeout(() => setFocus(false), 150)
          }}
        />
      </FormControl>
      {focus && (loading || sug.length > 0) && (
        <ul className="absolute z-20 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          {loading && (
            <li className="px-3 py-2 text-xs text-muted-foreground">Searching Ghaziabad…</li>
          )}
          {sug.map((p) => (
            <li key={p.name}>
              <button
                type="button"
                className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={() => {
                  field.onChange(p.name)
                  onPick?.(p)
                }}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function StartJourney() {
  const { s, start } = useApp(),
    nav = useNavigate(),
    picked = useRef(null),
    [busy, setBusy] = useState(''),
    form = useForm({
      resolver: zodResolver(journeySchema),
      defaultValues: {
        to: '',
        mode: 'Cab',
        dur: 30,
        guardians: s.contacts.filter((c) => c.notify).map((c) => c.id),
      },
    })
  if (s.contacts.length === 0)
    return (
      <div className="mx-auto max-w-lg">
        <Card>
          <EmptyState
            icon={Users}
            title="Add a guardian first"
            text="A journey needs at least one guardian who can follow it and hear from PathGuard if you need help."
          >
            <Button asChild>
              <Link to="/app/guardians">Add a guardian</Link>
            </Button>
          </EmptyState>
        </Card>
      </div>
    )
  return (
    <Form {...form}>
      <form
        noValidate
        className="grid items-start gap-6 lg:grid-cols-5"
        onSubmit={form.handleSubmit(async (v) => {
          // Real location: start from where the device is now and head to the geocoded destination.
          setBusy('Getting your location…')
          let origin
          try {
            origin = await getPosition()
          } catch (e) {
            setBusy('')
            return form.setError('to', {
              message:
                e.code === 1
                  ? 'Allow location access in your browser so your guardians can follow you.'
                  : 'Could not get your location. Check that location is on and try again.',
            })
          }
          setBusy('Finding your destination…')
          const dest =
            picked.current?.name === v.to
              ? picked.current
              : await searchPlaces(v.to)
                  .then((r) => r[0])
                  .catch(() => null)
          if (!dest) {
            setBusy('')
            return form.setError('to', {
              message: 'Could not find that place in Ghaziabad. Pick one from the suggestions.',
            })
          }
          const from = await reverseName(origin.lat, origin.lng)
          setBusy('')
          start({
            ...v,
            from,
            origin,
            dest: { lat: dest.lat, lng: dest.lng },
            consent: { location: true, eta: true, alerts: true },
          })
          nav('/app/active')
        })}
      >
        <div className="lg:col-span-5">
          <h1 className="text-2xl font-bold sm:text-3xl">Start a journey</h1>
          <p className="text-muted-foreground">
            Pick where you are going and who follows. They get your live link as soon as you start.
          </p>
        </div>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
              <LocateFixed size={16} className="text-primary" />
              <span>
                Starting from <b>your current location</b>
              </span>
            </div>
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <PlaceInput
                    field={field}
                    placeholder="Search a destination in Ghaziabad"
                    onPick={(p) => {
                      picked.current = p
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Travel mode</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {MODES.map((m) => (
                      <Button
                        key={m}
                        type="button"
                        variant={field.value === m ? 'default' : 'outline'}
                        aria-pressed={field.value === m}
                        onClick={() => field.onChange(m)}
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected duration: {field.value} min</FormLabel>
                  <FormControl>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="5"
                      className="w-full accent-emerald-500"
                      value={field.value}
                      onChange={(e) => field.onChange(+e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    If you are much later than this, PathGuard raises a delay alert.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Who follows this journey</CardTitle>
              <CardDescription>They receive your live link and any alerts.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="guardians"
                render={({ field }) => (
                  <FormItem>
                    <div className="space-y-2">
                      {s.contacts.map((c) => {
                        const on = field.value.includes(c.id)
                        return (
                          <label
                            key={c.id}
                            htmlFor={`g-${c.id}`}
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition',
                              on && 'border-primary bg-accent/40',
                            )}
                          >
                            <Checkbox
                              id={`g-${c.id}`}
                              checked={on}
                              onCheckedChange={(v) =>
                                field.onChange(
                                  v
                                    ? [...field.value, c.id]
                                    : field.value.filter((x) => x !== c.id),
                                )
                              }
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                                {initials(c.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">{c.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {c.rel} · {formatPhone(c.phone)}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <Button type="submit" size="lg" className="w-full" disabled={!!busy}>
            <Navigation /> {busy || 'Start journey'}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            You can pause or stop sharing at any time.
          </p>
        </div>
      </form>
    </Form>
  )
}
