'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Gift, CheckCircle2, Clock, Send } from 'lucide-react'
import type { Payout } from '@/lib/types/contribution'
import type { CycleMember } from '@/lib/types/cycle'

interface PayoutCardProps {
  payout: Payout
  recipient: CycleMember & { user?: { full_name: string } } | null
  isAdmin?: boolean
  isRecipient?: boolean
  onUpdate?: () => void
}

export function PayoutCard({
  payout,
  recipient,
  isAdmin = false,
  isRecipient = false,
  onUpdate,
}: PayoutCardProps) {
  const { addToast } = useToast()
  const [isSending, setIsSending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

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

  const handleSend = async () => {
    setIsSending(true)
    try {
      const response = await fetch(`/api/payouts/${payout.id}/send`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send payout')
      }

      addToast({
        variant: 'success',
        title: 'Payout Sent',
        description: 'The payout has been marked as sent successfully.',
      })

      onUpdate?.()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Failed to send payout',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      const response = await fetch(`/api/payouts/${payout.id}/confirm`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to confirm payout')
      }

      addToast({
        variant: 'success',
        title: 'Payout Confirmed',
        description: 'You have confirmed receipt of the payout.',
      })

      onUpdate?.()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Failed to confirm payout',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <CardTitle>Period {payout.period_number} Payout</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>Payout details and actions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recipient && (
          <div className="flex items-center gap-4 pb-4 border-b">
            <Avatar name={recipient.user?.full_name || 'Unknown'} size="lg" />
            <div>
              <p className="font-semibold text-lg">
                {recipient.user?.full_name || 'Unknown Member'}
              </p>
              <p className="text-sm text-muted-foreground">
                Turn #{recipient.turn_order}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-2xl font-bold">{formatCurrency(payout.amount)}</p>
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

        {payout.confirmed_at && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">Confirmed At</p>
            <p className="text-sm font-medium">{formatDate(payout.confirmed_at)}</p>
          </div>
        )}

        {payout.notes && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">Notes</p>
            <p className="text-sm">{payout.notes}</p>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          {isAdmin && (payout.status === 'scheduled' || payout.status === 'pending') && (
            <Button
              className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-md shadow-[#FFD700]/25 hover:shadow-lg hover:shadow-[#FFD700]/30"
              variant="primary"
              onClick={handleSend}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Sending...</span>
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Mark as Sent
                </>
              )}
            </Button>
          )}

          {isRecipient && payout.status === 'paid' && payout.confirmed_by_member === 0 && (
            <Button
              className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-md shadow-[#FFD700]/25 hover:shadow-lg hover:shadow-[#FFD700]/30"
              variant="primary"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Confirming...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Receipt
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

