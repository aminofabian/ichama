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
  contributionCount?: number // Number of contributions to calculate total service fees
  isAdmin?: boolean
}

export function CycleSummary({ cycle, stats, contributionCount = 0, isAdmin = false }: CycleSummaryProps) {
  // Calculate amounts after subtracting service fees
  const serviceFee = cycle.service_fee || 0
  const totalServiceFees = serviceFee * contributionCount
  const totalPaidAfterFees = Math.max(0, stats.totalPaid - totalServiceFees)
  const totalDueAfterFees = Math.max(0, stats.totalDue - totalServiceFees)
  const contributionAfterFee = Math.max(0, cycle.contribution_amount - serviceFee)

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
    <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-4 w-full">
      <div className="group relative overflow-hidden rounded-xl md:rounded-2xl border border-border/50 bg-gradient-to-br from-green-50/50 to-emerald-50/30 p-3 md:p-4 shadow-sm transition-all duration-200 hover:border-green-200 hover:shadow-md dark:from-green-950/20 dark:to-emerald-950/10">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-green-500/10">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
          </div>
        </div>
        <p className="mb-1 text-[10px] md:text-xs font-medium text-muted-foreground truncate">Total Collected</p>
        <p className="mb-1 text-lg md:text-xl font-bold text-foreground truncate">{formatCurrency(totalPaidAfterFees)}</p>
        <div className="text-[10px] md:text-xs text-muted-foreground space-y-0.5">
          <p className="truncate">of {formatCurrency(totalDueAfterFees)} due</p>
          {isAdmin && totalServiceFees > 0 && (
            <p className="truncate text-emerald-600 dark:text-emerald-400">
              + {formatCurrency(totalServiceFees)} service fee
            </p>
          )}
        </div>
            </div>

      <div className="group relative overflow-hidden rounded-xl md:rounded-2xl border border-border/50 bg-gradient-to-br from-blue-50/50 to-blue-50/30 p-3 md:p-4 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md dark:from-blue-950/20 dark:to-blue-950/10">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Target className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          </div>
        </div>
        <p className="mb-1 text-[10px] md:text-xs font-medium text-muted-foreground truncate">Collection Rate</p>
        <p className="mb-1 text-lg md:text-xl font-bold text-foreground truncate">{stats.collectionRate.toFixed(1)}%</p>
        <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                {stats.paidCount} paid, {stats.pendingCount} pending
              </p>
            </div>

      <div className="group relative overflow-hidden rounded-xl md:rounded-2xl border border-border/50 bg-gradient-to-br from-purple-50/50 to-purple-50/30 p-3 md:p-4 shadow-sm transition-all duration-200 hover:border-purple-200 hover:shadow-md dark:from-purple-950/20 dark:to-purple-950/10">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-purple-500/10">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
          </div>
        </div>
        <p className="mb-1 text-[10px] md:text-xs font-medium text-muted-foreground truncate">Contribution Amount</p>
        <p className="mb-1 text-lg md:text-xl font-bold text-foreground truncate">{formatCurrency(contributionAfterFee)}</p>
        <p className="text-[10px] md:text-xs text-muted-foreground truncate">Per member per period</p>
      </div>

      {daysUntilNext !== null ? (
        <div className="group relative overflow-hidden rounded-xl md:rounded-2xl border border-border/50 bg-gradient-to-br from-orange-50/50 to-amber-50/30 p-3 md:p-4 shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md dark:from-orange-950/20 dark:to-amber-950/10">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
            </div>
          </div>
          <p className="mb-1 text-[10px] md:text-xs font-medium text-muted-foreground truncate">Next Period</p>
          <p className="mb-1 text-lg md:text-xl font-bold text-foreground truncate">{daysUntilNext}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">
                  {daysUntilNext === 0 ? 'Due today' : `day${daysUntilNext !== 1 ? 's' : ''} until period ${cycle.current_period + 1}`}
                </p>
              </div>
      ) : (
        <div className="rounded-xl md:rounded-2xl border border-transparent" />
      )}
    </div>
  )
}

