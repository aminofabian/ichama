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
      <Card>
        <CardHeader>
          <CardTitle>My Contribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No contribution due at this time
          </p>
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Contribution</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>Period {contribution.period_number}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-xl font-bold">{formatCurrency(contribution.amount_due)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className={`text-xl font-bold ${contribution.amount_paid > 0 ? 'text-green-600' : ''}`}>
                {formatCurrency(contribution.amount_paid)}
              </p>
            </div>
          </div>

          {remaining > 0 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Remaining: {formatCurrency(remaining)}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="text-sm font-medium">
              {formatDate(contribution.due_date)}
              {isOverdue && (
                <span className="ml-2 text-red-600">(Overdue)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatRelativeTime(contribution.due_date)}
            </p>
          </div>

          {contribution.paid_at && (
            <div>
              <p className="text-sm text-muted-foreground">Paid On</p>
              <p className="text-sm font-medium">{formatDate(contribution.paid_at)}</p>
            </div>
          )}

          {contribution.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{contribution.notes}</p>
            </div>
          )}

          {canPay && (
            <Button
              className="w-full"
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

