'use client'

import { useEffect, useState } from 'react'
import { HandCoins, DollarSign, User, Calendar, Plus, CheckCircle2, Clock, XCircle, AlertTriangle, AlertCircle, Download, FileSpreadsheet, TrendingUp, TrendingDown, Users, Award, AlertCircle as AlertCircleIcon, Percent } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalClose, ModalFooter } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils/format'
import { formatDate } from '@/lib/utils/format'
import { calculateDueDateStatus, calculateLoanBreakdown } from '@/lib/utils/loan-utils'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import * as XLSX from 'xlsx'

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
  totalLoanAmount: number
  interestRate: number
  interestAmount: number
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
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null)
  const [processingLoanId, setProcessingLoanId] = useState<string | null>(null)
  const [interestModalOpen, setInterestModalOpen] = useState(false)
  const [selectedLoanForApproval, setSelectedLoanForApproval] = useState<{ loanId: string; loanAmount: number } | null>(null)
  const [interestRate, setInterestRate] = useState('0')

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
      setPaymentModalOpen(false)

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

  const handleApproveLoan = async (loanId: string, action: 'approve' | 'reject', interestRateValue?: number) => {
    try {
      setProcessingLoanId(loanId)
      const response = await fetch(`/api/loans/${loanId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          interestRate: action === 'approve' && interestRateValue !== undefined ? interestRateValue : undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Failed to ${action} loan`)
      }

      addToast({
        variant: 'success',
        title: `Loan ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: action === 'approve' 
          ? `Loan approved with ${interestRateValue || 0}% interest rate`
          : 'Loan has been rejected',
      })

      setInterestModalOpen(false)
      setSelectedLoanForApproval(null)
      setInterestRate('0')

      // Refresh loans
      await fetchLoans()
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Action Failed',
        description: err instanceof Error ? err.message : `Failed to ${action} loan`,
      })
    } finally {
      setProcessingLoanId(null)
    }
  }

  const openInterestModal = (loanId: string, loanAmount: number) => {
    setSelectedLoanForApproval({ loanId, loanAmount })
    setInterestModalOpen(true)
  }

  const calculateTotalWithInterest = (principal: number, rate: number): number => {
    return principal + (principal * rate / 100)
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

  const handleDownloadExcel = () => {
    if (loans.length === 0) {
      addToast({
        variant: 'error',
        title: 'No Data',
        description: 'There are no loans to export',
      })
      return
    }

    try {
      const wb = XLSX.utils.book_new()

      // ===== SHEET 1: SUMMARY =====
      const summaryData = [
        ['LOAN PORTFOLIO SUMMARY'],
        [],
        ['Total Loans', loans.length],
        ['Active Loans', loans.filter(l => l.status === 'active' || l.status === 'approved').length],
        ['Paid Loans', loans.filter(l => l.status === 'paid').length],
        ['Pending Loans', loans.filter(l => l.status === 'pending').length],
        ['Defaulted Loans', loans.filter(l => l.status === 'defaulted').length],
        [],
        ['FINANCIAL SUMMARY'],
        [],
        ['Total Loan Amount', loans.reduce((sum, l) => sum + l.loanAmount, 0)],
        ['Total Amount Paid', loans.reduce((sum, l) => sum + l.amountPaid, 0)],
        ['Total Outstanding', loans.reduce((sum, l) => sum + l.remainingAmount, 0)],
        ['Average Loan Amount', Math.round(loans.reduce((sum, l) => sum + l.loanAmount, 0) / loans.length)],
        [],
        ['OVERDUE LOANS'],
        [],
        ['Overdue Count', loans.filter(l => {
          if (!l.dueDate || l.status === 'paid' || l.status === 'cancelled') return false
          const status = calculateDueDateStatus(l.dueDate)
          return status.isOverdue
        }).length],
        ['Overdue Amount', loans.filter(l => {
          if (!l.dueDate || l.status === 'paid' || l.status === 'cancelled') return false
          const status = calculateDueDateStatus(l.dueDate)
          return status.isOverdue
        }).reduce((sum, l) => sum + l.remainingAmount, 0)],
      ]

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
      summaryWs['!cols'] = [{ wch: 25 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

      // ===== SHEET 2: ALL LOANS DETAILED =====
      const loansHeaders = [
        'Loan ID',
        'Borrower Name',
        'Phone',
        'Loan Amount (KES)',
        'Amount Paid (KES)',
        'Remaining (KES)',
        'Status',
        'Due Date',
        'Days Remaining',
        'Guarantors',
        'Created Date',
        'Approved Date',
        'Paid Date',
      ]

      const loansRows = loans.map(loan => {
        const dueDateStatus = calculateDueDateStatus(loan.dueDate)
        const daysRemaining = loan.dueDate && !dueDateStatus.isOverdue 
          ? dueDateStatus.daysUntil 
          : loan.dueDate && dueDateStatus.isOverdue
          ? `-${dueDateStatus.daysOverdue} (Overdue)`
          : 'N/A'

        return [
          loan.loanId,
          loan.borrowerName,
          loan.borrowerPhone || '',
          loan.loanAmount,
          loan.amountPaid,
          loan.remainingAmount,
          loan.status.toUpperCase(),
          loan.dueDate ? formatDate(loan.dueDate) : 'N/A',
          daysRemaining,
          loan.guarantors.map(g => g.userName).join(', ') || 'None',
          formatDate(loan.createdAt),
          loan.approvedAt ? formatDate(loan.approvedAt) : 'N/A',
          loan.paidAt ? formatDate(loan.paidAt) : 'N/A',
        ]
      })

      const loansWs = XLSX.utils.aoa_to_sheet([loansHeaders, ...loansRows])
      loansWs['!cols'] = [
        { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
        { wch: 15 }, { wch: 15 }, { wch: 15 },
      ]
      XLSX.utils.book_append_sheet(wb, loansWs, 'All Loans')

      // ===== SHEET 3: USER SUMMARY =====
      const userMap = new Map<string, {
        name: string
        phone: string
        loans: ChamaLoan[]
        totalBorrowed: number
        totalPaid: number
        totalOutstanding: number
        activeLoans: number
        paidLoans: number
      }>()

      loans.forEach(loan => {
        if (!userMap.has(loan.borrowerId)) {
          userMap.set(loan.borrowerId, {
            name: loan.borrowerName,
            phone: loan.borrowerPhone || '',
            loans: [],
            totalBorrowed: 0,
            totalPaid: 0,
            totalOutstanding: 0,
            activeLoans: 0,
            paidLoans: 0,
          })
        }

        const user = userMap.get(loan.borrowerId)!
        user.loans.push(loan)
        user.totalBorrowed += loan.loanAmount
        user.totalPaid += loan.amountPaid
        user.totalOutstanding += loan.remainingAmount
        if (loan.status === 'active' || loan.status === 'approved') {
          user.activeLoans++
        }
        if (loan.status === 'paid') {
          user.paidLoans++
        }
      })

      const userHeaders = [
        'Borrower Name',
        'Phone',
        'Total Loans',
        'Active Loans',
        'Paid Loans',
        'Total Borrowed (KES)',
        'Total Paid (KES)',
        'Total Outstanding (KES)',
        'Repayment Rate (%)',
      ]

      const userRows = Array.from(userMap.values()).map(user => {
        const repaymentRate = user.totalBorrowed > 0 
          ? ((user.totalPaid / user.totalBorrowed) * 100).toFixed(2)
          : '0.00'

        return [
          user.name,
          user.phone,
          user.loans.length,
          user.activeLoans,
          user.paidLoans,
          user.totalBorrowed,
          user.totalPaid,
          user.totalOutstanding,
          repaymentRate,
        ]
      })

      userRows.sort((a, b) => (b[7] as number) - (a[7] as number))

      const userWs = XLSX.utils.aoa_to_sheet([userHeaders, ...userRows])
      userWs['!cols'] = [
        { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
        { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 15 },
      ]
      XLSX.utils.book_append_sheet(wb, userWs, 'User Summary')

      // ===== SHEET 4: PENDING PAYMENTS =====
      const paymentHeaders = [
        'Payment ID',
        'Loan ID',
        'Borrower Name',
        'Amount (KES)',
        'Payment Method',
        'Reference ID',
        'Status',
        'Recorded By',
        'Date Recorded',
        'Notes',
      ]

      const paymentRows: any[] = []
      loans.forEach(loan => {
        if (loan.pendingPayments && loan.pendingPayments.length > 0) {
          loan.pendingPayments.forEach(payment => {
            paymentRows.push([
              payment.id,
              loan.loanId,
              loan.borrowerName,
              payment.amount,
              payment.paymentMethod || 'N/A',
              payment.referenceId || 'N/A',
              'PENDING',
              payment.recordedBy || 'N/A',
              formatDate(payment.createdAt),
              payment.notes || '',
            ])
          })
        }
      })

      if (paymentRows.length > 0) {
        const paymentWs = XLSX.utils.aoa_to_sheet([paymentHeaders, ...paymentRows])
        paymentWs['!cols'] = [
          { wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
          { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 30 },
        ]
        XLSX.utils.book_append_sheet(wb, paymentWs, 'Pending Payments')
      }

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `Loan_History_${timestamp}.xlsx`

      XLSX.writeFile(wb, filename)

      addToast({
        variant: 'success',
        title: 'Export Successful',
        description: `Loan history exported to ${filename}`,
      })
    } catch (error) {
      console.error('Excel export error:', error)
      addToast({
        variant: 'error',
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export loan history',
      })
    }
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
          <Button
            onClick={handleDownloadExcel}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={loading || loans.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Export to Excel</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>

        {/* Mobile View - Cards */}
        <div className="block md:hidden space-y-3">
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
                      {(() => {
                        const breakdown = calculateLoanBreakdown(
                          loan.loanAmount,
                          loan.interestRate,
                          loan.amountPaid,
                          loan.dueDate
                        )
                        return (
                          <div className="space-y-2">
                            {/* Loan Amount Breakdown */}
                            <div className="flex items-center gap-2 flex-wrap text-sm">
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-foreground">
                                  {formatCurrency(breakdown.principal)}
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
                                  + {formatCurrency(breakdown.originalInterest)} interest
                                </span>
                              )}
                              {breakdown.penaltyInterest > 0 && (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  +{formatCurrency(breakdown.penaltyInterest)} penalty ({breakdown.penaltyRate.toFixed(1)}%)
                                </Badge>
                              )}
                            </div>

                            {/* Total Amount Display */}
                            <div className="flex items-center gap-2 flex-wrap text-sm">
                              {breakdown.penaltyInterest > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Total Due:</span>
                                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(breakdown.totalOutstanding)}
                                  </span>
                                  <span className="text-xs text-muted-foreground line-through">
                                    {formatCurrency(breakdown.outstandingAmount)}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Total:</span>
                                  <span className="text-sm font-semibold text-foreground">
                                    {formatCurrency(breakdown.originalTotal)}
                                  </span>
                                  {loan.amountPaid > 0 && (
                                    <>
                                      <span className="text-xs text-muted-foreground">• Paid:</span>
                                      <span className="text-xs text-green-600 dark:text-green-400">
                                        {formatCurrency(loan.amountPaid)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">• Remaining:</span>
                                      <span className="text-xs font-medium text-foreground">
                                        {formatCurrency(breakdown.outstandingAmount)}
                                      </span>
                                    </>
                                  )}
                                </div>
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
                                  {!isOverdue ? (
                                    <>
                                      {dueDateStatus.daysUntil === 0
                                        ? 'Due today'
                                        : `${dueDateStatus.daysUntil} day${dueDateStatus.daysUntil === 1 ? '' : 's'} remaining`}
                                    </>
                                  ) : (
                                    dueDateStatus.message
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    {loan.guarantors.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {loan.guarantors.length} guarantor{loan.guarantors.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
                </div>

                {/* Approve/Reject Loan Button for Pending Loans */}
                {loan.status === 'pending' && (() => {
                  const hasGuarantors = loan.guarantors.length > 0
                  const allGuarantorsApproved = hasGuarantors && loan.guarantors.every((g) => g.status === 'approved')
                  const pendingGuarantors = loan.guarantors.filter((g) => g.status === 'pending')
                  
                  // Show approve/reject if: no guarantors OR all guarantors approved
                  if (!hasGuarantors || allGuarantorsApproved) {
                    return (
                      <div className="pt-2 border-t">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproveLoan(loan.loanId, 'reject')}
                            disabled={processingLoanId === loan.loanId}
                            className="flex-1"
                          >
                            {processingLoanId === loan.loanId ? (
                              <>
                                <LoadingSpinner size="sm" />
                                <span className="ml-2">Processing...</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openInterestModal(loan.loanId, loan.loanAmount)}
                            disabled={processingLoanId === loan.loanId}
                            className="flex-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2">
                          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <p className="text-xs text-yellow-800 dark:text-yellow-300">
                            Waiting for {pendingGuarantors.length} guarantor{pendingGuarantors.length !== 1 ? 's' : ''} to approve
                          </p>
                        </div>
                      </div>
                    )
                  }
                })()}

                {/* Record Payment Button */}
                {(() => {
                  const loanBreakdown = calculateLoanBreakdown(
                    loan.loanAmount,
                    loan.interestRate,
                    loan.amountPaid,
                    loan.dueDate
                  )
                  return (loan.status === 'active' || loan.status === 'approved') && loanBreakdown.totalOutstanding > 0 ? (
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
                  ) : null
                })()}

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
            </div>
            )
          })}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <div className="border border-border rounded-lg bg-card shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b-2 border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/70 uppercase tracking-wide border-r border-border/50">
                    Borrower
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
                {loans.map((loan, index) => {
                  const dueDateStatus = calculateDueDateStatus(loan.dueDate)
                  const showDueDate = loan.status === 'active' || loan.status === 'approved'
                  const isOverdue = dueDateStatus.isOverdue && showDueDate
                  const breakdown = calculateLoanBreakdown(
                    loan.loanAmount,
                    loan.interestRate,
                    loan.amountPaid,
                    loan.dueDate
                  )

                  return (
                    <tr
                      key={loan.loanId}
                      className={`border-b border-border/50 transition-colors ${
                        isOverdue
                          ? 'bg-red-50/30 dark:bg-red-950/10'
                          : dueDateStatus.urgency === 'soon' && showDueDate
                          ? 'bg-amber-50/30 dark:bg-amber-950/10'
                          : index % 2 === 0
                          ? 'bg-card'
                          : 'bg-muted/20'
                      } hover:bg-muted/40`}
                    >
                      <td className="px-4 py-3 border-r border-border/50">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm text-foreground">{loan.borrowerName}</p>
                            {loan.guarantors.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {loan.guarantors.length} guarantor{loan.guarantors.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right border-r border-border/50">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs font-medium text-foreground">
                              {formatCurrency(breakdown.principal)}
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
                          {breakdown.penaltyInterest > 0 && (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-[10px] flex items-center gap-0.5 px-1.5 py-0.5">
                              <AlertCircle className="h-2.5 w-2.5" />
                              +{formatCurrency(breakdown.penaltyInterest)}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right border-r border-border/50">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-medium text-foreground">
                            {formatCurrency(breakdown.originalInterest)}
                          </span>
                          {breakdown.penaltyInterest > 0 && (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-[10px] px-1.5 py-0.5">
                              +{formatCurrency(breakdown.penaltyInterest)}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right border-r border-border/50">
                        <span className={`text-xs font-semibold ${
                          breakdown.penaltyInterest > 0 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-foreground'
                        }`}>
                          {formatCurrency(breakdown.penaltyInterest > 0 ? breakdown.totalWithPenalty : breakdown.originalTotal)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right border-r border-border/50">
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(loan.amountPaid)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right border-r border-border/50">
                        <span className={`text-xs font-medium ${
                          breakdown.totalOutstanding > 0
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}>
                          {formatCurrency(breakdown.totalOutstanding)}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-r border-border/50">
                        {loan.dueDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className={`h-3.5 w-3.5 ${
                              isOverdue
                                ? 'text-red-600 dark:text-red-400'
                                : dueDateStatus.urgency === 'soon'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-muted-foreground'
                            }`} />
                            <span className={`text-xs ${
                              isOverdue
                                ? 'text-red-600 dark:text-red-400 font-semibold'
                                : dueDateStatus.urgency === 'soon'
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : 'text-muted-foreground'
                            }`}>
                              {!isOverdue ? (
                                dueDateStatus.daysUntil === 0
                                  ? 'Due today'
                                  : `${dueDateStatus.daysUntil} day${dueDateStatus.daysUntil === 1 ? '' : 's'}`
                              ) : (
                                dueDateStatus.message
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center border-r border-border/50">
                        <div className="flex flex-col items-center gap-2">
                          {loan.status === 'pending' && (() => {
                            const hasGuarantors = loan.guarantors && loan.guarantors.length > 0
                            const allGuarantorsApproved = hasGuarantors ? loan.guarantors.every((g) => g.status === 'approved') : true
                            const pendingGuarantors = hasGuarantors ? loan.guarantors.filter((g) => g.status === 'pending') : []
                            
                            // Show approve/reject if: no guarantors OR all guarantors approved
                            if (!hasGuarantors || allGuarantorsApproved) {
                              return (
                                <div className="flex gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveLoan(loan.loanId, 'reject')}
                                    disabled={processingLoanId === loan.loanId}
                                    className="h-7 text-xs font-medium px-2 whitespace-nowrap"
                                  >
                                    {processingLoanId === loan.loanId ? (
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
                                    onClick={() => openInterestModal(loan.loanId, loan.loanAmount)}
                                    disabled={processingLoanId === loan.loanId}
                                    className="h-7 text-xs font-medium px-2 whitespace-nowrap"
                                  >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                </div>
                              )
                            } else {
                              return (
                                <div className="text-center">
                                  <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs px-2 py-0.5">
                                    {pendingGuarantors.length} guarantor{pendingGuarantors.length !== 1 ? 's' : ''} pending
                                  </Badge>
                                </div>
                              )
                            }
                          })()}
                          {(loan.status === 'active' || loan.status === 'approved') && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedLoanId(loan.loanId)
                                  setPaymentModalOpen(true)
                                }}
                                className="h-7 text-xs font-medium px-2 whitespace-nowrap"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Record
                              </Button>
                              {loan.pendingPayments && loan.pendingPayments.length > 0 && (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs px-2 py-0.5">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {loan.pendingPayments.length} pending
                                </Badge>
                              )}
                            </>
                          )}
                          {loan.status !== 'pending' && loan.status !== 'active' && loan.status !== 'approved' && (
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
                  )
                })}
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
              setPaymentNotes('')
            }} />
            <ModalHeader>
              <ModalTitle>Record Payment</ModalTitle>
            </ModalHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="paymentAmount" className="text-sm font-medium text-foreground">
                  Payment Amount (KES)
                </label>
                <Input
                  id="paymentAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="0"
                  step="100"
                  autoFocus
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="paymentNotes" className="text-sm font-medium text-foreground">
                  Notes (Optional)
                </label>
                <Input
                  id="paymentNotes"
                  type="text"
                  placeholder="Payment notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <ModalFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPaymentModalOpen(false)
                  setSelectedLoanId(null)
                  setPaymentAmount('')
                  setPaymentNotes('')
                }}
                disabled={processingPayment}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedLoanId && handlePaymentSubmit(selectedLoanId)}
                disabled={processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                {processingPayment ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Recording...</span>
                  </>
                ) : (
                  'Record Payment'
                )}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Interest Rate Modal for Loan Approval */}
        <Modal open={interestModalOpen} onOpenChange={setInterestModalOpen}>
          <ModalContent className="max-w-md">
            <ModalClose onClose={() => {
              setInterestModalOpen(false)
              setSelectedLoanForApproval(null)
              setInterestRate('0')
            }} />
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                  <Percent className="h-5 w-5 text-white" />
                </div>
                <div>
                  <ModalTitle>Set Interest Rate</ModalTitle>
                  <ModalDescription>
                    Set the interest rate for this loan of {selectedLoanForApproval ? formatCurrency(selectedLoanForApproval.loanAmount) : '0'}.
                  </ModalDescription>
                </div>
              </div>
            </ModalHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="interestRate" className="text-sm font-medium text-foreground">
                  Interest Rate (%)
                </label>
                <Input
                  id="interestRate"
                  type="number"
                  placeholder="e.g., 5"
                  value={interestRate}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                      setInterestRate(value)
                    }
                  }}
                  min="0"
                  max="100"
                  step="0.1"
                  className="h-10 text-base"
                />
              </div>
              <div className="flex gap-2">
                {[0, 5, 10, 15].map((rate) => (
                  <Button
                    key={rate}
                    variant={interestRate === rate.toString() ? 'primary' : 'outline'}
                    onClick={() => setInterestRate(rate.toString())}
                    size="sm"
                    className="flex-1"
                  >
                    {rate}%
                  </Button>
                ))}
              </div>
              {selectedLoanForApproval && interestRate && parseFloat(interestRate) > 0 && (
                <Card className="bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                      Loan Summary
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Principal:</span>
                        <span className="font-medium">{formatCurrency(selectedLoanForApproval.loanAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interest ({interestRate}%):</span>
                        <span className="font-medium">{formatCurrency(selectedLoanForApproval.loanAmount * parseFloat(interestRate) / 100)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-base pt-2 border-t border-purple-200 dark:border-purple-800">
                        <span>Total to Repay:</span>
                        <span className="text-purple-600 dark:text-purple-400">{formatCurrency(calculateTotalWithInterest(selectedLoanForApproval.loanAmount, parseFloat(interestRate)))}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setInterestModalOpen(false)
                  setSelectedLoanForApproval(null)
                  setInterestRate('0')
                }}
                disabled={processingLoanId !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedLoanForApproval) {
                    handleApproveLoan(selectedLoanForApproval.loanId, 'approve', parseFloat(interestRate || '0'))
                  }
                }}
                disabled={processingLoanId !== null || interestRate === '' || parseFloat(interestRate) < 0 || parseFloat(interestRate) > 100}
                loading={processingLoanId !== null}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve Loan
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </CardContent>
    </Card>
  )
}

