'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Plus, Eye, EyeOff, PiggyBank, Calendar, ArrowRight, TrendingUp, Users, DollarSign, Wallet } from 'lucide-react'
import { ChamaList } from '@/components/dashboard/chama-list'
import { ContributionPaymentButtons } from '@/components/dashboard/contribution-payment-buttons'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
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

interface DashboardData {
  chamas: ChamaWithMember[]
  pendingContributions?: PendingContribution[]
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
    <div className="relative min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-20 md:pb-8">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-[#FFD700]/5 blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between px-4 pt-6 md:px-0 md:pt-0">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD700]/30 to-primary/20 blur-md" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 text-xl font-bold text-primary shadow-lg backdrop-blur-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
                Hello, {userName}
              </h1>
              <p className="text-sm font-medium text-muted-foreground">{greeting}</p>
            </div>
          </div>
          <Link
            href="/notifications"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-md transition-all hover:scale-110 hover:shadow-lg"
          >
            <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FFD700] text-[10px] font-bold text-foreground">
              3
            </span>
          </Link>
        </div>

      {/* Overview Section */}
      <div className="mb-8 px-4 md:px-0">
        <div className="mb-5 flex items-center gap-2">
          <h2 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Overview
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-muted to-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          {/* Active Chamas Card */}
          <div className="group relative overflow-hidden rounded-xl md:rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-2.5 md:p-5 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-blue-950/30 dark:to-blue-900/20">
            <div className="absolute -right-2 -top-2 md:-right-4 md:-top-4 h-10 w-10 md:h-20 md:w-20 rounded-full bg-blue-400/20 blur-2xl" />
            <div className="relative">
              <div className="mb-2 md:mb-4 flex items-center justify-between">
                <div className="flex h-6 w-6 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Users className="h-3 w-3 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <p className="mb-1 md:mb-2 text-[10px] md:text-xs font-medium text-muted-foreground">Active Chamas</p>
              <p className="mb-1 md:mb-2 text-xl md:text-3xl font-bold text-foreground">{data.stats.activeChamas}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">Chamas you belong to</p>
            </div>
          </div>

          {/* Total Contributed Card */}
          <div className="group relative overflow-hidden rounded-xl md:rounded-3xl bg-gradient-to-br from-green-50 to-emerald-100/50 p-2.5 md:p-5 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-green-950/30 dark:to-emerald-900/20">
            <div className="absolute -right-2 -top-2 md:-right-4 md:-top-4 h-10 w-10 md:h-20 md:w-20 rounded-full bg-green-400/20 blur-2xl" />
            <div className="relative">
              <div className="mb-2 md:mb-4 flex items-center justify-between">
                <div className="flex h-6 w-6 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <DollarSign className="h-3 w-3 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <p className="mb-1 md:mb-2 text-[10px] md:text-xs font-medium text-muted-foreground">Total Contributed</p>
              <p className="mb-1 md:mb-2 text-lg md:text-2xl font-bold text-foreground">
                {formatCurrency(data.stats.totalContributions)}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">All-time contributions</p>
            </div>
          </div>

          {/* Savings Balance Card */}
          <div className="group relative overflow-hidden rounded-xl md:rounded-3xl bg-gradient-to-br from-purple-50 to-purple-100/50 p-2.5 md:p-5 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-purple-950/30 dark:to-purple-900/20">
            <div className="absolute -right-2 -top-2 md:-right-4 md:-top-4 h-10 w-10 md:h-20 md:w-20 rounded-full bg-purple-400/20 blur-2xl" />
            <div className="relative">
              <div className="mb-2 md:mb-4 flex items-center justify-between">
                <div className="flex h-6 w-6 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                  <PiggyBank className="h-3 w-3 md:h-6 md:w-6 text-white" />
                </div>
                <button
                  onClick={() => setShowSavings(!showSavings)}
                  className="flex h-4 w-4 md:h-8 md:w-8 items-center justify-center rounded-md md:rounded-lg bg-background/50 backdrop-blur-sm transition-all hover:bg-background hover:scale-110"
                >
                  {showSavings ? (
                    <Eye className="h-2.5 w-2.5 md:h-4 md:w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-2.5 w-2.5 md:h-4 md:w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="mb-1 md:mb-2 text-[10px] md:text-xs font-medium text-muted-foreground">Savings Balance</p>
              <p className="mb-1 md:mb-2 text-lg md:text-2xl font-bold text-foreground">
                {showSavings ? formatCurrency(data.stats.savingsBalance) : '••••••'}
              </p>
              <div className="flex items-center gap-1 md:gap-2">
                <p className="text-[10px] md:text-xs text-muted-foreground">Your savings account</p>
                {showSavings && (
                  <div className="flex items-center gap-0.5 md:gap-1 rounded-full bg-green-100 px-1 md:px-2 py-0 md:py-0.5 text-[8px] md:text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <TrendingUp className="h-2 w-2 md:h-3 md:w-3" />
                    <span>+12%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Payout Card */}
          <div className="group relative overflow-hidden rounded-xl md:rounded-3xl bg-gradient-to-br from-orange-50 to-amber-100/50 p-2.5 md:p-5 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-orange-950/30 dark:to-amber-900/20">
            <div className="absolute -right-2 -top-2 md:-right-4 md:-top-4 h-10 w-10 md:h-20 md:w-20 rounded-full bg-orange-400/20 blur-2xl" />
            <div className="relative">
              <div className="mb-2 md:mb-4 flex items-center justify-between">
                <div className="flex h-6 w-6 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg">
                  <Calendar className="h-3 w-3 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <p className="mb-1 md:mb-2 text-[10px] md:text-xs font-medium text-muted-foreground">Upcoming Payout</p>
              <p className="mb-1 md:mb-2 text-lg md:text-2xl font-bold text-foreground">
                {data.stats.upcomingPayout
                  ? formatCurrency(data.stats.upcomingPayout.amount)
                  : formatCurrency(0)}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {data.stats.upcomingPayout
                  ? `From ${data.stats.upcomingPayout.chamaName}`
                  : 'No scheduled payouts'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contributions Section */}
      <div className="mb-8 px-4 md:px-0">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg blur-sm opacity-50" />
              <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200/30 dark:border-purple-800/30">
                <Wallet className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Contributions
                </span>
                {data.pendingContributions && data.pendingContributions.length > 0 && (
                  <div className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 dark:bg-purple-500">
                    <span className="text-[9px] font-bold text-white">{data.pendingContributions.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {data.pendingContributions && data.pendingContributions.length > 0 ? (
          <ContributionPaymentButtons
            contributions={data.pendingContributions}
            onUpdate={handleUpdate}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-muted-foreground/20 bg-gradient-to-br from-muted/40 to-muted/20 p-8 text-center backdrop-blur-sm">
            <div className="relative inline-block mb-3">
              <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-xl" />
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
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg blur-sm opacity-50" />
              <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200/30 dark:border-blue-800/30">
                <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Active Chamas
                </span>
                <div className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500">
                  <span className="text-[9px] font-bold text-white">{data.stats.activeChamas}</span>
                </div>
            </div>
            </div>
          </div>
          <Link
            href="/chamas/new"
            className="group relative flex items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-primary via-primary/95 to-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
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
            className="group flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-all hover:gap-2 hover:text-primary"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <ChamaList chamas={data.chamas} />
      </div>
      </div>
    </div>
  )
}

