'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { EmptyState } from '@/components/shared/empty-state'
import { Calendar, Users, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Cycle } from '@/lib/types/cycle'

function CycleCard({ 
  cycle, 
  chamaId, 
  getStatusBadge 
}: { 
  cycle: Cycle
  chamaId: string
  getStatusBadge: (status: string) => React.ReactElement
}) {
  return (
    <Link
      href={`/chamas/${chamaId}/cycles/${cycle.id}`}
      className="group block rounded-lg border border-border/50 bg-gradient-to-br from-card/80 to-card/50 p-4 transition-all hover:shadow-lg hover:border-primary/30 hover:scale-[1.01]"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm md:text-base">{cycle.name}</h3>
            {getStatusBadge(cycle.status)}
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground md:grid-cols-4">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">{formatCurrency(cycle.contribution_amount)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">
                Period {cycle.current_period} / {cycle.total_periods}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="truncate">{cycle.start_date ? formatDate(cycle.start_date) : 'N/A'}</span>
            </div>
            {cycle.end_date && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                <span className="truncate">Ends: {formatDate(cycle.end_date)}</span>
              </div>
            )}
          </div>
          {cycle.status === 'active' && (
            <p className="text-xs text-muted-foreground">
              Next contribution due soon
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

interface CyclesListProps {
  cycles: Cycle[]
  chamaId: string
  isAdmin?: boolean
}

export function CyclesList({ cycles, chamaId, isAdmin = false }: CyclesListProps) {
  // Filter and sort cycles: show active first, then pending, then recent completed, exclude cancelled
  const filteredCycles = cycles
    .filter((cycle) => cycle.status !== 'cancelled')
    .sort((a, b) => {
      // Sort by status priority: active > pending > paused > completed
      const statusOrder: Record<string, number> = {
        active: 1,
        pending: 2,
        paused: 3,
        completed: 4,
      }
      const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
      if (statusDiff !== 0) return statusDiff
      
      // If same status, sort by created date (newest first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Separate cycles by status for better organization
  const activeCycles = filteredCycles.filter((c) => c.status === 'active')
  const pendingCycles = filteredCycles.filter((c) => c.status === 'pending')
  const otherCycles = filteredCycles.filter((c) => !['active', 'pending'].includes(c.status))

  if (filteredCycles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cycles</CardTitle>
          <CardDescription>All contribution cycles for this chama</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No cycles yet"
            description="Create the first contribution cycle to get started."
          />
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Active
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="warning">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="info">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )
      case 'paused':
        return (
          <Badge variant="warning">
            <AlertCircle className="mr-1 h-3 w-3" />
            Paused
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="error">
            <AlertCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Cycles</CardTitle>
            <CardDescription className="text-xs">All contribution cycles for this chama</CardDescription>
          </div>
          {isAdmin && (
            <Link href={`/chamas/${chamaId}/cycles/new`}>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
              >
                New Cycle
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 md:space-y-6">
          {/* Active Cycles */}
          {activeCycles.length > 0 && (
            <div className="space-y-3">
              {activeCycles.length > 1 && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
                  </div>
                  <h4 className="relative text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 bg-card inline-block">
                    Active Cycles
                  </h4>
                </div>
              )}
              {activeCycles.map((cycle) => (
                <CycleCard key={cycle.id} cycle={cycle} chamaId={chamaId} getStatusBadge={getStatusBadge} />
              ))}
            </div>
          )}

          {/* Pending Cycles */}
          {pendingCycles.length > 0 && (
            <div className="space-y-3">
              {pendingCycles.length > 1 && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
                  </div>
                  <h4 className="relative text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 bg-card inline-block">
                    Pending Cycles
                  </h4>
                </div>
              )}
              {pendingCycles.map((cycle) => (
                <CycleCard key={cycle.id} cycle={cycle} chamaId={chamaId} getStatusBadge={getStatusBadge} />
              ))}
            </div>
          )}

          {/* Other Cycles (Paused, Completed) - Limit to last 5 */}
          {otherCycles.length > 0 && (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
                <h4 className="relative text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 bg-card inline-block">
                  Other Cycles
                </h4>
              </div>
              {otherCycles.slice(0, 5).map((cycle) => (
                <CycleCard key={cycle.id} cycle={cycle} chamaId={chamaId} getStatusBadge={getStatusBadge} />
              ))}
              {otherCycles.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Showing 5 of {otherCycles.length} {otherCycles.length > 5 ? 'other' : ''} cycles
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

