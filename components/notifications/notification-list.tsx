'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatRelativeTime } from '@/lib/utils/format'
import {
  Bell,
  CheckCircle2,
  Gift,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  Info,
  DollarSign,
} from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import type { Notification } from '@/lib/types/notification'

interface NotificationListProps {
  notifications: Notification[]
  onMarkAsRead?: (id: string) => void
  onNavigate?: (notification: Notification) => void
}

const typeIcons = {
  contribution_reminder: Calendar,
  contribution_confirmed: CheckCircle2,
  contribution_overdue: AlertCircle,
  payout_scheduled: Gift,
  payout_sent: Gift,
  payout_received: Gift,
  cycle_started: TrendingUp,
  cycle_ended: CheckCircle2,
  cycle_period_advanced: Calendar,
  member_joined: Users,
  member_left: Users,
  member_removed: Users,
  invite_received: Bell,
  invite_accepted: CheckCircle2,
  announcement: Info,
  dispute_update: AlertCircle,
  rating_changed: TrendingUp,
  loan_requested: DollarSign,
  system: Info,
}

const getTypeIcon = (type: Notification['type']) => {
  const Icon = typeIcons[type] || Bell
  return <Icon className="h-5 w-5" />
}

const getTypeColor = (type: Notification['type']) => {
  if (type.includes('confirmed') || type.includes('received') || type === 'invite_accepted') {
    return 'text-green-500'
  }
  if (type.includes('overdue') || type.includes('removed')) {
    return 'text-red-500'
  }
  if (type.includes('reminder') || type.includes('scheduled')) {
    return 'text-orange-500'
  }
  return 'text-blue-500'
}

const groupNotificationsByDate = (notifications: Notification[]) => {
  const groups: Record<string, Notification[]> = {}
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  notifications.forEach((notification) => {
    const date = new Date(notification.created_at)
    date.setHours(0, 0, 0, 0)

    let groupKey: string
    const diffTime = today.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      groupKey = 'Today'
    } else if (diffDays === 1) {
      groupKey = 'Yesterday'
    } else if (diffDays < 7) {
      groupKey = 'This Week'
    } else if (diffDays < 30) {
      groupKey = 'This Month'
    } else {
      groupKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(notification)
  })

  return groups
}

export function NotificationList({
  notifications,
  onMarkAsRead,
  onNavigate,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Your notifications will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No notifications"
            description="You're all caught up! No new notifications."
          />
        </CardContent>
      </Card>
    )
  }

  const grouped = groupNotificationsByDate(notifications)

  const handleClick = (notification: Notification) => {
    if (!notification.read_at && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    if (onNavigate) {
      onNavigate(notification)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Your notifications and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateGroup, groupNotifications]) => (
            <div key={dateGroup}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{dateGroup}</h3>
              <div className="space-y-2">
                {groupNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleClick(notification)}
                    className={`w-full text-left rounded-lg border p-4 transition-colors hover:bg-muted ${
                      !notification.read_at ? 'bg-primary/5 border-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 mt-0.5 ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm break-words whitespace-normal flex-1 min-w-0">{notification.title}</p>
                          {!notification.read_at && (
                            <Badge variant="info" className="text-xs flex-shrink-0">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 break-words whitespace-normal">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

