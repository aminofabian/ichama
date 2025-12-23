'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PeriodTracker } from '@/components/cycle/period-tracker'
import { CycleSummary } from '@/components/cycle/cycle-summary'
import { MemberStatusTable } from '@/components/cycle/member-status-table'
import { PayoutRecipient } from '@/components/cycle/payout-recipient'
import { AdminControls } from '@/components/cycle/admin-controls'
import { MyContributionCard } from '@/components/cycle/my-contribution-card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils/format'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import type { Cycle, CycleMember } from '@/lib/types/cycle'
import type { Contribution, Payout } from '@/lib/types/contribution'

interface CycleDashboardData {
  cycle: Cycle
  chama?: { chama_type: 'savings' | 'merry_go_round' | 'hybrid' } | null
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

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

  useEffect(() => {
    // Fetch current user ID
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.user?.id) {
          setCurrentUserId(data.data.user.id)
        }
      })
      .catch(() => {})
  }, [])

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

  const { cycle, chama, members, contributions, payouts, stats, currentPeriodPayout, isAdmin } = data

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

  // Get current user's cycle member data
  const currentUserCycleMember = currentUserId
    ? members.find((m) => m.user_id === currentUserId)
    : null

  // Get current user's contribution for the current period
  const currentUserContribution = currentUserId
    ? contributions.find(
        (c) => c.user_id === currentUserId && c.period_number === cycle.current_period
      )
    : null

  const handleConfirmPayout = async (payoutId: string) => {
    try {
      const response = await fetch(`/api/payouts/${payoutId}/send`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send payout')
      }

      // Refresh cycle data
      fetchCycleData()
    } catch (error) {
      console.error('Failed to send payout:', error)
    }
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
          
          {isAdmin ? (
            <MemberStatusTable
              cycle={cycle}
              chamaType={chama?.chama_type}
              members={membersWithData}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              onMemberAction={(memberId, action) => {
                if (action === 'refresh') {
                  fetchCycleData()
                }
              }}
            />
          ) : (
            // Member view: Show their contribution card and savings info
            <div className="space-y-6">
              {currentUserContribution && (
                <MyContributionCard
                  contribution={currentUserContribution}
                  onUpdate={fetchCycleData}
                />
              )}
              {cycle.savings_amount > 0 && currentUserCycleMember && (
                <Card>
                  <CardHeader>
                    <CardTitle>My Savings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Savings Amount</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-lg font-semibold">
                          {formatCurrency(
                            currentUserCycleMember.custom_savings_amount ?? cycle.savings_amount
                          )}
                        </p>
                        {currentUserCycleMember.custom_savings_amount !== null && (
                          <Badge variant="info" className="text-xs">
                            Custom
                          </Badge>
                        )}
                        {currentUserCycleMember.custom_savings_amount === null && (
                          <span className="text-xs text-muted-foreground">(Default)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-2 flex-1">
                        {currentUserCycleMember.hide_savings === 1 ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Label htmlFor="hide-savings-cycle" className="text-sm cursor-pointer">
                          Hide my savings amount from other members
                        </Label>
                      </div>
                      <Switch
                        id="hide-savings-cycle"
                        checked={currentUserCycleMember.hide_savings === 1}
                        onCheckedChange={async (checked) => {
                          if (!currentUserCycleMember) return
                          try {
                            const response = await fetch(
                              `/api/chamas/${chamaId}/cycles/${cycleId}/members/${currentUserCycleMember.id}/savings`,
                              {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ hide_savings: checked ? 1 : 0 }),
                              }
                            )
                            const result = await response.json()
                            if (response.ok && result.success) {
                              fetchCycleData()
                            }
                          } catch (error) {
                            console.error('Failed to update privacy:', error)
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
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

