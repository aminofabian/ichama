'use client'

import { useState } from 'react'
import { Building2, Clock, CheckCircle2, XCircle, DollarSign, Calendar, Plus, AlertTriangle, AlertCircle, Wallet, Hourglass } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalClose, ModalFooter } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { formatCurrency } from '@/lib/utils/format'
import { formatRelativeTime, formatDate } from '@/lib/utils/format'
import { calculateDueDateStatus } from '@/lib/utils/loan-utils'

interface UserLoan {
  loanId: string
  loanAmount: number
  status: 'pending' | 'approved' | 'active' | 'paid' | 'defaulted' | 'cancelled'
  chamaId: string
  chamaName: string
  guarantors: Array<{
    id: string
    userName: string
    status: string
  }>
  amountPaid: number
  dueDate: string | null
  approvedAt: string | null
  disbursedAt: string | null
  paidAt: string | null
  createdAt: string
  pendingPayments?: Array<{
    paymentId: string
    amount: number
    createdAt: string
  }>
}

interface UserLoanListProps {
  userLoans: UserLoan[]
  onUpdate?: () => void
}

function getStatusBadge(status: UserLoan['status']) {
  const variants: Record<UserLoan['status'], { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    approved: { label: 'Approved', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    active: { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    paid: { label: 'Paid', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
    defaulted: { label: 'Defaulted', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  }

  const variant = variants[status]
  return (
    <Badge className={variant.className}>
      {variant.label}
    </Badge>
  )
}

function getStatusIcon(status: UserLoan['status']) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
    case 'approved':
      return <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    case 'active':
      return <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
    case 'paid':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
    case 'defaulted':
      return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

export function UserLoanList({ userLoans, onUpdate }: UserLoanListProps) {
  const { addToast } = useToast()
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)

  if (userLoans.length === 0) {
    return null
  }

  const handleRecordPayment = async (loanId: string) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      addToast({
        variant: 'error',
        title: 'Invalid Amount',
        description: 'Please enter a valid payment amount',
      })
      return
    }

    try {
      setProcessingPayment(true)
      const response = await fetch(`/api/loans/${loanId}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to record payment')
      }

      // Reset form
      setPaymentAmount('')
      setSelectedLoanId(null)
      setPaymentModalOpen(false)

      addToast({
        variant: 'success',
        title: 'Payment Recorded',
        description: 'Your payment has been recorded and is pending admin approval.',
      })

      // Refresh loans
      if (onUpdate) {
        onUpdate()
      }
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Payment Failed',
        description: err instanceof Error ? err.message : 'Failed to record payment',
      })
    } finally {
      setProcessingPayment(false)
    }
  }

  return (
    <div className="space-y-2">
      {userLoans.map((loan) => {
        const pendingGuarantors = loan.guarantors.filter((g) => g.status === 'pending')
        const approvedGuarantors = loan.guarantors.filter((g) => g.status === 'approved')
        const remainingAmount = loan.loanAmount - loan.amountPaid
        const canRecordPayment = (loan.status === 'active' || loan.status === 'approved') && remainingAmount > 0
        
        // Calculate due date status
        const dueDateStatus = calculateDueDateStatus(loan.dueDate)
        const showDueDate = loan.status === 'active' || loan.status === 'approved'
        const isOverdue = dueDateStatus.isOverdue && showDueDate

        return (
          <div
            key={loan.loanId}
            className={`rounded-lg border p-3 space-y-3 ${
              isOverdue
                ? 'border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                : dueDateStatus.urgency === 'soon'
                ? 'border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
                : 'border-border bg-card'
            }`}
          >
            {/* Overdue Banner */}
            {isOverdue && (
              <div className="flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-900/30 px-3 py-2 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    ⚠️ Loan Overdue
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400">
                    {dueDateStatus.message} • Please make a payment to avoid penalties
                  </p>
                </div>
              </div>
            )}

            {/* Due Soon Warning */}
            {!isOverdue && dueDateStatus.urgency === 'soon' && showDueDate && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 px-3 py-2 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  {dueDateStatus.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getStatusIcon(loan.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium text-sm text-foreground truncate">{loan.chamaName}</p>
                    {getStatusBadge(loan.status)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(loan.loanAmount)}
                    </p>
                    {loan.amountPaid > 0 && (
                      <span className="text-xs text-muted-foreground">
                        • Paid: {formatCurrency(loan.amountPaid)}
                      </span>
                    )}
                    {showDueDate && loan.dueDate && (
                      <span
                        className={`text-xs flex items-center gap-1 ${
                          isOverdue
                            ? 'text-red-600 dark:text-red-400 font-semibold'
                            : dueDateStatus.urgency === 'soon'
                            ? 'text-amber-600 dark:text-amber-400 font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <Calendar className="h-3 w-3" />
                        {formatDate(loan.dueDate)}
                        {isOverdue && (
                          <span className="ml-1">({dueDateStatus.message})</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                {loan.status === 'pending' && pendingGuarantors.length > 0 && (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {pendingGuarantors.length} pending
                  </span>
                )}
                {loan.status === 'pending' && approvedGuarantors.length > 0 && (
                  <span className="text-green-600 dark:text-green-400">
                    {approvedGuarantors.length} approved
                  </span>
                )}
                {loan.status === 'active' && remainingAmount > 0 && (
                  <span className="text-muted-foreground">
                    {formatCurrency(remainingAmount)} left
                  </span>
                )}
              </div>
            </div>

            {/* Pending Payments */}
            {loan.pendingPayments && loan.pendingPayments.length > 0 && (
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Hourglass className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Pending Payments ({loan.pendingPayments.length})
                  </p>
                </div>
                {loan.pendingPayments.map((payment) => (
                  <div
                    key={payment.paymentId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-2.5"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Awaiting admin approval
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                      Pending
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {canRecordPayment && (
              <div className="pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedLoanId(loan.loanId)
                    setPaymentModalOpen(true)
                  }}
                  className="w-full"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Record Payment
                </Button>
              </div>
            )}
          </div>
        )
      })}

      {/* Payment Modal */}
      <Modal open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <ModalContent className="max-w-md">
          <ModalClose onClose={() => {
            setPaymentModalOpen(false)
            setSelectedLoanId(null)
            setPaymentAmount('')
          }} />
          <ModalHeader className="space-y-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <ModalTitle className="text-xl">Record Payment</ModalTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the payment amount to record
                </p>
              </div>
            </div>
          </ModalHeader>
          
          <div className="space-y-6 py-2">
            {selectedLoanId && (() => {
              const loan = userLoans.find(l => l.loanId === selectedLoanId)
              const remaining = (loan?.loanAmount || 0) - (loan?.amountPaid || 0)
              return (
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Loan Details
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {loan?.chamaName}
                      </p>
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-xs text-muted-foreground">Remaining:</span>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(remaining)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Payment Amount (KES)
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="0"
                  step="100"
                  autoFocus
                  className="h-12 text-lg font-semibold"
                />
                {selectedLoanId && (() => {
                  const loan = userLoans.find(l => l.loanId === selectedLoanId)
                  const remaining = (loan?.loanAmount || 0) - (loan?.amountPaid || 0)
                  return (
                    <p className="text-xs text-muted-foreground pl-6">
                      Maximum: {formatCurrency(remaining)}
                    </p>
                  )
                })()}
              </div>
            </div>
          </div>

          <ModalFooter className="gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setPaymentModalOpen(false)
                setSelectedLoanId(null)
                setPaymentAmount('')
              }}
              disabled={processingPayment}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedLoanId && handleRecordPayment(selectedLoanId)}
              disabled={processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              {processingPayment ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Record Payment
                </>
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

