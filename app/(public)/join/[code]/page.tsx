'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { InvitePreview } from '@/components/invite/invite-preview'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/components/ui/toast'
import type { Chama } from '@/lib/types/chama'
import type { Invitation } from '@/lib/types/chama'

interface InviteData {
  invitation: Invitation
  chama: Chama & { memberCount: number }
  inviter: { id: string; full_name: string } | null
}

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const code = params.code as string
  const [data, setData] = useState<InviteData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/session')
        const result = await response.json()
        setIsLoggedIn(result.success && !!result.data?.user)
      } catch {
        setIsLoggedIn(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    async function fetchInvite() {
      try {
        const response = await fetch(`/api/chamas/join/${code}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Invalid or expired invitation')
        }

        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invitation')
      } finally {
        setIsLoading(false)
      }
    }

    if (code) {
      fetchInvite()
    }
  }, [code])

  const handleJoin = async () => {
    if (!isLoggedIn) {
      // Redirect to signup with invite code
      router.push(`/signup?invite=${code}`)
      return
    }

    setIsJoining(true)
    try {
      const response = await fetch(`/api/chamas/join/${code}`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to join chama')
      }

      addToast({
        variant: 'success',
        title: 'Welcome to the chama!',
        description: 'You have successfully joined.',
      })

      router.push(`/chamas/${result.data.chamaId}`)
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Failed to join',
        description: err instanceof Error ? err.message : 'Please try again',
      })
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto max-w-2xl py-12">
        <EmptyState
          title="Invalid Invitation"
          description={
            error ||
            'This invitation link is invalid or has expired. Please contact the chama admin for a new invitation.'
          }
        />
        <div className="mt-6 text-center">
          <Link href="/" className="text-primary hover:underline">
            Go to homepage
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">You&apos;ve been invited!</h1>
        <p className="text-muted-foreground mt-2">
          Join this chama to start managing your savings together
        </p>
      </div>

      <InvitePreview
        chama={data.chama}
        inviter={data.inviter}
        onJoin={handleJoin}
        isJoining={isJoining}
        isLoggedIn={isLoggedIn}
      />

      {!isLoggedIn && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href={`/signin?invite=${code}`} className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      )}
    </div>
  )
}

