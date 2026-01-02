'use client'

import { useState } from 'react'
import { Building2, Clock, CheckCircle2, XCircle, DollarSign, Calendar, Plus, AlertTriangle, AlertCircle, Wallet, Hourglass, Percent } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalClose, ModalFooter } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { formatCurrency } from '@/lib/utils/format'
import { formatRelativeTime, formatDate } from '@/lib/utils/format'
import { calculateDueDateStatus, calculateLoanBreakdown } from '@/lib/utils/loan-utils'

interface UserLoan {
  loanId: string
  loanAmount: number
  totalLoanAmount: number
  interestRate: number
  interestAmount: number
  status: 'pending' | 'approved' | 'active' | 'paid' | 'defaulted' | 'cancelled'
  chamaId: string
  chamaName: string
  guarantors: Array<{
    id: string
    userName: string
    status: string
  }>
  amountPaid: number
  remainingAmount: number
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

  // Prepare loan data with breakdowns
  const loansWithBreakdown = userLoans.map((loan) => {
    const dueDateStatus = calculateDueDateStatus(loan.dueDate)
    const showDueDate = loan.status === 'active' || loan.status === 'approved'
    const isOverdue = dueDateStatus.isOverdue && (loan.status === 'active' || loan.status === 'approved')
    const breakdown = calculateLoanBreakdown(
      loan.loanAmount,
      loan.interestRate,
      loan.amountPaid,
      loan.dueDate
    )
    const pendingGuarantors = loan.guarantors.filter((g) => g.status === 'pending')
    const approvedGuarantors = loan.guarantors.filter((g) => g.status === 'approved')
    const remainingAmount = breakdown.totalOutstanding
    const canRecordPayment = (loan.status === 'active' || loan.status === 'approved') && remainingAmount > 0

    return {
      ...loan,
      dueDateStatus,
      showDueDate,
      isOverdue,
      breakdown,
      pendingGuarantors,
      approvedGuarantors,
      remainingAmount,
      canRecordPayment,
    }
  })

