'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Gift, CheckCircle2, Clock, Calendar } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'

interface PayoutHistoryItem {
  id: string
  cycle_id: string
  cycle_name: string
  chama_name: string
  period_number: number
  amount: number
  status: string
  scheduled_date: string | null
  paid_at: string | null
  confirmed_at: string | null
  created_at: string
}

interface PayoutHistoryProps {
  payouts: PayoutHistoryItem[]
}

const getStatusBadge = (status: string) => {
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
    default:
      return <Badge variant="default">{status}</Badge>
  }
}

export function PayoutHistory({ payouts }: PayoutHistoryProps) {
  if (payouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>All payouts you've received</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No payouts yet"
            description="Your payout history will appear here once you receive payouts."
          />
        </CardContent>
      </Card>
    )
  }

  const totalReceived = payouts
    .filter((p) => p.status === 'paid' || p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>All payouts you've received</CardDescription>
          </div>
          {totalReceived > 0 && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Received</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalReceived)}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payouts.map((payout) => (
            <div
              key={payout.id}
              className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{payout.cycle_name}</h3>
                    {getStatusBadge(payout.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {payout.chama_name} • Period {payout.period_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-green-600">
                    {formatCurrency(payout.amount)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
                {payout.scheduled_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Scheduled: {formatDate(payout.scheduled_date)}</span>
                  </div>
                )}
                {payout.paid_at && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Paid: {formatDate(payout.paid_at)}</span>
                  </div>
                )}
                {payout.confirmed_at && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Confirmed: {formatDate(payout.confirmed_at)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

