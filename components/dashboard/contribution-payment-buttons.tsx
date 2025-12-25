'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalClose } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Wallet, PiggyBank, CheckCircle2 } from 'lucide-react'

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
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedContribution, setSelectedContribution] = useState<PendingContribution | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPartialPayment, setIsPartialPayment] = useState(false)
  const [partialAmount, setPartialAmount] = useState<string>('')
  const [paymentType, setPaymentType] = useState<'contribution' | 'full'>('full')

  // Helper to calculate amounts for a contribution
  const getAmounts = (contrib: PendingContribution) => {
    const effectiveSavings = contrib.custom_savings_amount ?? contrib.savings_amount
    const hasSavings = effectiveSavings > 0 && (contrib.chama_type === 'savings' || contrib.chama_type === 'hybrid')
    const total = contrib.contribution_amount + (hasSavings ? effectiveSavings : 0)
    const contributionPaid = Math.min(contrib.amount_paid, contrib.contribution_amount)
    const savingsPaid = Math.max(0, contrib.amount_paid - contrib.contribution_amount)
    const remaining = total - contrib.amount_paid
    const progress = total > 0 ? (contrib.amount_paid / total) * 100 : 0
    
    return {
      effectiveSavings,
      hasSavings,
      total,
      contributionPaid,
      savingsPaid,
      remaining,
      progress,
      contributionAmount: contrib.contribution_amount,
    }
  }

  const getDaysRemaining = (dueDate: string): number => {
    const due = new Date(dueDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getButtonColor = (daysRemaining: number): string => {
    if (daysRemaining >= 5) return 'bg-green-600 hover:bg-green-700'
    if (daysRemaining >= 3) return 'bg-yellow-500 hover:bg-yellow-600'
    return 'bg-red-600 hover:bg-red-700'
  }

  const handleOpenPaymentModal = (contribution: PendingContribution) => {
    setSelectedContribution(contribution)
    setIsPartialPayment(false)
    setPartialAmount('')
    const { hasSavings } = getAmounts(contribution)
    setPaymentType(hasSavings ? 'full' : 'contribution')
  }

  const handleCloseModal = () => {
    setSelectedContribution(null)
    setIsPartialPayment(false)
    setPartialAmount('')
    setPaymentType('full')
  }

  const getPaymentAmount = (): number => {
    if (!selectedContribution) return 0
    
    const { total, remaining, contributionAmount, hasSavings, effectiveSavings } = getAmounts(selectedContribution)
    
    // Partial payment mode - use entered amount
    if (isPartialPayment) {
      const partial = parseInt(partialAmount, 10)
      return isNaN(partial) || partial < 0 ? 0 : partial
    }
    
    // Already has partial payment - pay remaining balance
    if (selectedContribution.amount_paid > 0) {
      return remaining
    }
    
    // Fresh payment - use selected payment type
    if (paymentType === 'full') {
      return total
    }
    return contributionAmount
  }

  const handleSubmitPayment = async () => {
    if (!selectedContribution) return

    const amount = getPaymentAmount()
    if (amount <= 0) {
      addToast({
        variant: 'error',
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
      })
      return
    }

    const { total } = getAmounts(selectedContribution)
    if (amount > total - selectedContribution.amount_paid) {
      addToast({
        variant: 'error',
        title: 'Amount Too High',
        description: `Maximum you can pay is ${formatCurrency(total - selectedContribution.amount_paid)}`,
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
          paid_at: new Date().toISOString(),
          notes: null,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to record contribution')
      }

      // Calculate what this payment covers
      const totalPaidNow = selectedContribution.amount_paid + amount
      const newContributionPaid = Math.min(totalPaidNow, selectedContribution.contribution_amount)
      const newSavingsPaid = Math.max(0, totalPaidNow - selectedContribution.contribution_amount)
      const { total: totalDue } = getAmounts(selectedContribution)
      const newRemaining = totalDue - totalPaidNow
      
      // Build success message
      let description = `Paid ${formatCurrency(amount)}.`
      if (newRemaining > 0) {
        description += ` Remaining: ${formatCurrency(newRemaining)}.`
      } else {
        description += ` Payment complete!`
      }
      description += ` (Contribution: ${formatCurrency(newContributionPaid)}`
      if (newSavingsPaid > 0) {
        description += `, Savings: ${formatCurrency(newSavingsPaid)}`
      }
      description += ')'

      addToast({
        variant: 'success',
        title: newRemaining === 0 ? 'Payment Complete!' : 'Payment Recorded',
        description,
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
    <div className="space-y-3">
      {contributions.map((contrib) => {
        const daysRemaining = getDaysRemaining(contrib.due_date)
        const { hasSavings, effectiveSavings, total, contributionPaid, savingsPaid, remaining, progress, contributionAmount } = getAmounts(contrib)
        const buttonColor = getButtonColor(daysRemaining)
        const isProcessing = processingId === contrib.id
        const hasPartialPayment = contrib.amount_paid > 0

        return (
          <div
            key={contrib.id}
            className="rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-4 hover:shadow-md hover:border-border transition-all"
          >
            {/* Header: Chama name, cycle, due date */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">{contrib.chama_name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="default" className="text-[9px] px-1.5 py-0">
                    {contrib.cycle_name}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">Period {contrib.period_number}</span>
                </div>
              </div>
              <div className={`text-right shrink-0 px-2 py-1 rounded-lg ${
                daysRemaining < 0 ? 'bg-red-50 dark:bg-red-950/30' :
                daysRemaining <= 2 ? 'bg-red-50 dark:bg-red-950/30' :
                daysRemaining <= 4 ? 'bg-yellow-50 dark:bg-yellow-950/30' :
                'bg-green-50 dark:bg-green-950/30'
              }`}>
                <p className={`text-[10px] font-bold ${
                  daysRemaining < 0 ? 'text-red-600 dark:text-red-400' :
                  daysRemaining <= 2 ? 'text-red-600 dark:text-red-400' :
                  daysRemaining <= 4 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {daysRemaining < 0 
                    ? `${Math.abs(daysRemaining)}d late`
                    : daysRemaining === 0
                    ? 'Today'
                    : `${daysRemaining}d left`
                  }
                </p>
              </div>
            </div>

            {/* Amount Display */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <Wallet className="h-4 w-4 text-blue-500" />
                <span className="font-bold">{formatCurrency(contributionAmount)}</span>
              </div>
              {hasSavings && (
                <>
                  <span className="text-muted-foreground">+</span>
                  <div className="flex items-center gap-1">
                    <PiggyBank className="h-4 w-4 text-purple-500" />
                    <span className="font-bold text-purple-600 dark:text-purple-400">{formatCurrency(effectiveSavings)}</span>
                  </div>
                  <span className="text-muted-foreground">=</span>
                  <span className="font-bold text-lg">{formatCurrency(total)}</span>
                </>
              )}
            </div>

            {/* Progress Bar (only if partial payment made) */}
            {hasPartialPayment ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${(contributionPaid / total) * 100}%` }}
                  />
                  {savingsPaid > 0 && (
                    <div 
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${(savingsPaid / total) * 100}%` }}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      <span className="text-blue-600 dark:text-blue-400">{formatCurrency(contributionPaid)}</span>
                      {contributionPaid >= contributionAmount && <CheckCircle2 className="h-3 w-3 text-blue-500" />}
                    </span>
                    {hasSavings && (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                        <span className="text-purple-600 dark:text-purple-400">{formatCurrency(savingsPaid)}</span>
                        {savingsPaid >= effectiveSavings && <CheckCircle2 className="h-3 w-3 text-purple-500" />}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    Left: {formatCurrency(remaining)}
                  </span>
                </div>
                <Button
                  onClick={() => handleOpenPaymentModal(contrib)}
                  disabled={isProcessing}
                  size="sm"
                  className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                >
                  {isProcessing ? <LoadingSpinner size="sm" /> : (
                    <>Clear Balance • {formatCurrency(remaining)}</>
                  )}
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => handleOpenPaymentModal(contrib)}
                disabled={isProcessing}
                size="sm"
                className={`w-full text-white ${buttonColor}`}
              >
                {isProcessing ? <LoadingSpinner size="sm" /> : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Pay {formatCurrency(total)}
                  </>
                )}
              </Button>
            )}
          </div>
        )
      })}

      {/* Payment Modal */}
      {selectedContribution && (() => {
        const { hasSavings, effectiveSavings, total, contributionPaid, savingsPaid, remaining, progress, contributionAmount } = getAmounts(selectedContribution)
        const hasPartialPayment = selectedContribution.amount_paid > 0
        const currentPaymentAmount = getPaymentAmount()
        
        return (
          <Modal open={!!selectedContribution} onOpenChange={(open) => !open && handleCloseModal()}>
            <ModalContent>
              <ModalClose onClose={handleCloseModal} />
              <ModalHeader>
                <ModalTitle>
                  {hasPartialPayment ? 'Complete Payment' : 'Make Payment'}
                </ModalTitle>
              </ModalHeader>
              <div className="space-y-4">
                {/* Chama Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{selectedContribution.chama_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedContribution.cycle_name} • Period {selectedContribution.period_number}
                    </p>
                  </div>
                  <Badge variant="default" className="text-xs">
                    Due {formatDate(selectedContribution.due_date)}
                  </Badge>
                </div>

                {/* Progress Section (only if has partial payment) */}
                {hasPartialPayment && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Already Paid</span>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-500" style={{ width: `${(contributionPaid / total) * 100}%` }} />
                      {savingsPaid > 0 && (
                        <div className="h-full bg-purple-500" style={{ width: `${(savingsPaid / total) * 100}%` }} />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                        <span>Contribution: <strong>{formatCurrency(contributionPaid)}</strong></span>
                      </div>
                      {hasSavings && (
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                          <span>Savings: <strong>{formatCurrency(savingsPaid)}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Breakdown (for fresh payments) */}
                {!hasPartialPayment && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Breakdown</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm">Contribution</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(contributionAmount)}</span>
                      </div>
                      {hasSavings && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                              <PiggyBank className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-sm">Savings</span>
                          </div>
                          <span className="font-semibold text-purple-600">+{formatCurrency(effectiveSavings)}</span>
                        </div>
                      )}
                    </div>
                    {hasSavings && (
                      <div className="pt-2 border-t border-border flex items-center justify-between">
                        <span className="text-sm font-medium">Total</span>
                        <span className="text-lg font-bold">{formatCurrency(total)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Options (only for fresh payments with savings) */}
                {!hasPartialPayment && hasSavings && !isPartialPayment && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Payment Option</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentType('full')}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          paymentType === 'full' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            paymentType === 'full' ? 'border-primary' : 'border-muted-foreground'
                          }`}>
                            {paymentType === 'full' && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <span className="text-sm font-medium">Full Payment</span>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">Contribution + Savings</p>
                        <p className="text-sm font-bold ml-6 mt-1">{formatCurrency(total)}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType('contribution')}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          paymentType === 'contribution' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            paymentType === 'contribution' ? 'border-primary' : 'border-muted-foreground'
                          }`}>
                            {paymentType === 'contribution' && <div className="h-2 w-2 rounded-full bg-primary" />}
                          </div>
                          <span className="text-sm font-medium">Contribution Only</span>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">Skip savings</p>
                        <p className="text-sm font-bold ml-6 mt-1">{formatCurrency(contributionAmount)}</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Partial Payment Toggle (only for fresh payments) */}
                {!hasPartialPayment && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">Custom Amount?</p>
                      <p className="text-xs text-muted-foreground">Pay a different amount</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPartialPayment(!isPartialPayment)
                        setPartialAmount('')
                      }}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        isPartialPayment ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        isPartialPayment ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                )}

                {/* Custom Amount Input */}
                {isPartialPayment && !hasPartialPayment && (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      label="Enter Amount (KES)"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      min={1}
                      max={total}
                      placeholder="Enter amount"
                      disabled={isSubmitting}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      Max: {formatCurrency(total)}
                    </p>
                  </div>
                )}

                {/* Payment Summary */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{hasPartialPayment ? 'Amount to Clear' : "You'll Pay"}</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(currentPaymentAmount)}
                    </span>
                  </div>
                  {!isPartialPayment && !hasPartialPayment && hasSavings && paymentType === 'full' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Includes {formatCurrency(effectiveSavings)} savings
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={handleCloseModal} disabled={isSubmitting} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitPayment}
                    disabled={isSubmitting || currentPaymentAmount <= 0}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4 mr-2" />
                        {hasPartialPayment ? 'Clear Balance' : 'Confirm Payment'}
                      </>
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
