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
    <Card>
      <CardHeader>
        <CardTitle>Cycle Progress</CardTitle>
        <CardDescription>
          Period {currentPeriod} of {cycle.total_periods}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{Math.round(progress)}% Complete</span>
            <span>{currentPeriod} / {cycle.total_periods} Periods</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getPeriodColor(currentPeriod)}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Period Grid */}
        <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
          {periods.map((period) => {
            const status = getPeriodStatus(period)
            const isClickable = onPeriodClick && (status === 'completed' || status === 'current')

            return (
              <button
                key={period}
                onClick={() => isClickable && onPeriodClick(period)}
                disabled={!isClickable}
                className={`
                  relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all
                  ${status === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-950' : ''}
                  ${status === 'current' ? 'border-primary bg-primary/10' : ''}
                  ${status === 'upcoming' ? 'border-muted bg-muted/50' : ''}
                  ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                `}
              >
                <div className="mb-1">{getPeriodIcon(period)}</div>
                <span className={`text-xs font-semibold ${
                  status === 'current' ? 'text-primary' : status === 'completed' ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'
                }`}>
                  {period}
                </span>
                {status === 'current' && (
                  <Badge variant="default" className="mt-1 text-xs px-1 py-0">
                    Current
                  </Badge>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-muted-foreground" />
            <span>Upcoming</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

