'use client'

import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Cycle, CycleMember } from '@/lib/types/cycle'
import type { ChamaType } from '@/lib/types/chama'

interface CycleSummaryProps {
  cycle: Cycle
  cycleMember: CycleMember | null
  chamaType: ChamaType
}

export function CycleSummary({ cycle, cycleMember, chamaType }: CycleSummaryProps) {
  const hasContributed = cycleMember?.contribution_status === 'paid'
  const isPending = cycleMember?.contribution_status === 'pending'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Cycle</CardTitle>
          <Badge variant={cycle.status === 'active' ? 'success' : 'default'}>
            {cycle.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Period</p>
            <p className="font-medium">
              {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Current Period</p>
            <p className="font-medium">
              Period {cycle.current_period} of {cycle.total_periods}
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your Contribution Status</span>
            {hasContributed ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Paid
              </Badge>
            ) : isPending ? (
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Pending
              </Badge>
            ) : (
              <Badge variant="default">Not Set</Badge>
            )}
          </div>
          {cycleMember && (
            <p className="mt-2 text-lg font-semibold">
              {formatCurrency(cycleMember.contribution_amount || 0)}
            </p>
          )}
        </div>

        {chamaType !== 'savings' && (
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">This Period&apos;s Payout</p>
            <p className="text-lg font-semibold">
              {formatCurrency(cycle.payout_amount || 0)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

