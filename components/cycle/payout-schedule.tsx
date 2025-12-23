'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Calendar, Gift, CheckCircle2, Clock } from 'lucide-react'
import type { Payout } from '@/lib/types/contribution'

interface PayoutWithUser extends Payout {
  user?: {
    id: string
    full_name: string
    phone_number: string
  }
}

interface PayoutScheduleProps {
  payouts: PayoutWithUser[]
}

export function PayoutSchedule({ payouts }: PayoutScheduleProps) {
  if (payouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout Schedule</CardTitle>
          <CardDescription>All scheduled payouts for this cycle</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            No payouts scheduled for this cycle
          </p>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = (status: Payout['status']) => {
    switch (status) {
      case 'paid':
        return (
          <Badge variant="success">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        )
      case 'confirmed':
        return (
          <Badge variant="info">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Confirmed
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="warning">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case 'scheduled':
        return (
          <Badge variant="info">
            <Clock className="mr-1 h-3 w-3" />
            Scheduled
          </Badge>
        )
      case 'skipped':
        return <Badge variant="default">Skipped</Badge>
      default:
        return <Badge variant="default">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Payout Schedule
        </CardTitle>
        <CardDescription>All scheduled payouts for this cycle</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <Avatar
                  name={payout.user?.full_name || 'Unknown'}
                  size="md"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">
                      {payout.user?.full_name || 'Unknown Member'}
                    </p>
                    {getStatusBadge(payout.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Period {payout.period_number}
                    </span>
                    {payout.scheduled_date && (
                      <span>{formatDate(payout.scheduled_date)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{formatCurrency(payout.amount)}</p>
                {payout.paid_at && (
                  <p className="text-xs text-muted-foreground">
                    Paid: {formatDate(payout.paid_at)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

