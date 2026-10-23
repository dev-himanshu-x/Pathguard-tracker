import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  EyeOff,
  LayoutDashboard,
  Lock,
  Navigation,
  Radio,
  Route,
  ShieldCheck,
  Siren,
  UserCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapView } from '../components/common'
import { useApp } from '../context/AppContext'
import DemoJourneyCard from '../components/DemoJourneyCard'
import { ALERT } from '../data/mock'

const HERO_IMG = '/kiet-campus.png'
const FOOTER_IMG =
  'https://images.unsplash.com/photo-1789886797928-80f4abdf2744?auto=format&fit=crop&w=1800&q=80'
const SPLIT_IMG =
  'https://images.unsplash.com/photo-1760917094679-d33f2ec13110?auto=format&fit=crop&w=1200&q=80'
const SCENARIOS = [
  {
    img: 'https://images.unsplash.com/photo-1741637335289-c99652d3155f?auto=format&fit=crop&w=500&q=80',
    t: 'Leaving a late lab or library session',
  },
  {
    img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=500&q=80',
    t: 'Heading home after meeting friends across town',
  },
  {
    img: 'https://images.unsplash.com/photo-1785788683181-eecdcce2a952?auto=format&fit=crop&w=500&q=80',
    t: 'Taking an unfamiliar route after dark',
  },
]
const FEATURES = [
  [
    Route,
    'Route awareness',
    'Notices unexpected stops, detours and delays on your planned route.',
    'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300',
  ],
  [
    BellRing,
    'Calm escalation',
    'Alerts reach your guardians only after you have had time to respond.',
    'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  ],
  [
    UserCheck,
    'Chosen guardians',
    'Only people you pick see your trip, and only while you allow it.',
    'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',
  ],
  [
    Siren,
    'One-tap SOS',
    'A single tap notifies your guardians immediately if plans change fast.',
    'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
  ],
]
const FLOW = [
  [Navigation, 'Start a journey', 'Pick where you are going and who may follow along.'],
  [Radio, 'PathGuard watches', 'Progress is tracked quietly against your planned route.'],
  [BellRing, 'Escalates if needed', 'Unexpected stops or silence trigger a calm, timed alert.'],
  [CheckCircle2, 'Safe arrival', 'The journey closes itself. Guardians see you got there.'],
]
const TIMELINE = [
  { t: '8:10 PM', m: 'Journey started — Raj Nagar Extension to KIET Campus (Cab)' },
  { t: '8:34 PM', m: ALERT.stop.msg },
  { t: '8:36 PM', m: 'Back on route, ETA recalculated' },
  { t: '8:44 PM', m: 'Arrived safely — Ananya Sharma notified', done: true },
]

const pillNav =
  'inline-flex items-center gap-2 rounded-full bg-mint px-5 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-emerald-400 active:scale-[.98]'
const _pillOnPhoto =
  'inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-[.98]'

const Eyebrow = ({ children }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint">{children}</p>
)

function LiveDemo() {
  const [p, setP] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setP((x) => (x >= 100 ? 0 : Math.min(100, x + 4))), 700)
    return () => clearInterval(t)
  }, [])
  const shown = TIMELINE.filter((_, i) => p >= [0, 50, 75, 100][i])
  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-5">
      <div className="card overflow-hidden p-2 lg:col-span-3">
        <MapView progress={p} className="h-72 sm:h-96" />
      </div>
      <div className="card flex flex-col p-6 lg:col-span-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span
            className={`h-2 w-2 rounded-full ${p >= 100 ? 'bg-mint' : 'animate-pulse bg-mint'}`}
          />
          {p >= 100 ? 'Arrived safely' : `On track · ${Math.round(p)}% of route`}
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${p}%` }} />
        </div>
        <ol className="relative mt-6 space-y-5 border-l border-slate-200 pl-6 dark:border-slate-800">
          {shown.map((e) => (
            <li key={e.t} className="relative">
              <span
                className={`absolute -left-[29px] grid h-4 w-4 place-items-center rounded-full ${e.done ? 'bg-mint' : 'bg-slate-300 dark:bg-slate-600'}`}
              />
              <p className="text-xs font-semibold text-slate-400">{e.t}</p>
              <p className={`mt-0.5 text-sm ${e.done ? 'font-semibold text-mint' : ''}`}>{e.m}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default () => {
  const { s } = useApp(),
    user = s.user
  return (
    <div className="overflow-x-clip">
      <nav className="mx-auto grid max-w-6xl grid-cols-2 items-center gap-4 border-b border-slate-200 p-5 sm:grid-cols-[1fr_auto_1fr] dark:border-slate-800">
        <span className="flex items-center gap-2 font-display font-bold">
          <ShieldCheck className="text-mint" />
          PathGuard
        </span>
        <div className="hidden items-center gap-7 text-sm font-medium sm:flex">
          {[
            ['#how', 'How it works'],
            ['#features', 'Features'],
            ['#demo', 'Live demo'],
            ['#privacy', 'Privacy'],
          ].map(([h, l]) => (
            <a key={h} href={h} className="muted hover:text-mint">
              {l}
            </a>
          ))}
        </div>
        <div className="flex justify-end">
          {user ? (
            <Link to="/app" className={pillNav}>
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          ) : (
            <Link to="/signin" className={pillNav}>
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <section>
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700 relative min-h-[max(640px,calc(100svh-4.5rem))] overflow-hidden">
          <img
            src={HERO_IMG}
            alt="The KIET campus main building with a fountain in front"
            className="absolute inset-0 h-full w-full object-cover object-[50%_18%] opacity-90"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/85 via-navy/60 to-navy/45" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy/50 to-transparent" />

          <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-6xl flex-col justify-center px-5 py-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
              <div className="text-center lg:text-left">
                <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-white [text-shadow:0_2px_24px_rgba(15,23,42,.55)] sm:text-6xl">
                  Every journey deserves a safe arrival.
                </h1>
                <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-white/85 lg:mx-0">
                  PathGuard follows your trip quietly and lets the people you trust know you got
                  there, or that you could use a hand.
                </p>
                {user ? (
                  <Link to="/app/start" className={`${pillNav} mt-6`}>
                    Start journey
                  </Link>
                ) : (
                  <Link to="/signin" className={`${pillNav} mt-6`}>
                    Sign in to start journey
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
              <DemoJourneyCard id="start" className="mx-auto w-full max-w-md" />
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-16">
        <Eyebrow>From the first step to arrival</Eyebrow>
        <h2 className="mt-2 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
          One quiet thread, start to finish
        </h2>
        <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
          {FLOW.map(([I, t, d], i) => (
            <div key={t} className="flex flex-1 items-center gap-3 lg:items-stretch">
              <div className="card flex flex-1 flex-col gap-3 p-5">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-mint dark:bg-emerald-900/30">
                  <I size={18} />
                </div>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="muted mt-1 text-sm leading-relaxed">{d}</p>
                </div>
              </div>
              {i < FLOW.length - 1 && (
                <ArrowRight className="muted hidden shrink-0 lg:mx-3 lg:block" size={20} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-16">
        <Eyebrow>What PathGuard does</Eyebrow>
        <h2 className="mt-2 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Your companion for the road ahead
        </h2>
        <p className="muted mt-4 max-w-2xl text-lg leading-relaxed">
          Whether you are leaving a late lab session or heading home after a long shift, PathGuard
          keeps your planned route visible to the people you trust — quietly, until it needs to
          speak up.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FEATURES.map(([I, t, d, tint]) => (
            <div key={t} className="card p-6">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}>
                <I size={20} />
              </div>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="muted mt-1 text-sm leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <Eyebrow>Why it's different</Eyebrow>
        <h2 className="mt-2 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Walking alone isn't the same as walking watched
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 dark:border-slate-700">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <EyeOff size={20} />
            </div>
            <h3 className="mt-4 font-semibold text-slate-700 dark:text-slate-300">
              Without a safety net
            </h3>
            <ul className="muted mt-3 space-y-2 text-sm leading-relaxed">
              <li>No one knows you're running late until you call.</li>
              <li>A missed message means nobody checks in.</li>
              <li>Help only comes after something's already wrong.</li>
            </ul>
          </div>
          <div className="card border-2 border-mint/30 p-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-mint dark:bg-emerald-900/30">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="mt-4 font-semibold">With PathGuard</h3>
            <ul className="muted mt-3 space-y-2 text-sm leading-relaxed">
              <li>Guardians see calm, live progress — no calls needed.</li>
              <li>Unexpected stops and delays are noticed automatically.</li>
              <li>Alerts escalate on their own if you go quiet.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-6xl scroll-mt-4 px-5 py-16">
        <Eyebrow>See it in action</Eyebrow>
        <h2 className="mt-2 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
          A journey, as your guardian sees it
        </h2>
        <p className="muted mt-4 max-w-xl text-lg leading-relaxed">
          A looping simulated trip. Nothing here is a real location.
        </p>
        <LiveDemo />
      </section>

      <section id="privacy" className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 aspect-[4/3] overflow-hidden rounded-[2rem] lg:order-1">
            <img
              src={SPLIT_IMG}
              alt="An aerial view of a college campus"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="order-1 lg:order-2">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-mint dark:bg-emerald-900/30">
              <Lock size={20} />
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Your location stays yours
            </h2>
            <p className="muted mt-4 text-lg leading-relaxed">
              Guardians see your live location only during a journey you start, and only if you
              consent. You can pause or revoke sharing at any moment. This demo stores everything on
              your device and sends nothing anywhere.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <Eyebrow>Illustrative scenarios</Eyebrow>
        <h2 className="mt-2 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Built for the trips that make you glance at the clock
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {SCENARIOS.map((s) => (
            <div key={s.t} className="card overflow-hidden p-0">
              <div className="aspect-square overflow-hidden">
                <img src={s.img} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <p className="p-4 text-sm font-medium leading-snug">{s.t}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative mt-4 overflow-hidden rounded-t-[2.5rem] bg-mist dark:bg-[#0B1120]">
        <div className="mx-auto max-w-6xl px-5 pb-10 pt-16">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <span className="flex items-center gap-2 font-display font-bold">
                <ShieldCheck className="text-mint" />
                PathGuard
              </span>
              <p className="muted mt-3 max-w-xs text-sm leading-relaxed">
                A demo safe-journey tracker. Locations, ETAs, SOS and guardian alerts are simulated.
              </p>
              <p className="mt-5 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-mint dark:bg-emerald-900/40">
                  <CheckCircle2 size={12} />
                </span>
                All data simulated · nothing leaves your device
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Product</p>
              <ul className="muted mt-3 space-y-2 text-sm">
                <li>
                  <Link to="/app" className="hover:text-mint">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <a href="#start" className="hover:text-mint">
                    Start journey
                  </a>
                </li>
                <li>
                  <Link to="/app/guardian" className="hover:text-mint">
                    Guardian view
                  </Link>
                </li>
                <li>
                  <Link to="/app/alerts" className="hover:text-mint">
                    Alert center
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Explore</p>
              <ul className="muted mt-3 space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-mint">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how" className="hover:text-mint">
                    How it works
                  </a>
                </li>
                <li>
                  <a href="#privacy" className="hover:text-mint">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs dark:border-slate-800">
            <p className="muted">
              © 2026 PathGuard · KIET InnoTech hackathon demo. All data is simulated.
            </p>
          </div>
        </div>
        <div className="relative h-56 sm:h-72 lg:h-80">
          <img
            src={FOOTER_IMG}
            alt="A tree-lined campus path with students walking"
            className="absolute inset-0 h-full w-full object-cover object-[50%_60%]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-mist via-mist/10 to-transparent dark:from-[#0B1120] dark:via-[#0B1120]/10" />
        </div>
      </footer>
    </div>
  )
}
