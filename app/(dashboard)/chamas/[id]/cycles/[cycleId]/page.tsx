'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PeriodTracker } from '@/components/cycle/period-tracker'
import { CycleSummary } from '@/components/cycle/cycle-summary'
import { MemberStatusTable } from '@/components/cycle/member-status-table'
import { PayoutRecipient } from '@/components/cycle/payout-recipient'
import { AdminControls } from '@/components/cycle/admin-controls'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Cycle, CycleMember } from '@/lib/types/cycle'
import type { Contribution, Payout } from '@/lib/types/contribution'

interface CycleDashboardData {
  cycle: Cycle
  members: (CycleMember & {
    user?: {
      id: string
      full_name: string
      phone_number: string
    }
  })[]
  contributions: Contribution[]
  payouts: Payout[]
  stats: {
    totalDue: number
    totalPaid: number
    collectionRate: number
    pendingCount: number
    paidCount: number
    overdueCount: number
  }
  currentPeriodPayout: Payout | null
  isAdmin: boolean
}

export default function CycleDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const chamaId = params.id as string
  const cycleId = params.cycleId as string

  const [data, setData] = useState<CycleDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCycleData = async () => {
    try {
      const response = await fetch(`/api/cycles/${cycleId}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch cycle')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cycle')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (cycleId) {
      fetchCycleData()
    }
  }, [cycleId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Cycle not found"
        description={error || 'The cycle you are looking for does not exist or you do not have access to it.'}
      />
    )
  }

  const { cycle, members, contributions, payouts, stats, currentPeriodPayout, isAdmin } = data

  // Map contributions and payouts to members
  const membersWithData = members.map((member) => {
    const memberContributions = contributions.filter(
      (c) => c.cycle_member_id === member.id
    )
    const memberPayout = payouts.find(
      (p) => p.cycle_member_id === member.id && p.period_number === cycle.current_period
    )

    return {
      ...member,
      contributions: memberContributions,
      payout: memberPayout || null,
    }
  })

  const currentPeriodRecipient = members.find(
    (m) => m.turn_order === cycle.current_period
  )

  const handleConfirmPayout = async (payoutId: string) => {
    // TODO: Implement payout confirmation
    console.log('Confirm payout:', payoutId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push(`/chamas/${chamaId}`)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chama
          </Button>
          <h1 className="text-3xl font-bold">{cycle.name}</h1>
          <p className="text-muted-foreground mt-1">
            {cycle.status === 'active'
              ? `Period ${cycle.current_period} of ${cycle.total_periods}`
              : cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <CycleSummary cycle={cycle} stats={stats} />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Period Tracker */}
        <div className="lg:col-span-2 space-y-6">
          <PeriodTracker cycle={cycle} />
          
          <MemberStatusTable
            cycle={cycle}
            members={membersWithData}
            isAdmin={isAdmin}
          />
        </div>

        {/* Right Column - Payout & Controls */}
        <div className="space-y-6">
          <PayoutRecipient
            payout={currentPeriodPayout}
            recipient={currentPeriodRecipient || null}
            isAdmin={isAdmin}
            onConfirmPayout={handleConfirmPayout}
          />

          {isAdmin && (
            <AdminControls cycle={cycle} onCycleUpdate={fetchCycleData} />
          )}
        </div>
      </div>
    </div>
  )
}

