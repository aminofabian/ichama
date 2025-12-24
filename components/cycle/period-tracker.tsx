'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Circle } from 'lucide-react'
import type { Cycle } from '@/lib/types/cycle'

interface PeriodTrackerProps {
  cycle: Cycle
  onPeriodClick?: (period: number) => void
}

export function PeriodTracker({ cycle, onPeriodClick }: PeriodTrackerProps) {
  const periods = Array.from({ length: cycle.total_periods }, (_, i) => i + 1)
  const currentPeriod = cycle.current_period
  const isActive = cycle.status === 'active'
  const isCompleted = cycle.status === 'completed'

  const getPeriodStatus = (period: number) => {
    if (period < currentPeriod) return 'completed'
    if (period === currentPeriod && isActive) return 'current'
    return 'upcoming'
  }

  const getPeriodIcon = (period: number) => {
    const status = getPeriodStatus(period)
    if (status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    }
    if (status === 'current') {
      return <Clock className="h-5 w-5 text-primary" />
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />
  }

  const getPeriodColor = (period: number) => {
    const status = getPeriodStatus(period)
    if (status === 'completed') {
      return 'bg-green-500'
    }
    if (status === 'current') {
      return 'bg-primary'
    }
    return 'bg-muted'
  }

  const progress = cycle.total_periods > 0 ? (currentPeriod / cycle.total_periods) * 100 : 0

  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300 w-full overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl font-bold">Cycle Progress</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Period {currentPeriod} of {cycle.total_periods}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-lg font-bold text-primary">{Math.round(progress)}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden relative">
        {/* Progress Bar */}
        <div className="mb-5 sm:mb-6">
          <div className="flex justify-between text-xs md:text-sm text-muted-foreground mb-3">
            <span className="font-medium">Progress</span>
            <span className="font-semibold text-foreground">{currentPeriod} / {cycle.total_periods} Periods</span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-3 md:h-4 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-primary via-primary to-purple-500 rounded-full transition-all duration-500 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>
        </div>

        {/* Period Grid */}
        <div className="overflow-x-auto w-full pb-2">
          <div className={`grid gap-2 sm:gap-3 ${
            cycle.total_periods <= 10 
              ? 'grid-cols-5 md:grid-cols-10 w-full' 
              : 'grid-cols-5 md:grid-cols-10 min-w-max'
          }`}>
          {periods.map((period) => {
            const status = getPeriodStatus(period)
            const isClickable = onPeriodClick && (status === 'completed' || status === 'current')

            return (
              <button
                key={period}
                onClick={() => isClickable && onPeriodClick(period)}
                disabled={!isClickable}
                className={`
                  group relative flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 rounded-xl border-2 transition-all duration-200 min-w-0
                  ${status === 'completed' ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/30 shadow-sm shadow-emerald-500/10' : ''}
                  ${status === 'current' ? 'border-primary bg-gradient-to-br from-primary/15 to-purple-500/10 shadow-md shadow-primary/20 ring-2 ring-primary/20' : ''}
                  ${status === 'upcoming' ? 'border-border/50 bg-muted/30 hover:bg-muted/50' : ''}
                  ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'cursor-default'}
                `}
              >
                {status === 'current' && (
                  <div className="absolute -top-1 -right-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                    </span>
                  </div>
                )}
                <div className="mb-1 shrink-0 transform group-hover:scale-110 transition-transform">{getPeriodIcon(period)}</div>
                <span className={`text-xs sm:text-sm font-bold ${
                  status === 'current' ? 'text-primary' : status === 'completed' ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                }`}>
                  {period}
                </span>
                {status === 'current' && (
                  <Badge variant="info" className="mt-1 text-[9px] sm:text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground">
                    Now
                  </Badge>
                )}
              </button>
            )
          })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-5 sm:mt-6 pt-4 border-t border-border/50 flex flex-wrap gap-4 sm:gap-6 text-xs md:text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-medium text-emerald-700 dark:text-emerald-400">Completed</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-medium text-primary">Current</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
            <Circle className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground">Upcoming</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

