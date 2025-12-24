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
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Current Period Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border/50 bg-muted/30 p-4 sm:p-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
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
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg min-w-0">
            <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <span className="truncate">Period {payout.period_number} Payout</span>
          </CardTitle>
          <div className="shrink-0">{getStatusBadge()}</div>
        </div>
        <CardDescription className="text-xs sm:text-sm">Current period payout recipient</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-border/50 bg-muted/30 p-2.5 sm:p-3">
          <Avatar name={recipient.user?.full_name || 'Unknown'} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-base truncate">
              {recipient.user?.full_name || 'Unknown Member'}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Turn #{recipient.turn_order}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 rounded-lg border border-border/50 bg-muted/30 p-2.5 sm:p-3">
          <div>
            <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Payout Amount</p>
            <p className="text-base sm:text-lg font-bold">{formatCurrency(payout.amount)}</p>
          </div>
          <div>
            <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Scheduled Date</p>
            <p className="text-xs sm:text-sm font-semibold">
              {payout.scheduled_date ? formatDate(payout.scheduled_date) : 'Not scheduled'}
            </p>
          </div>
        </div>

        {payout.paid_at && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 sm:p-3">
            <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Paid At</p>
            <p className="text-xs sm:text-sm font-semibold">{formatDate(payout.paid_at)}</p>
          </div>
        )}

        {isAdmin && payout.status === 'scheduled' && (
          <Button
            className="w-full text-sm sm:text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
            onClick={() => onConfirmPayout?.(payout.id)}
          >
            Confirm Payout
          </Button>
        )}

        {payout.notes && (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 sm:p-3">
            <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
            <p className="text-[10px] sm:text-xs">{payout.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

