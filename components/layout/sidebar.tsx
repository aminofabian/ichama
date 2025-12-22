'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Wallet,
  History,
  Bell,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '../ui/avatar'

export interface SidebarProps {
  user?: {
    id: string
    full_name: string
    phone_number: string
  } | null
  collapsed?: boolean
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/chamas', label: 'Chamas', icon: Users },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/history', label: 'History', icon: History },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ user, collapsed = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-background transition-all',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed && <span className="text-lg font-bold">Merry</span>}
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center'
              )}
            >
              <Icon className="h-5 w-5" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {user && (
        <div
          className={cn(
            'border-t p-4',
            collapsed && 'flex flex-col items-center'
          )}
        >
          <div className={cn('flex items-center space-x-3', collapsed && 'flex-col')}>
            <Avatar name={user.full_name} size="sm" />
            {!collapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium">{user.full_name}</p>
                <p className="text-xs text-muted-foreground">{user.phone_number}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

