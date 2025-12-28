'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Plus, Eye, EyeOff, PiggyBank, Calendar, ArrowRight, TrendingUp, Users, DollarSign, HandCoins } from 'lucide-react'
import { ChamaList } from '@/components/dashboard/chama-list'
import { ContributionPaymentButtons } from '@/components/dashboard/contribution-payment-buttons'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { LoanFormDrawer } from '@/components/loan/loan-form-drawer'
import { formatCurrency } from '@/lib/utils/format'
import type { ChamaWithMember } from '@/lib/db/queries/chamas'
import type { User } from '@/lib/types/user'

interface PendingContribution {
  id: string
  cycle_id: string
  cycle_member_id: string
  chama_id: string
  chama_name: string
  cycle_name: string
  period_number: number
  amount_due: number
  amount_paid: number
  due_date: string
  status: string
  contribution_amount: number
  savings_amount: number
  chama_type: 'savings' | 'merry_go_round' | 'hybrid'
  custom_savings_amount: number | null
}

interface ChamaStat {
  chamaId: string
  chamaName: string
  chamaType: 'savings' | 'merry_go_round' | 'hybrid'
  contributionPaid: number
  savingsPaid: number
  totalPaid: number
  actualSavings: number
}

interface UnconfirmedContribution {
  id: string
  cycle_id: string
  cycle_member_id: string
  user_id: string
  period_number: number
  amount_due: number
  amount_paid: number
  due_date: string
  status: string
  paid_at: string
  cycle_name: string
  contribution_amount: number
  savings_amount: number
  chama_id: string
  chama_name: string
  chama_type: 'savings' | 'merry_go_round' | 'hybrid'
  custom_savings_amount: number | null
}

interface DashboardData {
  chamas: ChamaWithMember[]
  pendingContributions?: PendingContribution[]
  unconfirmedContributions?: Record<string, UnconfirmedContribution[]>
  chamaStats?: ChamaStat[]
  stats: {
    activeChamas: number
    totalReceived: number
    savingsBalance: number
    upcomingPayout: {
      amount: number
      scheduledDate: string
      chamaName: string
    } | null
  }
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function getDaysUntil(dateString: string): number {
  const dueDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSavings, setShowSavings] = useState(true)
  const [loanDrawerOpen, setLoanDrawerOpen] = useState(false)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const [dashboardResponse, userResponse] = await Promise.all([
          fetch('/api/user/dashboard'),
          fetch('/api/user/me'),
        ])

