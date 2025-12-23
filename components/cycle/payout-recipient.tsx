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
      <Card>
        <CardHeader>
          <CardTitle>Current Period Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No payout scheduled for this period
          </p>
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Period {payout.period_number} Payout Recipient
        </CardTitle>
        <CardDescription>Current period payout information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar name={recipient.user?.full_name || 'Unknown'} size="lg" />
          <div className="flex-1">
            <p className="font-semibold text-lg">
              {recipient.user?.full_name || 'Unknown Member'}
            </p>
            <p className="text-sm text-muted-foreground">
              Turn #{recipient.turn_order}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-muted-foreground">Payout Amount</p>
            <p className="text-xl font-bold">{formatCurrency(payout.amount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Scheduled Date</p>
            <p className="text-sm font-medium">
              {payout.scheduled_date ? formatDate(payout.scheduled_date) : 'Not scheduled'}
            </p>
          </div>
        </div>

        {payout.paid_at && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">Paid At</p>
            <p className="text-sm font-medium">{formatDate(payout.paid_at)}</p>
          </div>
        )}

        {isAdmin && payout.status === 'scheduled' && (
          <Button
            className="w-full"
            onClick={() => onConfirmPayout?.(payout.id)}
          >
            Confirm Payout
          </Button>
        )}

        {payout.notes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-sm">{payout.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

