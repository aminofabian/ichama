'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { ContributionForm } from './contribution-form'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils/format'
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react'
import type { Contribution } from '@/lib/types/contribution'

interface MyContributionCardProps {
  contribution: Contribution | null
  onUpdate?: () => void
}

export function MyContributionCard({ contribution, onUpdate }: MyContributionCardProps) {
  const [showForm, setShowForm] = useState(false)

  if (!contribution) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">My Contribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border/50 bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No contribution due at this time
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusBadge = () => {
    switch (contribution.status) {
      case 'confirmed':
        return (
          <Badge variant="success">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Confirmed
          </Badge>
        )
      case 'paid':
        return (
          <Badge variant="info">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Paid
          </Badge>
        )
      case 'partial':
        return (
          <Badge variant="warning">
            <AlertCircle className="mr-1 h-3 w-3" />
            Partial
          </Badge>
        )
      case 'late':
        return (
          <Badge variant="error">
            <Clock className="mr-1 h-3 w-3" />
            Late
          </Badge>
        )
      case 'missed':
        return (
          <Badge variant="error">
            <XCircle className="mr-1 h-3 w-3" />
            Missed
          </Badge>
        )
      default:
        return (
          <Badge variant="default">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
    }
  }

  const isOverdue = new Date(contribution.due_date) < new Date() && contribution.status === 'pending'
  const remaining = contribution.amount_due - contribution.amount_paid
  const canPay = contribution.status !== 'confirmed' && remaining > 0

  return (
    <>
      <Card className="border-border/50 shadow-sm w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg font-semibold truncate">My Contribution</CardTitle>
            <div className="shrink-0">{getStatusBadge()}</div>
          </div>
          <CardDescription className="text-xs sm:text-sm">Period {contribution.period_number}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 sm:p-3 min-w-0">
              <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 truncate">Amount Due</p>
              <p className="text-base sm:text-lg font-bold truncate">{formatCurrency(contribution.amount_due)}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 sm:p-3 min-w-0">
              <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 truncate">Amount Paid</p>
              <p className={`text-base sm:text-lg font-bold truncate ${contribution.amount_paid > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                {formatCurrency(contribution.amount_paid)}
              </p>
            </div>
          </div>

          {remaining > 0 && (
            <div className="rounded-lg border border-orange-200/50 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 dark:border-orange-800/30 p-2.5 sm:p-3">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 truncate">
                Remaining: {formatCurrency(remaining)}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 sm:p-3">
            <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 truncate">Due Date</p>
            <p className="text-xs sm:text-sm font-semibold truncate">
              {formatDate(contribution.due_date)}
              {isOverdue && (
                <span className="ml-2 text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-medium">(Overdue)</span>
              )}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
              {formatRelativeTime(contribution.due_date)}
            </p>
          </div>

          {contribution.paid_at && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 sm:p-3">
              <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 truncate">Paid On</p>
              <p className="text-xs sm:text-sm font-semibold truncate">{formatDate(contribution.paid_at)}</p>
            </div>
          )}

          {contribution.notes && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 sm:p-3">
              <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 truncate">Notes</p>
              <p className="text-[10px] sm:text-xs break-words">{contribution.notes}</p>
            </div>
          )}

          {canPay && (
            <Button
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all"
              onClick={() => setShowForm(true)}
            >
              {contribution.amount_paid > 0 ? 'Update Payment' : 'Record Payment'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Modal
        open={showForm}
        onOpenChange={(open) => !open && setShowForm(false)}
      >
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Record Contribution</ModalTitle>
          </ModalHeader>
          <ContributionForm
            contribution={contribution}
            onSuccess={() => {
              setShowForm(false)
              onUpdate?.()
            }}
          />
        </ModalContent>
      </Modal>
    </>
  )
}

