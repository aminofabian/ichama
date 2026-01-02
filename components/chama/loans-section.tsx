'use client'

import { useEffect, useState } from 'react'
import { HandCoins, DollarSign, User, Calendar, Plus, CheckCircle2, Clock, XCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/format'
import { calculateDueDateStatus } from '@/lib/utils/loan-utils'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

interface PendingPayment {
  id: string
  amount: number
  paymentMethod: string | null
  referenceId: string | null
  notes: string | null
  recordedBy: string
  createdAt: string
}

interface ChamaLoan {
  loanId: string
  loanAmount: number
  status: 'pending' | 'approved' | 'active' | 'paid' | 'defaulted' | 'cancelled'
  borrowerId: string
  borrowerName: string
  borrowerPhone: string
  guarantors: Array<{
    id: string
    userId: string
    userName: string
    status: string
  }>
  amountPaid: number
  remainingAmount: number
  pendingPayments?: PendingPayment[]
  dueDate: string | null
  approvedAt: string | null
  disbursedAt: string | null
  paidAt: string | null
  createdAt: string
}

interface LoansSectionProps {
  chamaId: string
}

function getStatusBadge(status: ChamaLoan['status']) {
  const variants: Record<ChamaLoan['status'], { label: string; className: string }> = {
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

function getStatusIcon(status: ChamaLoan['status']) {
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

export function LoansSection({ chamaId }: LoansSectionProps) {
  const { addToast } = useToast()
  const [loans, setLoans] = useState<ChamaLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null)

  useEffect(() => {
    fetchLoans()
  }, [chamaId])

  const fetchLoans = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/chamas/${chamaId}/loans`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch loans')
      }

      setLoans(result.data.loans || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loans')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSubmit = async (loanId: string) => {
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
      const response = await fetch(`/api/loans/${loanId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount), // Amounts are stored in KES, not cents
          notes: paymentNotes || null,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to record payment')
      }

      // Reset form
      setPaymentAmount('')
      setPaymentNotes('')
      setSelectedLoanId(null)

      // Show success toast
      // result.data.remainingAmount is already in KES
      addToast({
        variant: 'success',
        title: 'Payment Recorded',
        description: `Payment of ${formatCurrency(parseFloat(paymentAmount))} recorded successfully. Remaining: ${formatCurrency(result.data.remainingAmount || 0)}`,
      })

      // Refresh loans
      await fetchLoans()
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

  const handleApprovePayment = async (paymentId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingPaymentId(paymentId)
      const response = await fetch(`/api/loans/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Failed to ${action} payment`)
      }

      addToast({
        variant: 'success',
        title: `Payment ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: result.data.message,
      })

      // Refresh loans
      await fetchLoans()
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Action Failed',
        description: err instanceof Error ? err.message : `Failed to ${action} payment`,
      })
    } finally {
      setProcessingPaymentId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loans.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <HandCoins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">No loans</p>
            <p className="text-xs text-muted-foreground">There are no loans in this chama yet.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Loans</h3>
            <Badge>{loans.length}</Badge>
          </div>
        </div>

        <div className="space-y-3">
          {loans.map((loan) => {
            const dueDateStatus = calculateDueDateStatus(loan.dueDate)
            const showDueDate = loan.status === 'active' || loan.status === 'approved'
            const isOverdue = dueDateStatus.isOverdue && showDueDate

            return (
              <div
                key={loan.loanId}
                className={`border rounded-lg p-4 space-y-3 ${
                  isOverdue
                    ? 'border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'
                    : dueDateStatus.urgency === 'soon' && showDueDate
                    ? 'border-amber-300 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20'
                    : ''
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
                        {loan.borrowerName}'s loan is {dueDateStatus.message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Due Soon Warning */}
                {!isOverdue && dueDateStatus.urgency === 'soon' && showDueDate && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 px-3 py-2 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                      Due soon: {dueDateStatus.message}
                    </p>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {getStatusIcon(loan.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold text-sm text-foreground">{loan.borrowerName}</p>
                        {getStatusBadge(loan.status)}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <p className="font-semibold text-foreground">
                          {formatCurrency(loan.loanAmount)}
                        </p>
                        {loan.amountPaid > 0 && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              Paid: {formatCurrency(loan.amountPaid)}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-foreground">
                              Remaining: {formatCurrency(loan.remainingAmount)}
                            </span>
                          </>
                        )}
                        {showDueDate && loan.dueDate && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span
                              className={`flex items-center gap-1 ${
                                isOverdue
                                  ? 'text-red-600 dark:text-red-400 font-semibold'
                                  : dueDateStatus.urgency === 'soon'
                                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              <Calendar className="h-3 w-3" />
                              Due: {formatDate(loan.dueDate)}
                              {isOverdue && (
                                <span className="ml-1">({dueDateStatus.message})</span>
                              )}
                              {!isOverdue && dueDateStatus.urgency === 'soon' && (
                                <span className="ml-1">({dueDateStatus.message})</span>
                              )}
                            </span>
                          </>
                      )}
                    </div>
                    {loan.guarantors.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {loan.guarantors.length} guarantor{loan.guarantors.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
                </div>

                {/* Pending Payments Section */}
              {loan.pendingPayments && loan.pendingPayments.length > 0 && (
                <div className="pt-2 border-t space-y-2">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Pending Payments ({loan.pendingPayments.length})
                  </p>
                  {loan.pendingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-2 rounded border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(payment.amount)}
                        </p>
                        {payment.paymentMethod && (
                          <p className="text-xs text-muted-foreground">
                            Method: {payment.paymentMethod}
                          </p>
                        )}
                        {payment.referenceId && (
                          <p className="text-xs text-muted-foreground">
                            Ref: {payment.referenceId}
                          </p>
                        )}
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprovePayment(payment.id, 'reject')}
                          disabled={processingPaymentId === payment.id}
                          className="h-7 px-2"
                        >
                          {processingPaymentId === payment.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprovePayment(payment.id, 'approve')}
                          disabled={processingPaymentId === payment.id}
                          className="h-7 px-2"
                        >
                          {processingPaymentId === payment.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(loan.status === 'active' || loan.status === 'approved') && (
                <div className="pt-3 border-t">
                  {selectedLoanId === loan.loanId ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">
                          Payment Amount (KES)
                        </label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          min="0"
                          step="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">
                          Notes (Optional)
                        </label>
                        <Input
                          type="text"
                          placeholder="Payment notes"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handlePaymentSubmit(loan.loanId)}
                          disabled={processingPayment || !paymentAmount}
                          className="flex-1"
                        >
                          {processingPayment ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span className="ml-2">Recording...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Record Payment
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedLoanId(null)
                            setPaymentAmount('')
                            setPaymentNotes('')
                          }}
                          disabled={processingPayment}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedLoanId(loan.loanId)}
                      className="w-full"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Record Payment
                    </Button>
                  )}
                </div>
              )}
            </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

