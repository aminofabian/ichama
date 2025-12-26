'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/utils/format'
import type { Notification } from '@/lib/types/notification'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{
    top?: number
    bottom?: number
    right?: number
    left?: number
    maxHeight?: string
  }>({})

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=5&unreadOnly=false')
      const result = await response.json()

      if (response.ok && result.success) {
        setNotifications(result.data.notifications.slice(0, 5))
        setUnreadCount(result.data.unreadCount)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return

    const buttonRect = buttonRef.current.getBoundingClientRect()
    const dropdownWidth = 320
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const spacing = 8

    const spaceOnRight = viewportWidth - buttonRect.right
    const spaceOnLeft = buttonRect.left
    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceAbove = buttonRect.top

    const position: typeof dropdownPosition = {}

    // Horizontal positioning
    if (spaceOnRight >= dropdownWidth + spacing) {
      position.left = buttonRect.left
    } else if (spaceOnLeft >= dropdownWidth + spacing) {
      position.right = viewportWidth - buttonRect.right
    } else {
      // Align to viewport edge with padding
      if (spaceOnRight > spaceOnLeft) {
        position.left = spacing
      } else {
        position.right = spacing
      }
    }

    // Vertical positioning
    const maxDropdownHeight = 500
    if (spaceBelow >= maxDropdownHeight + spacing) {
      position.top = buttonRect.bottom + spacing
      position.maxHeight = `${maxDropdownHeight}px`
    } else if (spaceAbove >= maxDropdownHeight + spacing) {
      position.bottom = viewportHeight - buttonRect.top + spacing
      position.maxHeight = `${maxDropdownHeight}px`
    } else {
      // Use whichever side has more space
      if (spaceBelow > spaceAbove) {
        position.top = buttonRect.bottom + spacing
        position.maxHeight = `${Math.min(maxDropdownHeight, spaceBelow - spacing)}px`
      } else {
        position.bottom = viewportHeight - buttonRect.top + spacing
        position.maxHeight = `${Math.min(maxDropdownHeight, spaceAbove - spacing)}px`
      }
    }

    setDropdownPosition(position)
  }, [])

  useEffect(() => {
    if (isOpen) {
      calculatePosition()
      const handleResize = () => calculatePosition()
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleResize, true)
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleResize, true)
      }
    }
  }, [isOpen, calculatePosition])

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      })

      if (response.ok) {
        fetchNotifications()
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      handleMarkAsRead(notification.id)
    }

    setIsOpen(false)

    if (notification.chama_id) {
      router.push(`/chamas/${notification.chama_id}`)
    } else {
      router.push('/notifications')
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="error"
            className="text-slate-100 absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <Card
            className="fixed z-50 shadow-lg"
            style={{
              width: '320px',
              maxWidth: 'calc(100vw - 2rem)',
              ...(dropdownPosition.top !== undefined && { top: `${dropdownPosition.top}px` }),
              ...(dropdownPosition.bottom !== undefined && { bottom: `${dropdownPosition.bottom}px` }),
              ...(dropdownPosition.left !== undefined && { left: `${dropdownPosition.left}px` }),
              ...(dropdownPosition.right !== undefined && { right: `${dropdownPosition.right}px` }),
              ...(dropdownPosition.maxHeight && { maxHeight: dropdownPosition.maxHeight }),
            }}
          >
            <CardContent className="p-0" style={{ width: '100%', overflow: 'hidden' }}>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold truncate flex-1 min-w-0">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="info" className="text-xs flex-shrink-0">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto" style={{ overflowX: 'hidden', maxWidth: '100%' }}>
                {isLoading ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  <div className="divide-y" style={{ width: '100%' }}>
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-muted transition-colors border-b ${
                          !notification.read_at ? 'bg-primary/5' : ''
                        }`}
                        style={{ width: '100%', overflow: 'hidden' }}
                      >
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full text-left"
                          style={{ width: '100%', overflow: 'hidden' }}
                        >
                          <div className="space-y-1" style={{ width: '100%' }}>
                            <div className="flex items-start justify-between gap-2" style={{ width: '100%' }}>
                              <p 
                                className="font-medium text-sm flex-1 pr-1" 
                                style={{ 
                                  wordBreak: 'break-word', 
                                  overflowWrap: 'break-word', 
                                  whiteSpace: 'normal',
                                  overflow: 'hidden'
                                }}
                              >
                                {notification.title}
                              </p>
                              {!notification.read_at && (
                                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p 
                              className="text-xs text-muted-foreground"
                              style={{ 
                                wordBreak: 'break-word', 
                                overflowWrap: 'break-word', 
                                whiteSpace: 'normal',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {formatRelativeTime(notification.created_at)}
                            </p>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false)
                    router.push('/notifications')
                  }}
                >
                  View All Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

