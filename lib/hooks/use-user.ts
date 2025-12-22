'use client'

import { useState, useEffect } from 'react'
import type { User } from '../types/user'

interface UseUserReturn {
  user: User | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/auth/session')
      if (!response.ok) {
        throw new Error('Not authenticated')
      }
      const data = await response.json()
      if (data.success && data.data?.user) {
        setUser(data.data.user as User)
      } else {
        setUser(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return { user, loading, error, refetch: fetchUser }
}

