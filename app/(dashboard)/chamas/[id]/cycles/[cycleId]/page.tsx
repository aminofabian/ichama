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
import { ArrowLeft, Eye, EyeOff, PiggyBank } from 'lucide-react'
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
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20 md:pb-8 overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-[#FFD700]/5 blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-[#F5E6D3]/10 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        <div className="mx-auto max-w-7xl w-full px-3 md:px-4">
          {/* Navigation */}
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push(`/chamas/${chamaId}`)}
              className="mb-2 -ml-2"
              size="sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </div>

          {/* Hero Section */}
          <div className="mb-4">
            <div className="relative overflow-hidden rounded-lg md:rounded-xl bg-gradient-to-br from-[#FFD700]/10 via-[#F5E6D3]/10 to-transparent border border-[#FFD700]/20 p-3 md:p-4">
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-sm md:text-base font-bold text-foreground mb-2 truncate capitalize">
                      {cycle.name}
                    </h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={cycle.status === 'active' ? 'success' : cycle.status === 'completed' ? 'info' : 'default'}
                        className="text-[10px] sm:text-xs px-2 py-0.5"
                      >
                        {cycle.status === 'active'
                          ? `Period ${cycle.current_period} of ${cycle.total_periods}`
                          : cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                      </Badge>
                      {cycle.status === 'active' && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          <span>Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Overview */}
          <div className="mb-4 px-3 md:px-0">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-[8px] md:text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                OVERVIEW
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-muted to-transparent" />
            </div>
            <CycleSummary cycle={cycle} stats={stats} />
          </div>

          {/* Main Content Layout */}
          <div className={`grid gap-4 w-full px-3 md:px-0 ${(chama?.chama_type === 'merry_go_round' || chama?.chama_type === 'hybrid') ? 'lg:grid-cols-12' : ''}`}>
            {/* Left Column - Primary Content */}
            <div className={`space-y-4 min-w-0 ${(chama?.chama_type === 'merry_go_round' || chama?.chama_type === 'hybrid') ? 'lg:col-span-8' : ''}`}>
              {/* Cycle Progress Section */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-[8px] md:text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    CYCLE PROGRESS
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-muted to-transparent" />
                </div>
                <PeriodTracker cycle={cycle} />
              </section>
            
              {/* Member/Admin Content Section */}
              <section>
                {isAdmin ? (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      <h2 className="text-[8px] md:text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        MEMBER STATUS
                      </h2>
                      <div className="h-px flex-1 bg-gradient-to-r from-muted to-transparent" />
                    </div>
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
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="mb-2 flex items-center gap-2">
                      <h2 className="text-[8px] md:text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        MY CONTRIBUTION
                      </h2>
                      <div className="h-px flex-1 bg-gradient-to-r from-muted to-transparent" />
                    </div>
                    {currentUserContribution && (
                      <MyContributionCard
                        contribution={currentUserContribution}
                        onUpdate={fetchCycleData}
                      />
                    )}
                    {cycle.savings_amount > 0 && currentUserCycleMember && (
                      <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <PiggyBank className="h-5 w-5 text-[#FFC700]" />
                            <CardTitle className="text-base sm:text-lg">My Savings</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-lg border border-border/50 bg-gradient-to-br from-purple-50/50 to-purple-50/30 dark:from-purple-950/20 dark:to-purple-950/10 p-3 sm:p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Savings Amount</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-lg sm:text-xl font-bold">
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
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 sm:p-4">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {currentUserCycleMember.hide_savings === 1 ? (
                                <EyeOff className="h-4 w-4 shrink-0 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                              <Label htmlFor="hide-savings-cycle" className="text-xs sm:text-sm cursor-pointer">
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
              </section>

              {/* Admin Controls Section */}
              {isAdmin && (
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <h2 className="text-[8px] md:text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      CYCLE CONTROLS
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-muted to-transparent" />
                  </div>
                  <AdminControls cycle={cycle} onCycleUpdate={fetchCycleData} />
                </section>
              )}
            </div>

            {/* Right Sidebar - Secondary Information */}
            {(chama?.chama_type === 'merry_go_round' || chama?.chama_type === 'hybrid') && (
              <div className="lg:col-span-4 space-y-4 min-w-0">
                {/* Payout Recipient Card */}
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <h2 className="text-[8px] md:text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      CURRENT PAYOUT
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-muted to-transparent" />
                  </div>
                  <PayoutRecipient
                    payout={currentPeriodPayout}
                    recipient={currentPeriodRecipient || null}
                    isAdmin={isAdmin}
                    onConfirmPayout={handleConfirmPayout}
                  />
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