        if (!dashboardResponse.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const dashboardResult = await dashboardResponse.json()
        if (dashboardResult.success) {
          setData(dashboardResult.data)
        } else {
          throw new Error(dashboardResult.error || 'Failed to fetch dashboard data')
        }

        if (userResponse.ok) {
          const userResult = await userResponse.json()
          if (userResult.success) {
            setUser(userResult.data)
          }
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

  const handleUpdate = () => {
    window.location.reload()
  }

  const userName = user?.full_name?.split(' ')[0] || 'User'
  const greeting = getGreeting()

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20 md:pb-8">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-[#FFD700]/5 blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-[#F5E6D3]/10 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between px-4 pt-6 md:px-0 md:pt-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#F5E6D3]/20" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#F5E6D3]/30 text-base font-bold text-[#FFC700] shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-sm font-semibold tracking-tight text-transparent">
                Hello, {userName}
              </h1>
              <p className="text-xs font-medium text-muted-foreground">{greeting}</p>
            </div>
          </div>
          <Link
            href="/notifications"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-md transition-all hover:scale-110 hover:shadow-lg"
          >
            <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FFD700] text-[10px] font-bold text-white">
              3
            </span>
          </Link>
        </div>

      {/* Overview Section */}
      <div className="mb-8 px-4 md:px-0">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[8px] md:text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            OVERVIEW
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-muted to-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
          {/* Active Chamas Card */}
          <div className="group relative overflow-hidden rounded-lg md:rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-1.5 md:p-2.5 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg dark:from-blue-950/30 dark:to-blue-900/20">
            <div className="absolute -right-1 -top-1 md:-right-2 md:-top-2 h-6 w-6 md:h-10 md:w-10 rounded-full bg-blue-400/20 blur-xl" />
            <div className="relative">
              <div className="mb-1 md:mb-2 flex items-center justify-between">
                <div className="flex h-4 w-4 md:h-6 md:w-6 items-center justify-center rounded-md md:rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                  <Users className="h-2.5 w-2.5 md:h-4 md:w-4 text-white" />
                </div>
              </div>
              <p className="mb-0.5 md:mb-1 text-[9px] md:text-[10px] font-medium text-muted-foreground">Active Chamas</p>
              <p className="text-base md:text-xl font-bold text-foreground">{data.stats.activeChamas}</p>
            </div>
          </div>

          {/* Total Received Card */}
          <div className="group relative overflow-hidden rounded-lg md:rounded-xl bg-gradient-to-br from-green-50 to-emerald-100/50 p-1.5 md:p-2.5 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg dark:from-green-950/30 dark:to-emerald-900/20">
            <div className="absolute -right-1 -top-1 md:-right-2 md:-top-2 h-6 w-6 md:h-10 md:w-10 rounded-full bg-green-400/20 blur-xl" />
            <div className="relative">
              <div className="mb-1 md:mb-2 flex items-center justify-between">
                <div className="flex h-4 w-4 md:h-6 md:w-6 items-center justify-center rounded-md md:rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-md">
                  <DollarSign className="h-2.5 w-2.5 md:h-4 md:w-4 text-white" />
                </div>
              </div>
              <p className="mb-0.5 md:mb-1 text-[9px] md:text-[10px] font-medium text-muted-foreground">Total Received</p>
              <p className="text-sm md:text-lg font-bold text-foreground">
                {formatCurrency(data.stats.totalReceived || 0)}
              </p>
            </div>
          </div>

          {/* Savings Balance Card */}
          <div className="group relative overflow-hidden rounded-lg md:rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 p-1.5 md:p-2.5 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg dark:from-purple-950/30 dark:to-purple-900/20">
            <div className="absolute -right-1 -top-1 md:-right-2 md:-top-2 h-6 w-6 md:h-10 md:w-10 rounded-full bg-purple-400/20 blur-xl" />
            <div className="relative">
              <div className="mb-1 md:mb-2 flex items-center justify-between">
                <div className="flex h-4 w-4 md:h-6 md:w-6 items-center justify-center rounded-md md:rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
                  <PiggyBank className="h-2.5 w-2.5 md:h-4 md:w-4 text-white" />
                </div>
                <button
                  onClick={() => setShowSavings(!showSavings)}
                  className="flex h-3 w-3 md:h-5 md:w-5 items-center justify-center rounded-sm md:rounded-md bg-background/50 backdrop-blur-sm transition-all hover:bg-background hover:scale-110"
                >
                  {showSavings ? (
                    <Eye className="h-2 w-2 md:h-3 md:w-3 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-2 w-2 md:h-3 md:w-3 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="mb-0.5 md:mb-1 text-[9px] md:text-[10px] font-medium text-muted-foreground">Savings Balance</p>
              <div className="flex items-center gap-1.5">
                <p className="text-sm md:text-lg font-bold text-foreground">
                  {showSavings ? formatCurrency(data.stats.savingsBalance) : '••••••'}
                </p>
                {showSavings && (
                  <div className="flex items-center gap-0.5 rounded-full bg-green-100 px-0.5 md:px-1 py-0 text-[7px] md:text-[9px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <TrendingUp className="h-1.5 w-1.5 md:h-2 md:w-2" />
                    <span>+12%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Payout Card */}
          <div className="group relative overflow-hidden rounded-lg md:rounded-xl bg-gradient-to-br from-orange-50 to-amber-100/50 p-1.5 md:p-2.5 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg dark:from-orange-950/30 dark:to-amber-900/20">
            <div className="absolute -right-1 -top-1 md:-right-2 md:-top-2 h-6 w-6 md:h-10 md:w-10 rounded-full bg-orange-400/20 blur-xl" />
            <div className="relative">
              <div className="mb-1 md:mb-2 flex items-center justify-between">
                <div className="flex h-4 w-4 md:h-6 md:w-6 items-center justify-center rounded-md md:rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 shadow-md">
                  <Calendar className="h-2.5 w-2.5 md:h-4 md:w-4 text-white" />
                </div>
              </div>
              <p className="mb-0.5 md:mb-1 text-[9px] md:text-[10px] font-medium text-muted-foreground">Upcoming Payout</p>
              <p className="text-sm md:text-lg font-bold text-foreground">
                {data.stats.upcomingPayout
                  ? formatCurrency(data.stats.upcomingPayout.amount)
                  : formatCurrency(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Request Section */}
      <div className="mb-6 px-4 md:px-0">
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                <HandCoins className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-semibold text-foreground">
                  Need a Loan?
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Request a loan based on your savings balance
                </p>
              </div>
            </div>
            <button
              onClick={() => setLoanDrawerOpen(true)}
              className="group relative flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              <HandCoins className="relative h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="relative">Request Loan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contributions Section */}
      <div className="mb-6 px-4 md:px-0">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[8px] md:text-[9px] font-semibold uppercase tracking-wider text-muted-foreground relative">
            CONTRIBUTIONS
            {data.pendingContributions && data.pendingContributions.length > 0 && (
              <sup className="ml-0.5 text-[6px] md:text-[7px] font-bold text-primary align-super">
                {data.pendingContributions.length}
              </sup>
            )}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-muted to-transparent" />
        </div>
        {data.pendingContributions && data.pendingContributions.length > 0 ? (
          <ContributionPaymentButtons
            contributions={data.pendingContributions}
            onUpdate={handleUpdate}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-gradient-to-br from-muted/40 to-muted/20 p-8 text-center">
            <div className="relative inline-block mb-3">
              <PiggyBank className="relative h-10 w-10 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              No pending contributions
            </p>
            <p className="text-xs text-muted-foreground">
              When you have contributions due, you'll see them here with options to pay and save.
            </p>
          </div>
        )}
      </div>

      {/* Active Chamas Section */}
      <div className="mb-8 px-4 md:px-0">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FFD700]/10 to-[#F5E6D3]/10 border border-[#FFD700]/30">
                <Users className="h-3.5 w-3.5 text-[#FFC700]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFC700]">
                Active Chamas
                </span>
                <div className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFD700]">
                  <span className="text-[9px] font-bold text-white">{data.stats.activeChamas}</span>
                </div>
            </div>
            </div>
          </div>
          <Link
            href="/chamas/new"
            className="group relative flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-[#FFD700] to-[#FFC700] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#FFD700]/25 transition-all hover:shadow-xl hover:shadow-[#FFD700]/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            <Plus className="relative h-4 w-4 transition-transform group-hover:rotate-90" />
            <span className="relative hidden sm:inline">New Chama</span>
            <span className="relative sm:hidden">New</span>
          </Link>
        </div>
      </div>

      {/* My Groups Section */}
      <div className="px-4 md:px-0">
        <div className="mb-5 flex items-center justify-end">
          <Link
            href="/chamas"
            className="group flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-all hover:gap-2 hover:text-[#FFD700]"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <ChamaList 
          chamas={data.chamas} 
          chamaStats={data.chamaStats}
          unconfirmedContributions={data.unconfirmedContributions}
        />
      </div>
      </div>

      <LoanFormDrawer
        open={loanDrawerOpen}
        onOpenChange={setLoanDrawerOpen}
        savingsBalance={data.stats.savingsBalance}
        chamas={data.chamas.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  )
}

