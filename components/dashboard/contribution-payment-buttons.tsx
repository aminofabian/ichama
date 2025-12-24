'use client'

import { useState } from 'react'
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
  const [isSaveMode, setIsSaveMode] = useState(false)
  const [additionalSavings, setAdditionalSavings] = useState<string>('')

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

  const handleOpenPaymentModal = (contribution: PendingContribution, saveMode: boolean = false) => {
    setSelectedContribution(contribution)
    setAmountPaid(contribution.amount_due.toString())
    setPaidDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setIsSaveMode(saveMode)
    setAdditionalSavings('')
  }

  const handleCloseModal = () => {
    setSelectedContribution(null)
    setAmountPaid('')
    setNotes('')
    setIsSaveMode(false)
    setAdditionalSavings('')
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

    let savingsAmount: number | undefined
    if (isSaveMode) {
      const savings = parseInt(additionalSavings, 10)
      if (isNaN(savings) || savings < 0) {
        addToast({
          variant: 'error',
          title: 'Invalid Savings Amount',
          description: 'Please enter a valid savings amount (0 or more)',
        })
        return
      }
      savingsAmount = savings > 0 ? savings : undefined
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
          additional_savings: savingsAmount,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to record contribution')
      }

      if (isSaveMode && savingsAmount && savingsAmount > 0) {
        addToast({
          variant: 'success',
          title: 'Contribution & Savings Recorded',
          description: `Your contribution has been recorded and ${formatCurrency(savingsAmount)} has been credited to your savings account.`,
        })
      } else {
      addToast({
        variant: 'success',
        title: 'Payment Recorded',
        description: 'Your contribution has been recorded. An admin will confirm it and process your savings.',
      })
      }

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
    <div className="space-y-2">
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
            className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-sm truncate">{contrib.chama_name}</h3>
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        {contrib.cycle_name}
                      </Badge>
                    </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Period {contrib.period_number}</span>
                  <span>•</span>
                  <span className="font-medium text-foreground">{formatCurrency(contrib.amount_due)}</span>
                  {hasSavings && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <PiggyBank className="h-3 w-3" />
                        {formatCurrency(effectiveSavings)}
                      </span>
                    </>
                  )}
                </div>
                  </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                  <p className="text-xs text-muted-foreground">Due {formatDate(contrib.due_date)}</p>
                    <p className={`text-xs font-medium ${
                      daysRemaining < 0 ? 'text-red-600' :
                      daysRemaining <= 2 ? 'text-red-600' :
                      daysRemaining <= 4 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {daysRemaining < 0 
                      ? `${Math.abs(daysRemaining)}d overdue`
                        : daysRemaining === 0
                        ? 'Due today'
                      : `${daysRemaining}d left`
                      }
                    </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    onClick={() => handleOpenPaymentModal(contrib, false)}
                    disabled={isProcessing}
                    size="sm"
                    className={`text-white text-xs px-3 py-1.5 h-auto ${buttonColor}`}
                  >
                    {isProcessing ? (
                        <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Wallet className="h-3 w-3 mr-1" />
                        Pay
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleOpenPaymentModal(contrib, true)}
                    disabled={isProcessing}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-xs px-3 py-1.5 h-auto"
                  >
                    <PiggyBank className="h-3 w-3 mr-1" />
                    Pay & Save
                  </Button>
                </div>
              </div>
            </div>
            {contrib.amount_paid > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5 pt-1.5 border-t">
                Paid: {formatCurrency(contrib.amount_paid)} • Remaining: {formatCurrency(remaining)}
              </p>
            )}
              </div>
            )
          })}

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
                <ModalTitle>
                  {isSaveMode ? 'Contribute & Save' : 'Record Contribution Payment'}
                </ModalTitle>
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

            {hasSavings && !isSaveMode && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  💡 Savings Information
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  When an admin confirms this payment, {formatCurrency(effectiveSavings)} will be automatically credited to your savings account.
                </p>
              </div>
            )}

            {isSaveMode && (
              <div>
                <Input
                  type="number"
                  label="Additional Savings Amount (KES)"
                  value={additionalSavings}
                  onChange={(e) => setAdditionalSavings(e.target.value)}
                  min={0}
                  placeholder="Enter additional amount to save (optional)"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This amount will be immediately credited to your savings account. Leave empty or 0 to skip.
                </p>
                {hasSavings && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Note: {formatCurrency(effectiveSavings)} will still be automatically credited when admin confirms your contribution.
                    </p>
                  </div>
                )}
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
                        <span className="ml-2">Processing...</span>
                      </>
                    ) : (
                      isSaveMode ? 'Contribute & Save' : 'Record Payment'
                    )}
                  </Button>
                </div>
              </div>
            </ModalContent>
          </Modal>
        )
      })()}
    </div>
  )
}

