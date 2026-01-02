'use client'

import { useState } from 'react'
import { HandCoins, CheckCircle2, XCircle, User, Building2, Shield, UserCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/format'
import { formatRelativeTime } from '@/lib/utils/format'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

interface PendingGuarantorLoan {
  loanId: string
  guaranteeId: string
  loanAmount: number
  borrowerName: string
  borrowerPhone: string
  chamaId: string
  chamaName: string
  createdAt: string
}

interface PendingAdminLoan {
  loanId: string
  loanAmount: number
  borrowerName: string
  borrowerPhone: string
  chamaId: string
  chamaName: string
  guarantors: Array<{
    id: string
    userId: string
    userName: string
    status: string
  }>
  createdAt: string
}

interface LoanConfirmationListProps {
  pendingGuarantorLoans: PendingGuarantorLoan[]
  pendingAdminLoans: PendingAdminLoan[]
  onUpdate: () => void
}

export function LoanConfirmationList({
  pendingGuarantorLoans,
  pendingAdminLoans,
  onUpdate,
}: LoanConfirmationListProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleGuarantorConfirm = async (loanId: string, guaranteeId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(`${loanId}-${guaranteeId}`)
      const response = await fetch(`/api/loans/${loanId}/guarantor/${guaranteeId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to confirm guarantee')
      }

      onUpdate()
    } catch (error) {
      console.error('Confirm guarantee error:', error)
      alert(error instanceof Error ? error.message : 'Failed to confirm guarantee')
    } finally {
      setProcessingId(null)
    }
  }

  const handleAdminApprove = async (loanId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(`admin-${loanId}`)
      const response = await fetch(`/api/loans/${loanId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to approve loan')
      }

      onUpdate()
    } catch (error) {
      console.error('Approve loan error:', error)
      alert(error instanceof Error ? error.message : 'Failed to approve loan')
    } finally {
      setProcessingId(null)
    }
  }

  if (pendingGuarantorLoans.length === 0 && pendingAdminLoans.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {pendingGuarantorLoans.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">
              Pending Guarantor Requests ({pendingGuarantorLoans.length})
            </h3>
          </div>
          {pendingGuarantorLoans.map((loan) => (
            <div
              key={loan.guaranteeId}
              className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 p-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-foreground truncate">{loan.chamaName}</p>
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Guarantor
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-sm text-foreground">{loan.borrowerName}</p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(loan.loanAmount)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGuarantorConfirm(loan.loanId, loan.guaranteeId, 'reject')}
                  disabled={processingId === `${loan.loanId}-${loan.guaranteeId}`}
                  className="h-8 px-3"
                >
                  {processingId === `${loan.loanId}-${loan.guaranteeId}` ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleGuarantorConfirm(loan.loanId, loan.guaranteeId, 'approve')}
                  disabled={processingId === `${loan.loanId}-${loan.guaranteeId}`}
                  className="h-8 px-3"
                >
                  {processingId === `${loan.loanId}-${loan.guaranteeId}` ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingAdminLoans.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HandCoins className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">
              Pending Loan Requests ({pendingAdminLoans.length})
            </h3>
          </div>
          {pendingAdminLoans.map((loan) => {
            const allGuarantorsApproved = loan.guarantors.every((g) => g.status === 'approved')
            const pendingGuarantors = loan.guarantors.filter((g) => g.status === 'pending')

            return (
              <div
                key={loan.loanId}
                className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20 p-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-foreground truncate">{loan.chamaName}</p>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm text-foreground">{loan.borrowerName}</p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(loan.loanAmount)}
                      </p>
                      {!allGuarantorsApproved && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            {pendingGuarantors.length} pending
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {allGuarantorsApproved && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdminApprove(loan.loanId, 'reject')}
                      disabled={processingId === `admin-${loan.loanId}`}
                      className="h-8 px-3"
                    >
                      {processingId === `admin-${loan.loanId}` ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAdminApprove(loan.loanId, 'approve')}
                      disabled={processingId === `admin-${loan.loanId}`}
                      className="h-8 px-3"
                    >
                      {processingId === `admin-${loan.loanId}` ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

