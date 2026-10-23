import { ArrowLeft, Lock, Mail, ShieldCheck, User } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const IMG =
  'https://images.unsplash.com/photo-1760917094679-d33f2ec13110?auto=format&fit=crop&w=1400&q=80'

const Field = ({ icon: I, label, ...p }) => (
  <label className="block text-sm font-medium">
    {label}
    <span className="relative mt-1 block">
      <I size={16} className="muted absolute left-3.5 top-3.5" />
      <input className="inp !pl-10" required {...p} />
    </span>
  </label>
)

// Demo-only auth: nothing is sent anywhere; the profile is kept in localStorage via AppContext.
export default function Auth({ mode }) {
  const signup = mode === 'signup',
    { signup: doSignup, signin, toast } = useApp(),
    nav = useNavigate(),
    [f, setF] = useState({ name: '', email: '', password: '' }),
    [err, setErr] = useState(''),
    [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      await (signup ? doSignup(f) : signin(f))
      toast(signup ? 'Account created' : 'Signed in')
      nav('/app')
    } catch (x) {
      setErr(x.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={IMG} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/40 to-navy/20" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <h2 className="max-w-md font-display text-4xl font-bold leading-tight">
            Every journey deserves a safe arrival.
          </h2>
          <p className="mt-3 max-w-sm text-white/80">
            Share your trip with people you trust, and let PathGuard speak up if plans change.
          </p>
        </div>
      </div>
      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <ShieldCheck className="text-mint" />
            PathGuard
          </Link>
          <Link to="/" className="muted flex items-center gap-1 text-sm hover:text-mint">
            <ArrowLeft size={14} />
            Back home
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold">{signup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="muted mt-1 text-sm">
            {signup
              ? 'Set up your profile and add the guardians who follow your trips.'
              : 'Sign in to start a journey and check on your guardians.'}
          </p>
          <form onSubmit={submit} className="mt-5 space-y-4">
            {signup && (
              <Field
                icon={User}
                label="Full name"
                autoComplete="name"
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
            )}
            <Field
              icon={Mail}
              label="Email"
              type="email"
              autoComplete="email"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
            <Field
              icon={Lock}
              label="Password"
              type="password"
              minLength={6}
              autoComplete={signup ? 'new-password' : 'current-password'}
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
            {err && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200"
              >
                {err}{' '}
                {err.startsWith('No account') && (
                  <Link to="/signup" className="font-semibold underline">
                    Sign up
                  </Link>
                )}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn-m w-full py-3">
              {signup ? 'Create account' : 'Sign in'}
            </button>
          </form>
          <p className="muted mt-6 text-center text-sm">
            {signup ? 'Already have an account?' : 'New to PathGuard?'}{' '}
            <Link
              to={signup ? '/signin' : '/signup'}
              className="font-semibold text-navy underline dark:text-white"
            >
              {signup ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
