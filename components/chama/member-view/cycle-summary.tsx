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
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Cycle</CardTitle>
          <Badge variant={cycle.status === 'active' ? 'default' : 'default'}>
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
              {cycle.start_date ? formatDate(cycle.start_date) : 'Not started'} - {cycle.end_date ? formatDate(cycle.end_date) : 'TBD'}
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
            <span className="text-sm text-muted-foreground">Contribution Amount</span>
          </div>
          <p className="mt-2 text-lg font-semibold">
            {formatCurrency(cycle.contribution_amount)}
          </p>
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

