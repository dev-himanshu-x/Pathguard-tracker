import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import AppSidebar from '@/components/AppSidebar'
import { Toaster } from '@/components/ui/toaster'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useApp } from './context/AppContext'
import Active from './pages/ActiveJourney'
import Alerts from './pages/AlertCenter'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Guardians from './pages/GuardiansPage'
import Hist from './pages/HistoryPage'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import Sett from './pages/SettingsPage'
import ShareView from './pages/ShareView'
import Start from './pages/StartJourney'

const TITLES = {
  '/app': 'Dashboard',
  '/app/start': 'Start a journey',
  '/app/active': 'Live journey',
  '/app/guardians': 'Guardians',
  '/app/alerts': 'Alerts',
  '/app/history': 'History',
  '/app/settings': 'Settings',
}
function Shell() {
  const { s } = useApp(),
    { pathname } = useLocation()
  if (!s.user) return <Navigate to="/signin" replace />
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <SidebarTrigger />
          <Link to="/app" className="font-display font-semibold">
            {TITLES[pathname] || 'PathGuard'}
          </Link>
        </header>
        <main
          id="main"
          key={pathname}
          className="mx-auto w-full max-w-[1400px] animate-in fade-in-0 slide-in-from-bottom-1 p-4 duration-300 sm:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
const Home = () => (useApp().s.user ? <Navigate to="/app" replace /> : <Landing />)
export default () => (
  <>
    <Toaster />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<Auth mode="signin" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/share/:token" element={<ShareView />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<Dashboard />} />
        <Route path="start" element={<Start />} />
        <Route path="active" element={<Active />} />
        <Route path="guardians" element={<Guardians />} />
        <Route path="guardian" element={<Navigate to="/app/guardians" replace />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="history" element={<Hist />} />
        <Route path="settings" element={<Sett />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
)
