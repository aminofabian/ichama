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
import { ArrowLeft, Eye, EyeOff, TrendingUp, Users, Calendar, Target, Gift, Settings, BarChart3, PiggyBank, Sparkles, Activity, Wallet, ChevronRight, Clock } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 pb-20 md:pb-8 overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl w-full px-4 pt-4 sm:pt-6 md:px-6 md:pt-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/chamas/${chamaId}`)}
            className="group -ml-2 hover:bg-primary/5 transition-all duration-200"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Chama</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>

        {/* Hero Section - More Creative */}
        <div className="mb-8 sm:mb-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-purple-500/5 border border-primary/20 shadow-xl shadow-primary/5">
            {/* Animated mesh gradient background */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--primary-rgb),0.15),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.1),transparent_50%)]" />
            </div>
            
            <div className="relative z-10 p-6 sm:p-8 md:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  {/* Cycle Type Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 mb-4">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {cycle.frequency.charAt(0).toUpperCase() + cycle.frequency.slice(1)} Cycle
                    </span>
                  </div>
                  
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
                    {cycle.name}
                  </h1>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge
                      variant={cycle.status === 'active' ? 'success' : cycle.status === 'completed' ? 'info' : 'default'}
                      className="text-sm px-4 py-1.5 font-medium"
                    >
                      {cycle.status === 'active' && <Activity className="mr-1.5 h-3.5 w-3.5" />}
                      {cycle.status === 'active'
                        ? `Period ${cycle.current_period} of ${cycle.total_periods}`
                        : cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                    </Badge>
                    {cycle.status === 'active' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                        </span>
                        <span>Live</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Quick Info Pills */}
                <div className="flex flex-wrap lg:flex-col gap-2">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background/70 backdrop-blur-sm border border-border/50 shadow-sm">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{formatCurrency(cycle.contribution_amount)}</span>
                    <span className="text-xs text-muted-foreground">/period</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background/70 backdrop-blur-sm border border-border/50 shadow-sm">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-semibold">{members.length}</span>
                    <span className="text-xs text-muted-foreground">members</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative corner elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="mb-8 sm:mb-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Overview</h2>
              <p className="text-xs text-muted-foreground">Real-time cycle statistics</p>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-border via-border/50 to-transparent ml-4" />
          </div>
          <CycleSummary cycle={cycle} stats={stats} />
        </div>

        {/* Main Content Layout */}
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12 w-full">
          {/* Left Column - Primary Content */}
          <div className="lg:col-span-8 space-y-8 sm:space-y-10 min-w-0">
            {/* Cycle Progress Section */}
            <section className="group">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 group-hover:scale-105 transition-transform">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Cycle Progress</h2>
                  <p className="text-xs text-muted-foreground">Track period completion</p>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-border via-border/50 to-transparent ml-4" />
              </div>
              <PeriodTracker cycle={cycle} />
            </section>
          
            {/* Member/Admin Content Section */}
            <section className="group">
              {isAdmin ? (
                <>
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 group-hover:scale-105 transition-transform">
                      <Users className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground">Member Status</h2>
                      <p className="text-xs text-muted-foreground">Track member contributions</p>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-border via-border/50 to-transparent ml-4" />
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
                <div className="space-y-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                      <Target className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground">My Contribution</h2>
                      <p className="text-xs text-muted-foreground">Your current period status</p>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-border via-border/50 to-transparent ml-4" />
                  </div>
              {currentUserContribution && (
                <MyContributionCard
                  contribution={currentUserContribution}
                  onUpdate={fetchCycleData}
                />
              )}
                  {cycle.savings_amount > 0 && currentUserCycleMember && (
                    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                      <CardHeader className="pb-3 relative">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                            <PiggyBank className="h-5 w-5 text-purple-500" />
                          </div>
                          <CardTitle className="text-lg sm:text-xl">My Savings</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 relative">
                        <div className="rounded-2xl border border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20 p-4 sm:p-5">
                          <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wider">Savings Amount</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-300">
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
                              <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full">Default</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border/50 bg-muted/30 p-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted">
                              {currentUserCycleMember.hide_savings === 1 ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <Label htmlFor="hide-savings-cycle" className="text-sm cursor-pointer leading-tight">
                              Hide savings from other members
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
              <section className="group">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 group-hover:scale-105 transition-transform">
                    <Settings className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">Cycle Controls</h2>
                    <p className="text-xs text-muted-foreground">Manage cycle operations</p>
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-border via-border/50 to-transparent ml-4" />
                </div>
                <AdminControls cycle={cycle} onCycleUpdate={fetchCycleData} />
              </section>
            )}
          </div>

          {/* Right Sidebar - Secondary Information */}
          <div className="lg:col-span-4 space-y-8 min-w-0">
            {/* Payout Recipient Card */}
            <section className="group lg:sticky lg:top-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <Gift className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Current Payout</h2>
                  <p className="text-xs text-muted-foreground">Period recipient</p>
                </div>
              </div>
              <PayoutRecipient
                payout={currentPeriodPayout}
                recipient={currentPeriodRecipient || null}
                isAdmin={isAdmin}
                onConfirmPayout={handleConfirmPayout}
              />
              
              {/* Additional Quick Actions Card */}
              <Card className="mt-6 border-border/50 shadow-lg overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
                <CardHeader className="pb-3 relative">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Quick Info</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/30">
                    <span className="text-xs text-muted-foreground">Frequency</span>
                    <span className="text-sm font-semibold capitalize">{cycle.frequency}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/30">
                    <span className="text-xs text-muted-foreground">Total Periods</span>
                    <span className="text-sm font-semibold">{cycle.total_periods}</span>
                  </div>
                  {cycle.start_date && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/30">
                      <span className="text-xs text-muted-foreground">Started</span>
                      <span className="text-sm font-semibold">
                        {new Date(cycle.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {cycle.savings_amount > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/30 dark:border-purple-800/30">
                      <span className="text-xs text-purple-600 dark:text-purple-400">Savings/Period</span>
                      <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">{formatCurrency(cycle.savings_amount)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

