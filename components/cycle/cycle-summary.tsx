'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'
import { TrendingUp, Users, Calendar, Target } from 'lucide-react'
import type { Cycle } from '@/lib/types/cycle'

interface CycleSummaryProps {
  cycle: Cycle
  stats: {
    totalDue: number
    totalPaid: number
    collectionRate: number
    pendingCount: number
    paidCount: number
    overdueCount: number
  }
}

export function CycleSummary({ cycle, stats }: CycleSummaryProps) {
  // Calculate days until next period
  const getDaysUntilNextPeriod = () => {
    if (cycle.status !== 'active' || cycle.current_period >= cycle.total_periods) {
      return null
    }

    const startDate = new Date(cycle.start_date!)
    let daysToAdd = 0

    switch (cycle.frequency) {
      case 'weekly':
        daysToAdd = 7 * cycle.current_period
        break
      case 'biweekly':
        daysToAdd = 14 * cycle.current_period
        break
      case 'monthly':
        daysToAdd = 30 * cycle.current_period
        break
    }

    const nextPeriodDate = new Date(startDate)
    nextPeriodDate.setDate(nextPeriodDate.getDate() + daysToAdd)

    const now = new Date()
    const diffTime = nextPeriodDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
  }

  const daysUntilNext = getDaysUntilNextPeriod()

  return (
    <div className="grid grid-cols-2 gap-4 md:gap-5 md:grid-cols-4 w-full">
      {/* Total Collected Card */}
      <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 via-green-50/80 to-teal-50/50 dark:from-emerald-950/40 dark:via-green-950/30 dark:to-teal-950/20 p-4 md:p-5 shadow-lg shadow-emerald-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5 hover:border-emerald-300/50">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
          <p className="mb-1.5 text-[11px] md:text-xs font-semibold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-wider">Total Collected</p>
          <p className="mb-1 text-xl md:text-2xl font-bold text-emerald-900 dark:text-emerald-100 truncate">{formatCurrency(stats.totalPaid)}</p>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 flex-1 rounded-full bg-emerald-200 dark:bg-emerald-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500" style={{ width: `${Math.min((stats.totalPaid / stats.totalDue) * 100, 100)}%` }} />
            </div>
            <span className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">of {formatCurrency(stats.totalDue)}</span>
          </div>
        </div>
      </div>

      {/* Collection Rate Card */}
      <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50 via-indigo-50/80 to-sky-50/50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-sky-950/20 p-4 md:p-5 shadow-lg shadow-blue-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5 hover:border-blue-300/50">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
              <Target className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
          <p className="mb-1.5 text-[11px] md:text-xs font-semibold text-blue-700/70 dark:text-blue-400/70 uppercase tracking-wider">Collection Rate</p>
          <p className="mb-1 text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-100 truncate">{stats.collectionRate.toFixed(1)}%</p>
          <p className="text-[10px] md:text-xs text-blue-600/80 dark:text-blue-400/80">
            <span className="font-semibold">{stats.paidCount}</span> paid · <span className="font-semibold">{stats.pendingCount}</span> pending
          </p>
        </div>
      </div>

      {/* Contribution Amount Card */}
      <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-br from-purple-50 via-violet-50/80 to-fuchsia-50/50 dark:from-purple-950/40 dark:via-violet-950/30 dark:to-fuchsia-950/20 p-4 md:p-5 shadow-lg shadow-purple-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-0.5 hover:border-purple-300/50">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
          <p className="mb-1.5 text-[11px] md:text-xs font-semibold text-purple-700/70 dark:text-purple-400/70 uppercase tracking-wider">Contribution</p>
          <p className="mb-1 text-xl md:text-2xl font-bold text-purple-900 dark:text-purple-100 truncate">{formatCurrency(cycle.contribution_amount)}</p>
          <p className="text-[10px] md:text-xs text-purple-600/80 dark:text-purple-400/80">Per member / period</p>
        </div>
      </div>

      {/* Next Period Card */}
      {daysUntilNext !== null ? (
        <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-amber-50 via-orange-50/80 to-yellow-50/50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/20 p-4 md:p-5 shadow-lg shadow-amber-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-0.5 hover:border-amber-300/50">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
                <Calendar className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            <p className="mb-1.5 text-[11px] md:text-xs font-semibold text-amber-700/70 dark:text-amber-400/70 uppercase tracking-wider">Next Period</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl md:text-2xl font-bold text-amber-900 dark:text-amber-100">{daysUntilNext}</p>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">day{daysUntilNext !== 1 ? 's' : ''}</span>
            </div>
            <p className="text-[10px] md:text-xs text-amber-600/80 dark:text-amber-400/80">
              {daysUntilNext === 0 ? 'Due today!' : `Until period ${cycle.current_period + 1}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="group relative overflow-hidden rounded-2xl md:rounded-3xl border border-gray-200/50 dark:border-gray-800/30 bg-gradient-to-br from-gray-50 to-slate-50/50 dark:from-gray-950/40 dark:to-slate-950/20 p-4 md:p-5 shadow-lg shadow-gray-500/5">
          <div className="relative flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg shadow-gray-500/20 mb-3">
              <Calendar className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs text-muted-foreground">Cycle Complete</p>
          </div>
        </div>
      )}
    </div>
  )
}