  return (
    <div className="space-y-4">
      {/* Mobile View - Cards */}
      <div className="block md:hidden space-y-2">
        {loansWithBreakdown.map((loan) => (
          <div
            key={loan.loanId}
            className={`rounded-lg border p-3 space-y-3 ${
              loan.isOverdue
                ? 'border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                : loan.dueDateStatus.urgency === 'soon'
                ? 'border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
                : 'border-border bg-card'
            }`}
          >
            {/* Overdue Banner */}
            {loan.isOverdue && (
              <div className="flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-900/30 px-3 py-2 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                    ⚠️ Loan Overdue
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400">
                    {loan.dueDateStatus.message} • Please make a payment to avoid penalties
                  </p>
                </div>
              </div>
            )}

            {/* Due Soon Warning */}
            {!loan.isOverdue && loan.dueDateStatus.urgency === 'soon' && loan.showDueDate && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 px-3 py-2 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  {loan.dueDateStatus.message}
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
                  <div className="space-y-2">
                    {/* Loan Amount Breakdown */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(loan.breakdown.principal)}
                        </p>
                        <Badge className={`text-xs flex items-center gap-1 ${
                          loan.interestRate > 0 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <Percent className="h-3 w-3" />
                          {loan.interestRate}%
                        </Badge>
                      </div>
                      {loan.interestRate > 0 && (
                        <span className="text-xs text-muted-foreground">
                          + {formatCurrency(loan.breakdown.originalInterest)} interest
                          {loan.status === 'pending' && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">
                              (estimated)
                            </span>
                          )}
                        </span>
                      )}
                      {loan.breakdown.penaltyInterest > 0 && (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          +{formatCurrency(loan.breakdown.penaltyInterest)} penalty ({loan.breakdown.penaltyRate.toFixed(1)}%)
                        </Badge>
                      )}
                    </div>

                    {/* Total Amount Display */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Total:</span>
                      <span className={`text-sm font-semibold ${
                        loan.breakdown.penaltyInterest > 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-foreground'
                      }`}>
                        {formatCurrency(loan.breakdown.penaltyInterest > 0 ? loan.breakdown.totalWithPenalty : loan.breakdown.originalTotal)}
                      </span>
                      {loan.amountPaid > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground">• Paid:</span>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            {formatCurrency(loan.amountPaid)}
                          </span>
                          <span className="text-xs text-muted-foreground">• Remaining:</span>
                          <span className="text-xs font-medium text-foreground">
                            {formatCurrency(loan.breakdown.totalOutstanding)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
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

            {loan.canRecordPayment && (
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
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <div className="border border-border rounded-lg bg-card shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b-2 border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wide border-r border-border/50">
                  Chama
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground/70 uppercase tracking-wide border-r border-border/50">
                  Principal
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground/70 uppercase tracking-wide border-r border-border/50">
                  Interest
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground/70 uppercase tracking-wide border-r border-border/50">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground/70 uppercase tracking-wide border-r border-border/50">
                  Paid
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground/70 uppercase tracking-wide border-r border-border/50">
                  Remaining
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wide border-r border-border/50">
                  Due Date
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground/70 uppercase tracking-wide border-r border-border/50">
                  Actions
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground/70 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loansWithBreakdown.map((loan, index) => (
                <tr
                  key={loan.loanId}
                  className={`border-b border-border/50 transition-colors ${
                    loan.isOverdue
                      ? 'bg-red-50/30 dark:bg-red-950/10'
                      : loan.dueDateStatus.urgency === 'soon' && loan.showDueDate
                      ? 'bg-amber-50/30 dark:bg-amber-950/10'
                      : index % 2 === 0
                      ? 'bg-card'
                      : 'bg-muted/20'
                  } hover:bg-muted/40`}
                >
                  <td className="px-4 py-3 border-r border-border/50">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm text-foreground">{loan.chamaName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right border-r border-border/50">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xs font-medium text-foreground">
                          {formatCurrency(loan.breakdown.principal)}
                        </span>
                        {loan.interestRate > 0 && (
                          <Badge className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 ${
                            loan.interestRate > 0 
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <Percent className="h-2.5 w-2.5" />
                            {loan.interestRate}%
                          </Badge>
                        )}
                      </div>
                      {loan.breakdown.penaltyInterest > 0 && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-[10px] flex items-center gap-0.5 px-1.5 py-0.5">
                          <AlertCircle className="h-2.5 w-2.5" />
                          +{formatCurrency(loan.breakdown.penaltyInterest)}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right border-r border-border/50">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-medium text-foreground">
                        {formatCurrency(loan.breakdown.originalInterest)}
                      </span>
                      {loan.breakdown.penaltyInterest > 0 && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-[10px] px-1.5 py-0.5">
                          +{formatCurrency(loan.breakdown.penaltyInterest)}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right border-r border-border/50">
                    <span className={`text-xs font-semibold ${
                      loan.breakdown.penaltyInterest > 0 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-foreground'
                    }`}>
                      {formatCurrency(loan.breakdown.penaltyInterest > 0 ? loan.breakdown.totalWithPenalty : loan.breakdown.originalTotal)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right border-r border-border/50">
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(loan.amountPaid)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right border-r border-border/50">
                    <span className={`text-xs font-medium ${
                      loan.breakdown.totalOutstanding > 0
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}>
                      {formatCurrency(loan.breakdown.totalOutstanding)}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-r border-border/50">
                    {loan.dueDate ? (
                      <div className="flex items-center gap-1.5">
                        <Calendar className={`h-3.5 w-3.5 ${
                          loan.isOverdue
                            ? 'text-red-600 dark:text-red-400'
                            : loan.dueDateStatus.urgency === 'soon'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground'
                        }`} />
                        <span className={`text-xs ${
                          loan.isOverdue
                            ? 'text-red-600 dark:text-red-400 font-semibold'
                            : loan.dueDateStatus.urgency === 'soon'
                            ? 'text-amber-600 dark:text-amber-400 font-medium'
                            : 'text-muted-foreground'
                        }`}>
                          {!loan.isOverdue ? (
                            loan.dueDateStatus.daysUntil === 0
                              ? 'Due today'
                              : `${loan.dueDateStatus.daysUntil} day${loan.dueDateStatus.daysUntil === 1 ? '' : 's'}`
                          ) : (
                            loan.dueDateStatus.message
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center border-r border-border/50">
                    <div className="flex items-center justify-center gap-2">
                      {loan.canRecordPayment ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLoanId(loan.loanId)
                            setPaymentModalOpen(true)
                          }}
                          className="h-7 text-xs font-medium px-2"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                      ) : loan.pendingPayments && loan.pendingPayments.length > 0 ? (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs px-2 py-0.5">
                          <Clock className="h-3 w-3 mr-1" />
                          {loan.pendingPayments.length}
                        </Badge>
                      ) : loan.status === 'paid' ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Done
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(loan.status)}
                      {getStatusBadge(loan.status)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              if (!loan) return null
              const breakdown = calculateLoanBreakdown(
                loan.loanAmount,
                loan.interestRate,
                loan.amountPaid,
                loan.dueDate
              )
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
                      <div className="space-y-1 pt-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-muted-foreground">Remaining:</span>
                          <span className={`text-lg font-bold ${
                            breakdown.penaltyInterest > 0 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-primary'
                          }`}>
                            {formatCurrency(breakdown.totalOutstanding)}
                          </span>
                        </div>
                        {breakdown.penaltyInterest > 0 && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground line-through">
                              {formatCurrency(breakdown.outstandingAmount)}
                            </span>
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">
                              +{formatCurrency(breakdown.penaltyInterest)} penalty
                            </Badge>
                          </div>
                        )}
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
                  if (!loan) return null
                  const breakdown = calculateLoanBreakdown(
                    loan.loanAmount,
                    loan.interestRate,
                    loan.amountPaid,
                    loan.dueDate
                  )
                  return (
                    <p className="text-xs text-muted-foreground pl-6">
                      Maximum: {formatCurrency(breakdown.totalOutstanding)}
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

