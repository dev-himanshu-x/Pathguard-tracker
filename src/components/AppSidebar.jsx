import {
  Bell,
  ChevronsUpDown,
  History,
  LayoutDashboard,
  LogOut,
  Navigation,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { useApp } from '@/context/AppContext'
import useJourney from '@/hooks/useJourney'

export const initials = (n = '') =>
  n
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'

export default function AppSidebar() {
  const { s, logout } = useApp(),
    { j, open } = useJourney(),
    { pathname } = useLocation(),
    navigate = useNavigate(),
    { setOpenMobile } = useSidebar()
  const items = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, active: pathname === '/app' },
    {
      to: j ? '/app/active' : '/app/start',
      label: 'Journey',
      icon: Navigation,
      active: pathname === '/app/start' || pathname === '/app/active',
      badge: j ? 'Live' : null,
    },
    {
      to: '/app/alerts',
      label: 'Alerts',
      icon: Bell,
      active: pathname === '/app/alerts',
      badge: open.length || null,
      danger: true,
    },
    {
      to: '/app/guardians',
      label: 'Guardians',
      icon: Users,
      active: pathname === '/app/guardians',
    },
    { to: '/app/history', label: 'History', icon: History, active: pathname === '/app/history' },
  ]
  const close = () => setOpenMobile(false)
  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          to="/app"
          onClick={close}
          className="flex items-center gap-2 px-2 py-1.5 font-display text-lg font-bold"
        >
          <ShieldCheck className="text-primary" />
          PathGuard
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((n) => (
                <SidebarMenuItem key={n.label}>
                  <SidebarMenuButton asChild isActive={n.active} tooltip={n.label}>
                    <Link to={n.to} onClick={close}>
                      <n.icon />
                      <span>{n.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {n.badge && (
                    <SidebarMenuBadge
                      className={
                        n.danger
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-primary text-primary-foreground'
                      }
                    >
                      {n.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/app/settings'}
                  tooltip="Settings"
                >
                  <Link to="/app/settings" onClick={close}>
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-accent text-accent-foreground">
                      {initials(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{s.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{s.user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  <LogOut /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
