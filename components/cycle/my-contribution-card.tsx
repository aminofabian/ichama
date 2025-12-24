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
      <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">My Contribution</CardTitle>
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
      <Card className="border-border/50 shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">My Contribution</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription className="text-xs">Period {contribution.period_number}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Amount Due</p>
              <p className="text-base font-bold">{formatCurrency(contribution.amount_due)}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Amount Paid</p>
              <p className={`text-base font-bold ${contribution.amount_paid > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                {formatCurrency(contribution.amount_paid)}
              </p>
            </div>
          </div>

          {remaining > 0 && (
            <div className="p-3 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-800/30">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                Remaining: {formatCurrency(remaining)}
              </p>
            </div>
          )}

          <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Due Date</p>
            <p className="text-sm font-semibold">
              {formatDate(contribution.due_date)}
              {isOverdue && (
                <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-medium">(Overdue)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatRelativeTime(contribution.due_date)}
            </p>
          </div>

          {contribution.paid_at && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Paid On</p>
              <p className="text-sm font-semibold">{formatDate(contribution.paid_at)}</p>
            </div>
          )}

          {contribution.notes && (
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
              <p className="text-xs">{contribution.notes}</p>
            </div>
          )}

          {canPay && (
            <Button
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
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

