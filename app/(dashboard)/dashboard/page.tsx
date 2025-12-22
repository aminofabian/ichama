'use client'

import { useEffect, useState } from 'react'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { ChamaList } from '@/components/dashboard/chama-list'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import type { ChamaWithMember } from '@/lib/db/queries/chamas'

interface DashboardData {
  chamas: ChamaWithMember[]
  stats: {
    activeChamas: number
    totalContributions: number
    savingsBalance: number
    upcomingPayout: {
      amount: number
      scheduledDate: string
      chamaName: string
    } | null
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/user/dashboard')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch dashboard data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your chamas.
        </p>
      </div>

      <SummaryCards
        activeChamas={data.stats.activeChamas}
        totalContributions={data.stats.totalContributions}
        savingsBalance={data.stats.savingsBalance}
        upcomingPayout={data.stats.upcomingPayout}
      />

      <div>
        <h2 className="mb-4 text-2xl font-semibold">Your Chamas</h2>
        <ChamaList chamas={data.chamas} />
      </div>
    </div>
  )
}

