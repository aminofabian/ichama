'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationList } from '@/components/notifications/notification-list'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { CheckCheck } from 'lucide-react'
import type { Notification } from '@/lib/types/notification'

interface NotificationsData {
  notifications: Notification[]
  unreadCount: number
}

export default function NotificationsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [data, setData] = useState<NotificationsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch notifications')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to mark notification as read')
      }

      // Refresh notifications
      fetchNotifications()
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to mark notification as read',
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to mark all notifications as read')
      }

      addToast({
        variant: 'success',
        title: 'Success',
        description: 'All notifications marked as read',
      })

      // Refresh notifications
      fetchNotifications()
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to mark all notifications as read',
      })
    }
  }

  const handleNavigate = (notification: Notification) => {
    if (notification.chama_id) {
      router.push(`/chamas/${notification.chama_id}`)
    } else if (notification.data) {
      try {
        const data = JSON.parse(notification.data)
        if (data.cycle_id) {
          // Extract chama_id from cycle if possible, or navigate to cycle
          router.push(`/chamas/${notification.chama_id}/cycles/${data.cycle_id}`)
        } else if (notification.chama_id) {
          router.push(`/chamas/${notification.chama_id}`)
        }
      } catch {
        // If parsing fails, just navigate to dashboard
        router.push('/dashboard')
      }
    } else {
      router.push('/dashboard')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <EmptyState
        title="Failed to load notifications"
        description={error}
      />
    )
  }

  if (!data) {
    return (
      <EmptyState
        title="No notifications available"
        description="Your notifications will appear here."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {data.unreadCount > 0
              ? `${data.unreadCount} unread notification${data.unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {data.unreadCount > 0 && (
          <Button variant="primary" onClick={handleMarkAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <NotificationList
        notifications={data.notifications}
        onMarkAsRead={handleMarkAsRead}
        onNavigate={handleNavigate}
      />

      {error && data && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 p-4 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}

