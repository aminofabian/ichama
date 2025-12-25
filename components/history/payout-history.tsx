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
      <Card className="border-border/50 shadow-md">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Payout History</CardTitle>
            <CardDescription className="text-xs">All payouts you've received</CardDescription>
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
    <Card className="border-border/50 shadow-md">
      <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
              <CardTitle className="text-sm font-bold">Payout History</CardTitle>
              <CardDescription className="text-xs">All payouts you've received</CardDescription>
          </div>
          {totalReceived > 0 && (
              <div className="text-left sm:text-right p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <p className="text-xs text-muted-foreground mb-0.5">Total Received</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalReceived)}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
          <div className="space-y-2">
          {payouts.map((payout) => (
            <div
              key={payout.id}
                className="rounded-lg border border-border/50 bg-gradient-to-br from-card/80 to-card/50 p-2.5 hover:border-green-500/50 hover:shadow-md transition-all"
            >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Gift className="h-3.5 w-3.5 text-[#FFC700] flex-shrink-0" />
                      <h3 className="font-semibold text-sm">{payout.cycle_name}</h3>
                    {getStatusBadge(payout.status)}
                  </div>
                    <p className="text-xs text-muted-foreground">
                    {payout.chama_name} • Period {payout.period_number}
                  </p>
                </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-green-600 dark:text-green-400">
                    {formatCurrency(payout.amount)}
                  </p>
                </div>
              </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50 flex-wrap">
                {payout.scheduled_date && (
                  <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                    <span>Scheduled: {formatDate(payout.scheduled_date)}</span>
                  </div>
                )}
                {payout.paid_at && (
                  <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span>Paid: {formatDate(payout.paid_at)}</span>
                  </div>
                )}
                {payout.confirmed_at && (
                  <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
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

