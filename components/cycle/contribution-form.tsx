'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Contribution } from '@/lib/types/contribution'

interface ContributionFormProps {
  contribution: Contribution
  onSuccess?: () => void
}

export function ContributionForm({ contribution, onSuccess }: ContributionFormProps) {
  const { addToast } = useToast()
  const [amountPaid, setAmountPaid] = useState(contribution.amount_paid.toString())
  const [paidDate, setPaidDate] = useState(
    contribution.paid_at ? new Date(contribution.paid_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState(contribution.notes || '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/cycles/${contribution.cycle_id}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contribution_id: contribution.id,
          amount_paid: parseInt(amountPaid, 10),
          paid_at: new Date(paidDate).toISOString(),
          notes: notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to record contribution')
      }

      addToast({
        variant: 'success',
        title: 'Contribution Recorded',
        description: 'Your contribution has been recorded successfully.',
      })

      onSuccess?.()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record contribution',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const remaining = contribution.amount_due - contribution.amount_paid

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Contribution</CardTitle>
        <CardDescription>Period {contribution.period_number}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Amount Due</p>
            <p className="text-2xl font-bold">{formatCurrency(contribution.amount_due)}</p>
          </div>

          {contribution.amount_paid > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Already Paid</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(contribution.amount_paid)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Remaining: {formatCurrency(remaining)}
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground mb-1">Due Date</p>
            <p className="text-sm">{formatDate(contribution.due_date)}</p>
          </div>

          <Input
            type="number"
            label="Amount Paid (KES)"
            placeholder="Enter amount"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            min="0"
            max={contribution.amount_due}
            required
            disabled={isLoading || contribution.status === 'confirmed'}
          />

          <Input
            type="date"
            label="Date Paid"
            value={paidDate}
            onChange={(e) => setPaidDate(e.target.value)}
            required
            disabled={isLoading || contribution.status === 'confirmed'}
          />

          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any notes about this payment..."
              disabled={isLoading || contribution.status === 'confirmed'}
            />
          </div>

          {contribution.status === 'confirmed' ? (
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✓ This contribution has been confirmed by an admin.
              </p>
            </div>
          ) : (
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Recording...</span>
                </>
              ) : (
                'Record Contribution'
              )}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

