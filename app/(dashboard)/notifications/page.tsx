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
    <div className="relative min-h-screen bg-background">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#FFD700]/10 via-[#FFD700]/5 to-transparent blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent blur-3xl animate-pulse delay-2000" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background/60" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-3 pt-4 md:px-6 md:pt-8 pb-20 md:pb-12">
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
              <div className="relative inline-block mb-2">
                <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-primary/30 via-purple-500/20 to-blue-500/30 rounded-xl md:rounded-2xl blur-xl opacity-60 animate-pulse" />
                <h1 className="relative bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-2xl md:text-4xl font-bold tracking-tight text-transparent">
                  Notifications
                </h1>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
            {data.unreadCount > 0
              ? `${data.unreadCount} unread notification${data.unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {data.unreadCount > 0 && (
              <Button 
                variant="primary" 
                onClick={handleMarkAllAsRead}
                className="w-full sm:w-auto"
              >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

          <div className="overflow-hidden">
      <NotificationList
        notifications={data.notifications}
        onMarkAsRead={handleMarkAsRead}
        onNavigate={handleNavigate}
      />
          </div>

      {error && data && (
            <div className="rounded-xl border-2 border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive backdrop-blur-sm">
          {error}
        </div>
      )}
        </div>
      </div>
    </div>
  )
}

