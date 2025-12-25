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
      <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-[#FFD700]/5 blur-3xl animate-pulse" />
          <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-[#F5E6D3]/10 blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10">
          <LoadingSpinner size="lg" />
        </div>
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
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20 md:pb-8">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-[#FFD700]/5 blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-[#F5E6D3]/10 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 space-y-6">
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
    </div>
  )
}

