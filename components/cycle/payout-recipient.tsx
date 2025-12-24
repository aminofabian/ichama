'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Gift, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import type { Payout } from '@/lib/types/contribution'
import type { CycleMember } from '@/lib/types/cycle'

interface PayoutRecipientProps {
  payout: Payout | null
  recipient: CycleMember & { user?: { full_name: string } } | null
  isAdmin?: boolean
  onConfirmPayout?: (payoutId: string) => void
}

export function PayoutRecipient({
  payout,
  recipient,
  isAdmin = false,
  onConfirmPayout,
}: PayoutRecipientProps) {
  if (!payout || !recipient) {
    return (
      <Card className="border-border/50 shadow-lg overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 via-transparent to-slate-500/5" />
        <CardHeader className="pb-3 relative">
          <CardTitle className="text-lg sm:text-xl font-bold">Current Period Payout</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="rounded-2xl border-2 border-dashed border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 p-6 sm:p-8 text-center">
            <div className="flex items-center justify-center h-14 w-14 mx-auto mb-4 rounded-2xl bg-muted border border-border/50">
              <Gift className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              No payout scheduled for this period
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = () => {
    switch (payout.status) {
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
        return <Badge variant="default">{payout.status}</Badge>
    }
  }

  return (
    <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-primary/5" />
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      
      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold min-w-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 shadow-md shadow-emerald-500/20">
              <Gift className="h-4 w-4 text-white" />
            </div>
            <span className="truncate">Period {payout.period_number}</span>
          </CardTitle>
          <div className="shrink-0">{getStatusBadge()}</div>
        </div>
        <CardDescription className="text-xs sm:text-sm">Payout recipient</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 relative">
        {/* Recipient Card */}
        <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-gradient-to-br from-background to-muted/30 p-4 shadow-sm">
          <div className="relative">
            <Avatar name={recipient.user?.full_name || 'Unknown'} size="lg" />
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
              <Gift className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base sm:text-lg truncate">
              {recipient.user?.full_name || 'Unknown Member'}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center h-4 w-4 rounded bg-muted text-[10px] font-bold">{recipient.turn_order}</span>
              Turn Order
            </p>
          </div>
        </div>

        {/* Amount Display */}
        <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50 to-green-50/50 dark:from-emerald-950/40 dark:to-green-950/20 p-4 sm:p-5">
          <p className="text-xs font-semibold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-wider mb-2">Payout Amount</p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-800 dark:text-emerald-200">{formatCurrency(payout.amount)}</p>
        </div>

        {/* Schedule Info */}
        <div className="rounded-xl border border-border/50 bg-muted/30 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Scheduled</p>
              <p className="text-sm font-semibold">
                {payout.scheduled_date ? formatDate(payout.scheduled_date) : 'Not scheduled'}
              </p>
            </div>
            {payout.paid_at && (
              <div className="text-right">
                <p className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Paid</p>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{formatDate(payout.paid_at)}</p>
              </div>
            )}
          </div>
        </div>

        {isAdmin && payout.status === 'scheduled' && (
          <Button
            className="w-full text-sm sm:text-base bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300"
            onClick={() => onConfirmPayout?.(payout.id)}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm Payout
          </Button>
        )}

        {payout.notes && (
          <div className="rounded-xl border border-border/50 bg-muted/30 p-3 sm:p-4">
            <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
            <p className="text-sm text-foreground/80">{payout.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

