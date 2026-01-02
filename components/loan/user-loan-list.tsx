'use client'

import { Building2, Clock, CheckCircle2, XCircle, DollarSign, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/format'
import { formatRelativeTime, formatDate } from '@/lib/utils/format'

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
}

interface UserLoanListProps {
  userLoans: UserLoan[]
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

export function UserLoanList({ userLoans }: UserLoanListProps) {
  if (userLoans.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {userLoans.map((loan) => {
        const pendingGuarantors = loan.guarantors.filter((g) => g.status === 'pending')
        const approvedGuarantors = loan.guarantors.filter((g) => g.status === 'approved')
        const remainingAmount = loan.loanAmount - loan.amountPaid

        return (
          <div
            key={loan.loanId}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
          >
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
                  {loan.dueDate && loan.status === 'active' && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {formatDate(loan.dueDate)}
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
        )
      })}
    </div>
  )
}

