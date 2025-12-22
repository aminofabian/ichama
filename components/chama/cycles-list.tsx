'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { EmptyState } from '@/components/shared/empty-state'
import { Calendar, Users, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import type { Cycle } from '@/lib/types/cycle'

interface CyclesListProps {
  cycles: Cycle[]
  chamaId: string
  isAdmin?: boolean
}

export function CyclesList({ cycles, chamaId, isAdmin = false }: CyclesListProps) {
  if (cycles.length === 0) {
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
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Active
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        )
      case 'paused':
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-600">
            <AlertCircle className="mr-1 h-3 w-3" />
            Paused
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="outline" className="border-red-500 text-red-600">
            <AlertCircle className="mr-1 h-3 w-3" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cycles</CardTitle>
            <CardDescription>All contribution cycles for this chama</CardDescription>
          </div>
          {isAdmin && (
            <Button asChild size="sm">
              <Link href={`/chamas/${chamaId}/cycles/new`}>New Cycle</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cycles.map((cycle) => (
            <Link
              key={cycle.id}
              href={`/chamas/${chamaId}/cycles/${cycle.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{cycle.name}</h3>
                    {getStatusBadge(cycle.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground md:grid-cols-4">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{formatCurrency(cycle.contribution_amount)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>
                        Period {cycle.current_period} / {cycle.total_periods}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(cycle.start_date)}</span>
                    </div>
                    {cycle.end_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Ends: {formatDate(cycle.end_date)}</span>
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

