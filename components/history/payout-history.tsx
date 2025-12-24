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
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-xl md:rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
        <Card className="relative rounded-xl md:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-xl">
        <CardHeader>
            <CardTitle className="text-base md:text-lg font-bold">Payout History</CardTitle>
            <CardDescription className="text-xs md:text-sm">All payouts you've received</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No payouts yet"
            description="Your payout history will appear here once you receive payouts."
          />
        </CardContent>
      </Card>
      </div>
    )
  }

  const totalReceived = payouts
    .filter((p) => p.status === 'paid' || p.status === 'confirmed')
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-xl md:rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      <Card className="relative rounded-xl md:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-xl">
      <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
              <CardTitle className="text-base md:text-lg font-bold">Payout History</CardTitle>
              <CardDescription className="text-xs md:text-sm">All payouts you've received</CardDescription>
          </div>
          {totalReceived > 0 && (
              <div className="text-left sm:text-right p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Received</p>
                <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalReceived)}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
          <div className="space-y-3">
          {payouts.map((payout) => (
            <div
              key={payout.id}
                className="rounded-lg border-2 border-border/50 bg-gradient-to-br from-card/80 to-card/50 p-3 md:p-4 hover:border-green-500/50 hover:shadow-md transition-all"
            >
                <div className="flex items-start justify-between gap-3 mb-2 md:mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Gift className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                      <h3 className="font-semibold text-sm md:text-base">{payout.cycle_name}</h3>
                    {getStatusBadge(payout.status)}
                  </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                    {payout.chama_name} • Period {payout.period_number}
                  </p>
                </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-base md:text-lg text-green-600 dark:text-green-400">
                    {formatCurrency(payout.amount)}
                  </p>
                </div>
              </div>
                <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground pt-2 md:pt-3 border-t border-border/50 flex-wrap">
                {payout.scheduled_date && (
                  <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span>Scheduled: {formatDate(payout.scheduled_date)}</span>
                  </div>
                )}
                {payout.paid_at && (
                  <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
                    <span>Paid: {formatDate(payout.paid_at)}</span>
                  </div>
                )}
                {payout.confirmed_at && (
                  <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
                    <span>Confirmed: {formatDate(payout.confirmed_at)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    </div>
  )
}

