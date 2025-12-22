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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Collected
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</p>
              <p className="text-xs text-muted-foreground">
                of {formatCurrency(stats.totalDue)} due
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Collection Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.collectionRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                {stats.paidCount} paid, {stats.pendingCount} pending
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Contribution Amount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{formatCurrency(cycle.contribution_amount)}</p>
              <p className="text-xs text-muted-foreground">
                Per member per period
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {daysUntilNext !== null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{daysUntilNext}</p>
                <p className="text-xs text-muted-foreground">
                  {daysUntilNext === 0 ? 'Due today' : `day${daysUntilNext !== 1 ? 's' : ''} until period ${cycle.current_period + 1}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

