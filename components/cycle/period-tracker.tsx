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
    <Card className="border-border/50 shadow-sm w-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Cycle Progress</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Period {currentPeriod} of {cycle.total_periods}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-hidden">
        {/* Progress Bar */}
        <div className="mb-4 sm:mb-5">
          <div className="flex justify-between text-xs md:text-sm text-muted-foreground mb-2">
            <span className="font-medium truncate">{Math.round(progress)}% Complete</span>
            <span className="truncate ml-2">{currentPeriod} / {cycle.total_periods} Periods</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 md:h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getPeriodColor(currentPeriod)}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Period Grid */}
        <div className="overflow-x-auto w-full">
          <div className={`grid gap-1.5 sm:gap-2 ${
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
                  relative flex flex-col items-center justify-center p-1.5 sm:p-2 md:p-3 rounded-lg border-2 transition-all min-w-0
                  ${status === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}
                  ${status === 'current' ? 'border-primary bg-primary/10 shadow-sm' : ''}
                  ${status === 'upcoming' ? 'border-muted bg-muted/50' : ''}
                  ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-md' : 'cursor-default'}
                `}
              >
                <div className="mb-0.5 sm:mb-1 shrink-0">{getPeriodIcon(period)}</div>
                <span className={`text-[10px] sm:text-xs font-semibold truncate ${
                  status === 'current' ? 'text-primary' : status === 'completed' ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
                }`}>
                  {period}
                </span>
                {status === 'current' && (
                  <Badge variant="info" className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] px-0.5 sm:px-1 py-0">
                    Current
                  </Badge>
                )}
              </button>
            )
          })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 sm:mt-5 flex flex-wrap gap-2 sm:gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            <span>Upcoming</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

