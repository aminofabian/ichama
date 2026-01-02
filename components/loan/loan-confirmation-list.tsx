'use client'

import { useState } from 'react'
import { HandCoins, CheckCircle2, XCircle, User, Building2, Shield, UserCheck, Percent, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalClose, ModalFooter } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils/format'
import { formatRelativeTime } from '@/lib/utils/format'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

interface PendingGuarantorLoan {
  loanId: string
  guaranteeId: string
  loanAmount: number
  defaultInterestRate: number
  borrowerName: string
  borrowerPhone: string
  chamaId: string
  chamaName: string
  createdAt: string
}

interface PendingAdminLoan {
  loanId: string
  loanAmount: number
  defaultInterestRate: number
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
  const { addToast } = useToast()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [interestModalOpen, setInterestModalOpen] = useState(false)
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)
  const [interestRate, setInterestRate] = useState('5')
  const [selectedLoanAmount, setSelectedLoanAmount] = useState(0)

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

  const handleAdminApprove = async (loanId: string, action: 'approve' | 'reject', interestRateValue?: number) => {
    try {
      setProcessingId(`admin-${loanId}`)
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
        throw new Error(result.error || 'Failed to approve loan')
      }

      if (action === 'approve') {
        addToast({
          variant: 'success',
          title: 'Loan Approved',
          description: `Loan approved with ${interestRateValue || 0}% interest rate`,
        })
      }

      setInterestModalOpen(false)
      setSelectedLoanId(null)
      setInterestRate('5')
      onUpdate()
    } catch (error) {
      console.error('Approve loan error:', error)
      addToast({
        variant: 'error',
        title: 'Approval Failed',
        description: error instanceof Error ? error.message : 'Failed to approve loan',
      })
    } finally {
      setProcessingId(null)
    }
  }

  const openInterestModal = async (loanId: string, loanAmount: number, chamaId: string) => {
    setSelectedLoanId(loanId)
    setSelectedLoanAmount(loanAmount)
    
    // Fetch chama's default interest rate
    try {
      const response = await fetch(`/api/chamas/${chamaId}`)
      const result = await response.json()
      if (response.ok && result.success) {
        const defaultRate = result.data.chama.default_interest_rate || 0
        setInterestRate(defaultRate.toString())
      } else {
        setInterestRate('5')
      }
    } catch (err) {
      console.error('Failed to fetch chama default interest rate:', err)
      setInterestRate('5')
    }
    
    setInterestModalOpen(true)
  }

  const calculateTotalWithInterest = (amount: number, rate: number) => {
    return amount + (amount * rate / 100)
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
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(loan.loanAmount)}
                      </p>
                      {loan.defaultInterestRate > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground">+</span>
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            {loan.defaultInterestRate}%
                          </span>
                          <span className="text-xs text-muted-foreground">=</span>
                          <p className="text-sm font-bold text-foreground">
                            {formatCurrency(loan.loanAmount + (loan.loanAmount * loan.defaultInterestRate / 100))}
                          </p>
                        </>
                      )}
                    </div>
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
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(loan.loanAmount)}
                        </p>
                        {loan.defaultInterestRate > 0 && (
                          <>
                            <span className="text-xs text-muted-foreground">+</span>
                            <span className="text-xs text-purple-600 dark:text-purple-400">
                              {loan.defaultInterestRate}%
                            </span>
                            <span className="text-xs text-muted-foreground">=</span>
                            <p className="text-sm font-bold text-foreground">
                              {formatCurrency(loan.loanAmount + (loan.loanAmount * loan.defaultInterestRate / 100))}
                            </p>
                          </>
                        )}
                      </div>
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
                      onClick={() => openInterestModal(loan.loanId, loan.loanAmount, loan.chamaId)}
                      disabled={processingId === `admin-${loan.loanId}`}
                      className="h-8 px-3"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Interest Rate Modal */}
      <Modal open={interestModalOpen} onOpenChange={setInterestModalOpen}>
        <ModalContent className="max-w-md">
          <ModalClose onClose={() => {
            setInterestModalOpen(false)
            setSelectedLoanId(null)
            setInterestRate('5')
          }} />
          <ModalHeader className="space-y-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                <Percent className="h-5 w-5 text-white" />
              </div>
              <div>
                <ModalTitle className="text-xl">Set Interest Rate</ModalTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure interest rate for this loan
                </p>
              </div>
            </div>
          </ModalHeader>

          <div className="space-y-6 py-2">
            {/* Loan Amount Display */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <HandCoins className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Loan Amount
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(selectedLoanAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Interest Rate Input */}
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  Interest Rate (%)
                </label>
                <div className="space-y-3">
                  <Input
                    type="number"
                    placeholder="0"
                    value={interestRate}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                        setInterestRate(value)
                      }
                    }}
                    min="0"
                    max="100"
                    step="0.5"
                    autoFocus
                    className="h-12 text-lg font-semibold"
                  />
                  
                  {/* Quick Select Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 5, 10, 15].map((rate) => (
                      <Button
                        key={rate}
                        type="button"
                        variant={interestRate === rate.toString() ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setInterestRate(rate.toString())}
                        className="text-xs"
                      >
                        {rate}%
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interest Calculation Preview */}
              {interestRate && parseFloat(interestRate) > 0 && (
                <div className="rounded-lg border border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                      Interest Calculation
                    </p>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Principal:</span>
                      <span className="font-medium">{formatCurrency(selectedLoanAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest ({interestRate}%):</span>
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {formatCurrency((selectedLoanAmount * parseFloat(interestRate || '0')) / 100)}
                      </span>
                    </div>
                    <div className="h-px bg-border my-1.5" />
                    <div className="flex justify-between">
                      <span className="font-semibold text-foreground">Total to Repay:</span>
                      <span className="font-bold text-lg text-purple-700 dark:text-purple-300">
                        {formatCurrency(calculateTotalWithInterest(selectedLoanAmount, parseFloat(interestRate || '0')))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <ModalFooter className="gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setInterestModalOpen(false)
                setSelectedLoanId(null)
                setInterestRate('5')
              }}
              disabled={processingId !== null}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedLoanId) {
                  handleAdminApprove(selectedLoanId, 'approve', parseFloat(interestRate || '0'))
                }
              }}
              disabled={processingId !== null || !interestRate}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {processingId ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Approving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Loan
                </>
              )}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

