'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Plus, Eye, EyeOff, PiggyBank, Calendar, ArrowRight, TrendingUp, Users, DollarSign, Wallet, Sparkles, Activity, ChevronRight, Zap, Target, Gift } from 'lucide-react'
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
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/10 pb-20 md:pb-8">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Hero Header Section */}
        <div className="mb-6 sm:mb-8 px-3 sm:px-4 pt-4 sm:pt-6 md:px-0 md:pt-0">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-purple-500/5 border border-primary/10 shadow-xl shadow-primary/5 p-4 sm:p-6 md:p-8">
            {/* Decorative elements */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(var(--primary-rgb),0.15),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.1),transparent_50%)]" />
            </div>
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4 md:gap-5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/40 to-purple-500/30 blur-lg opacity-70" />
                  <div className="relative flex h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-xl sm:text-2xl md:text-3xl font-bold text-white shadow-xl shadow-primary/30">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-background/60 backdrop-blur-sm border border-border/50 text-[10px] sm:text-xs font-medium text-muted-foreground">
                      <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500" />
                      {greeting}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground tracking-tight truncate">
                    Hello, {userName}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block truncate">Welcome back to your dashboard</p>
                </div>
              </div>
              <Link
                href="/notifications"
                className="group relative shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-background/70 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:bg-background"
              >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 transition-transform group-hover:rotate-12" />
                <span className="absolute -right-0.5 sm:-right-1 -top-0.5 sm:-top-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[9px] sm:text-[10px] font-bold text-white shadow-lg shadow-amber-500/30 animate-pulse">
                  3
                </span>
              </Link>
            </div>
          </div>
        </div>

      {/* Overview Section */}
      <div className="mb-6 sm:mb-8 px-3 sm:px-4 md:px-0">
        <div className="mb-4 sm:mb-5 flex items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Overview</h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Your financial snapshot</p>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-border via-border/50 to-transparent ml-2 sm:ml-4" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
          {/* Active Chamas Card */}
          <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50 via-indigo-50/80 to-sky-50/50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-sky-950/20 p-2.5 sm:p-4 md:p-5 lg:p-6 shadow-lg shadow-blue-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:border-blue-300/50">
            <div className="absolute top-0 right-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="mb-2 sm:mb-3 md:mb-4 flex items-center justify-between">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
              </div>
              <p className="mb-0.5 sm:mb-1 md:mb-2 text-[9px] sm:text-[10px] md:text-xs font-semibold text-blue-700/70 dark:text-blue-400/70 uppercase tracking-wider">Active Chamas</p>
              <p className="mb-0.5 sm:mb-1 md:mb-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-900 dark:text-blue-100">{data.stats.activeChamas}</p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-blue-600/80 dark:text-blue-400/80">Groups you're in</p>
            </div>
          </div>

          {/* Total Contributed Card */}
          <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 via-green-50/80 to-teal-50/50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/20 p-2.5 sm:p-4 md:p-5 lg:p-6 shadow-lg shadow-emerald-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:border-emerald-300/50">
            <div className="absolute top-0 right-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="mb-2 sm:mb-3 md:mb-4 flex items-center justify-between">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
              </div>
              <p className="mb-0.5 sm:mb-1 md:mb-2 text-[9px] sm:text-[10px] md:text-xs font-semibold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-wider">Contributed</p>
              <p className="mb-0.5 sm:mb-1 md:mb-2 text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-emerald-900 dark:text-emerald-100 truncate">
                {formatCurrency(data.stats.totalContributions)}
              </p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-emerald-600/80 dark:text-emerald-400/80">All-time total</p>
            </div>
          </div>

          {/* Savings Balance Card */}
          <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-br from-purple-50 via-violet-50/80 to-fuchsia-50/50 dark:from-purple-950/40 dark:via-violet-950/30 dark:to-fuchsia-950/20 p-2.5 sm:p-4 md:p-5 lg:p-6 shadow-lg shadow-purple-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:border-purple-300/50">
            <div className="absolute top-0 right-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="mb-2 sm:mb-3 md:mb-4 flex items-center justify-between">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30">
                  <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
                <button
                  onClick={() => setShowSavings(!showSavings)}
                  className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-md sm:rounded-lg bg-background/70 backdrop-blur-sm border border-border/50 transition-all hover:bg-background hover:scale-110 hover:shadow-md"
                >
                  {showSavings ? (
                    <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <EyeOff className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <p className="mb-0.5 sm:mb-1 md:mb-2 text-[9px] sm:text-[10px] md:text-xs font-semibold text-purple-700/70 dark:text-purple-400/70 uppercase tracking-wider">Savings</p>
              <p className="mb-0.5 sm:mb-1 md:mb-2 text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-purple-900 dark:text-purple-100 truncate">
                {showSavings ? formatCurrency(data.stats.savingsBalance) : '••••••'}
              </p>
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-wrap">
                <p className="text-[9px] sm:text-[10px] md:text-xs text-purple-600/80 dark:text-purple-400/80">Your balance</p>
                {showSavings && (
                  <div className="flex items-center gap-0.5 sm:gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-1 sm:px-1.5 md:px-2 py-0.5 text-[8px] sm:text-[9px] md:text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    <TrendingUp className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3" />
                    <span>+12%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Payout Card */}
          <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50 via-orange-50/80 to-yellow-50/50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/20 p-2.5 sm:p-4 md:p-5 lg:p-6 shadow-lg shadow-amber-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:border-amber-300/50">
            <div className="absolute top-0 right-0 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="mb-2 sm:mb-3 md:mb-4 flex items-center justify-between">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
                  <Gift className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
                {data.stats.upcomingPayout && (
                  <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-[8px] sm:text-[9px] md:text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    <Zap className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                    Soon
                  </span>
                )}
              </div>
              <p className="mb-0.5 sm:mb-1 md:mb-2 text-[9px] sm:text-[10px] md:text-xs font-semibold text-amber-700/70 dark:text-amber-400/70 uppercase tracking-wider">Next Payout</p>
              <p className="mb-0.5 sm:mb-1 md:mb-2 text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-amber-900 dark:text-amber-100 truncate">
                {data.stats.upcomingPayout
                  ? formatCurrency(data.stats.upcomingPayout.amount)
                  : formatCurrency(0)}
              </p>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-amber-600/80 dark:text-amber-400/80 truncate">
                {data.stats.upcomingPayout
                  ? `From ${data.stats.upcomingPayout.chamaName}`
                  : 'No scheduled payouts'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contributions Section */}
      <div className="mb-6 sm:mb-8 px-3 sm:px-4 md:px-0">
        <div className="mb-4 sm:mb-5 flex items-center gap-2 sm:gap-3">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Contributions</h2>
              {data.pendingContributions && data.pendingContributions.length > 0 && (
                <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-[9px] sm:text-[10px] font-bold text-white shadow-lg shadow-purple-500/30">
                  {data.pendingContributions.length}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Pending payments due</p>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-border via-border/50 to-transparent" />
        </div>
        {data.pendingContributions && data.pendingContributions.length > 0 ? (
          <ContributionPaymentButtons
            contributions={data.pendingContributions}
            onUpdate={handleUpdate}
          />
        ) : (
          <div className="rounded-xl sm:rounded-2xl border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/30 via-muted/20 to-transparent p-6 sm:p-8 md:p-10 text-center">
            <div className="relative inline-flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mb-3 sm:mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-violet-500/10 rounded-xl sm:rounded-2xl blur-xl" />
              <div className="relative flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/20 border border-purple-200/50 dark:border-purple-800/30">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-500" />
              </div>
            </div>
            <p className="text-sm sm:text-base font-semibold text-foreground mb-1 sm:mb-2">
              All caught up!
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
              No pending contributions. When payments are due, they'll appear here.
            </p>
          </div>
        )}
      </div>

      {/* Active Chamas Section */}
      <div className="mb-4 sm:mb-6 px-3 sm:px-4 md:px-0">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">My Chamas</h2>
                <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[9px] sm:text-[10px] font-bold text-white shadow-lg shadow-blue-500/30 shrink-0">
                  {data.stats.activeChamas}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Groups you're part of</p>
            </div>
          </div>
          <Link
            href="/chamas/new"
            className="group relative shrink-0 flex items-center gap-1.5 sm:gap-2 overflow-hidden rounded-lg sm:rounded-xl bg-gradient-to-r from-primary to-purple-600 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            <Plus className="relative h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:rotate-90" />
            <span className="relative hidden xs:inline">New Chama</span>
            <span className="relative xs:hidden">New</span>
          </Link>
        </div>
      </div>

      {/* My Groups Section */}
      <div className="px-3 sm:px-4 md:px-0">
        <div className="mb-3 sm:mb-4 flex items-center justify-end">
          <Link
            href="/chamas"
            className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold text-muted-foreground transition-all hover:text-primary hover:bg-primary/5"
          >
            <span>View All</span>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <ChamaList chamas={data.chamas} />
      </div>
      </div>
    </div>
  )
}

