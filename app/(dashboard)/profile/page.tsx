'use client'

import { useEffect, useState } from 'react'
import { ProfileForm } from '@/components/profile/profile-form'
import { ChangePassword } from '@/components/profile/change-password'
import { NotificationPrefs } from '@/components/profile/notification-prefs'
import { DangerZone } from '@/components/profile/danger-zone'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import type { User } from '@/lib/types/user'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/me')
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch profile')
      }

      setUser(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !user) {
    return (
      <EmptyState
        title="Failed to load profile"
        description={error}
      />
    )
  }

  if (!user) {
    return (
      <EmptyState
        title="Profile not found"
        description="Unable to load your profile information."
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile & Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <ProfileForm user={user} onUpdate={handleProfileUpdate} />

      <ChangePassword />

      <NotificationPrefs />

      <DangerZone />
    </div>
  )
}

