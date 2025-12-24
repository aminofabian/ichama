'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalClose } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Calendar, Clock, Wallet, PiggyBank } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PendingContribution {
  id: string
  cycle_id: string
  cycle_member_id: string
  chama_id: string
  chama_name: string
  cycle_name: string
  period_number: number
  amount_due: number
  amount_paid: number
  due_date: string
  status: string
  contribution_amount: number
  savings_amount: number
  chama_type: 'savings' | 'merry_go_round' | 'hybrid'
  custom_savings_amount: number | null
}

interface ContributionPaymentButtonsProps {
  contributions: PendingContribution[]
  onUpdate?: () => void
}

export function ContributionPaymentButtons({ contributions, onUpdate }: ContributionPaymentButtonsProps) {
  const { addToast } = useToast()
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedContribution, setSelectedContribution] = useState<PendingContribution | null>(null)
  const [amountPaid, setAmountPaid] = useState<string>('')
  const [paidDate, setPaidDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getDaysRemaining = (dueDate: string): number => {
    const due = new Date(dueDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getButtonVariant = (daysRemaining: number): 'success' | 'warning' | 'danger' => {
    if (daysRemaining >= 5 && daysRemaining <= 7) {
      return 'success'
    } else if (daysRemaining >= 3 && daysRemaining <= 4) {
      return 'warning'
    } else {
      return 'danger'
    }
  }

  const getButtonColor = (daysRemaining: number): string => {
    if (daysRemaining >= 5 && daysRemaining <= 7) {
      return 'bg-green-600 hover:bg-green-700'
    } else if (daysRemaining >= 3 && daysRemaining <= 4) {
      return 'bg-yellow-500 hover:bg-yellow-600'
    } else {
      return 'bg-red-600 hover:bg-red-700'
    }
  }

  const handleOpenPaymentModal = (contribution: PendingContribution) => {
    setSelectedContribution(contribution)
    setAmountPaid(contribution.amount_due.toString())
    setPaidDate(new Date().toISOString().split('T')[0])
    setNotes('')
  }

  const handleCloseModal = () => {
    setSelectedContribution(null)
    setAmountPaid('')
    setNotes('')
  }

  const handleSubmitPayment = async () => {
    if (!selectedContribution) return

    const amount = parseInt(amountPaid, 10)
    if (isNaN(amount) || amount <= 0) {
      addToast({
        variant: 'error',
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
      })
      return
    }

    if (amount > selectedContribution.amount_due) {
      addToast({
        variant: 'error',
        title: 'Invalid Amount',
        description: `Amount cannot exceed ${formatCurrency(selectedContribution.amount_due)}`,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/cycles/${selectedContribution.cycle_id}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contribution_id: selectedContribution.id,
          amount_paid: amount,
          paid_at: new Date(paidDate).toISOString(),
          notes: notes || null,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to record contribution')
      }

      addToast({
        variant: 'success',
        title: 'Payment Recorded',
        description: 'Your contribution has been recorded. An admin will confirm it and process your savings.',
      })

      handleCloseModal()
      onUpdate?.()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record payment',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (contributions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Contributions</CardTitle>
        <CardDescription>Record your contributions and savings payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contributions.map((contrib) => {
            const daysRemaining = getDaysRemaining(contrib.due_date)
            const remaining = contrib.amount_due - contrib.amount_paid
            const effectiveSavings = contrib.custom_savings_amount ?? contrib.savings_amount
            const hasSavings = effectiveSavings > 0 && (contrib.chama_type === 'savings' || contrib.chama_type === 'hybrid')
            const buttonColor = getButtonColor(daysRemaining)
            const isProcessing = processingId === contrib.id

            return (
              <div
                key={contrib.id}
                className="rounded-lg border p-4 space-y-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{contrib.chama_name}</h3>
                      <Badge variant="default" className="text-xs">
                        {contrib.cycle_name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Period {contrib.period_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Due</p>
                    <p className="font-semibold">{formatDate(contrib.due_date)}</p>
                    <p className={`text-xs font-medium ${
                      daysRemaining < 0 ? 'text-red-600' :
                      daysRemaining <= 2 ? 'text-red-600' :
                      daysRemaining <= 4 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {daysRemaining < 0 
                        ? `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue`
                        : daysRemaining === 0
                        ? 'Due today'
                        : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Amount Due</p>
                    <p className="font-semibold">{formatCurrency(contrib.amount_due)}</p>
                    {contrib.amount_paid > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Paid: {formatCurrency(contrib.amount_paid)} | Remaining: {formatCurrency(remaining)}
                      </p>
                    )}
                  </div>
                  {hasSavings && (
                    <div>
                      <p className="text-muted-foreground">Savings Amount</p>
                      <p className="font-semibold">{formatCurrency(effectiveSavings)}</p>
                      {contrib.custom_savings_amount !== null && (
                        <Badge variant="info" className="text-xs mt-1">Custom</Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    onClick={() => handleOpenPaymentModal(contrib)}
                    disabled={isProcessing}
                    className={`flex-1 text-white ${buttonColor}`}
                  >
                    {isProcessing ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2 h-4 w-4" />
                        Record Payment
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/chamas/${contrib.chama_id}/cycles/${contrib.cycle_id}`)}
                    className="flex-1"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      {/* Payment Modal */}
      {selectedContribution && (() => {
        const effectiveSavings = selectedContribution.custom_savings_amount ?? selectedContribution.savings_amount
        const hasSavings = effectiveSavings > 0 && (selectedContribution.chama_type === 'savings' || selectedContribution.chama_type === 'hybrid')
        
        return (
          <Modal
            open={!!selectedContribution}
            onOpenChange={(open) => !open && handleCloseModal()}
          >
            <ModalContent>
              <ModalClose onClose={handleCloseModal} />
              <ModalHeader>
                <ModalTitle>Record Contribution Payment</ModalTitle>
              </ModalHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{selectedContribution.chama_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedContribution.cycle_name} - Period {selectedContribution.period_number}
                  </p>
                </div>

                <div className={`grid gap-4 p-3 bg-muted rounded-lg ${hasSavings ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Due</p>
                    <p className="text-lg font-semibold">{formatCurrency(selectedContribution.amount_due)}</p>
                  </div>
                  {hasSavings && (
                    <div>
                      <p className="text-xs text-muted-foreground">Savings Amount</p>
                      <p className="text-lg font-semibold flex items-center gap-1">
                        <PiggyBank className="h-4 w-4" />
                        {formatCurrency(effectiveSavings)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedContribution.custom_savings_amount !== null ? 'Custom' : 'Default'} • Will be credited when admin confirms
                      </p>
                    </div>
                  )}
                </div>

            {selectedContribution.amount_paid > 0 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Already paid: {formatCurrency(selectedContribution.amount_paid)}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  Remaining: {formatCurrency(selectedContribution.amount_due - selectedContribution.amount_paid)}
                </p>
              </div>
            )}

            <div>
              <Input
                type="number"
                label="Amount Paid (KES)"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                min={0}
                max={selectedContribution.amount_due}
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: {formatCurrency(selectedContribution.amount_due)}
              </p>
            </div>

            <div>
              <Input
                type="date"
                label="Date Paid"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about this payment..."
                disabled={isSubmitting}
              />
            </div>

            {hasSavings && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  💡 Savings Information
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  When an admin confirms this payment, {formatCurrency(effectiveSavings)} will be automatically credited to your savings account.
                </p>
              </div>
            )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitPayment}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Recording...</span>
                      </>
                    ) : (
                      'Record Payment'
                    )}
                  </Button>
                </div>
              </div>
            </ModalContent>
          </Modal>
        )
      })()}
    </Card>
  )
}

