'use client'

import { useState, useEffect } from 'react'
import { HandCoins, Users, AlertCircle, CheckCircle2, X } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'

interface Guarantor {
  id: string
  userId: string
  userName: string
  userPhone: string
  chamaId: string
  chamaName: string
  savingsBalance: number
  loanLimit: number
}

interface Chama {
  id: string
  name: string
}

interface LoanFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  savingsBalance: number
  chamas?: Chama[]
}

const LOAN_LIMIT_THRESHOLD = 2000
const LOAN_LIMIT_MULTIPLIER = 1.1

function calculateLoanLimit(savings: number): number {
  if (savings > LOAN_LIMIT_THRESHOLD) {
    return Math.floor(savings * LOAN_LIMIT_MULTIPLIER)
  }
  return 0
}

export function LoanFormDrawer({
  open,
  onOpenChange,
  savingsBalance,
  chamas = [],
}: LoanFormDrawerProps) {
  const [loanAmount, setLoanAmount] = useState('')
  const [selectedChamaId, setSelectedChamaId] = useState('')
  const [chamaSavingsBalance, setChamaSavingsBalance] = useState(0)
  const [guarantors, setGuarantors] = useState<Guarantor[]>([])
  const [selectedGuarantors, setSelectedGuarantors] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const baseLoanLimit = calculateLoanLimit(chamaSavingsBalance)
  const requestedAmount = parseFloat(loanAmount) || 0

  const selectedGuarantorList = Array.from(selectedGuarantors)
    .map((id) => guarantors.find((g) => g.id === id))
    .filter((g): g is Guarantor => g !== undefined)

  const guarantorContribution = selectedGuarantorList.reduce(
    (sum, guarantor) => sum + guarantor.loanLimit,
    0
  )

  const totalLoanLimit = baseLoanLimit + guarantorContribution
  const needsGuarantors = requestedAmount > baseLoanLimit

  const multiplier = baseLoanLimit > 0
    ? requestedAmount / baseLoanLimit
    : 0

  const minimumGuarantorsNeeded = multiplier > 1 
    ? Math.max(1, Math.floor(multiplier))
    : 0

  useEffect(() => {
    if (open && selectedChamaId) {
      fetchChamaSavings()
      fetchGuarantors()
    } else if (open && !selectedChamaId) {
      setChamaSavingsBalance(0)
      setGuarantors([])
    }
  }, [open, selectedChamaId])

  const fetchChamaSavings = async () => {
    if (!selectedChamaId) return

    try {
      const response = await fetch(`/api/loans/chama-savings?chamaId=${selectedChamaId}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setChamaSavingsBalance(result.data.savingsBalance || 0)
      }
    } catch (err) {
      console.error('Failed to fetch chama savings:', err)
    }
  }

  const fetchGuarantors = async () => {
    if (!selectedChamaId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/loans/guarantors?chamaId=${selectedChamaId}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch guarantors')
      }

      setGuarantors(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load guarantors')
    } finally {
      setLoading(false)
    }
  }

  const handleGuarantorToggle = (guarantorId: string) => {
    const newSelected = new Set(selectedGuarantors)
    if (newSelected.has(guarantorId)) {
      newSelected.delete(guarantorId)
    } else {
      newSelected.add(guarantorId)
    }
    setSelectedGuarantors(newSelected)
  }

  const handleSubmit = async () => {
    if (!selectedChamaId) {
      setError('Please select a chama')
      return
    }

    if (!loanAmount || requestedAmount <= 0) {
      setError('Please enter a valid loan amount')
      return
    }

    if (baseLoanLimit === 0) {
      setError('You need at least 2,000 KES in savings to request a loan')
      return
    }

    if (needsGuarantors && selectedGuarantors.size < minimumGuarantorsNeeded) {
      setError(
        `You need at least ${minimumGuarantorsNeeded} guarantor${minimumGuarantorsNeeded > 1 ? 's' : ''} for this loan amount`
      )
      return
    }

    if (requestedAmount > totalLoanLimit) {
      setError(
        `Loan amount exceeds total limit. Your limit: ${formatCurrency(totalLoanLimit)}`
      )
      return
    }

    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/loans/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: requestedAmount,
          chamaId: selectedChamaId,
          guarantorIds: Array.from(selectedGuarantors),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to request loan')
      }

      onOpenChange(false)
      setLoanAmount('')
      setSelectedGuarantors(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request loan')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setLoanAmount('')
    setSelectedChamaId('')
    setChamaSavingsBalance(0)
    setSelectedGuarantors(new Set())
    setError(null)
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={handleClose} side="right">
      <DrawerContent>
        <DrawerClose onClose={handleClose} />
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
              <HandCoins className="h-5 w-5 text-white" />
            </div>
            <div>
              <DrawerTitle>Request a Loan</DrawerTitle>
              <DrawerDescription>
                Apply for a loan based on your savings balance
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-6">
            {chamas.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Select Chama
                </label>
                <select
                  value={selectedChamaId}
                  onChange={(e) => setSelectedChamaId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Choose a chama...</option>
                  {chamas.map((chama) => (
                    <option key={chama.id} value={chama.id}>
                      {chama.name}
                    </option>
                  ))}
                </select>
                {!selectedChamaId && (
                  <p className="text-xs text-muted-foreground">
                    Please select a chama to see your loan limit
                  </p>
                )}
              </div>
            )}

            {selectedChamaId && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Your Savings in Selected Chama
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(chamaSavingsBalance)}
                      </p>
                      {chamaSavingsBalance === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          No savings in this chama yet
                        </p>
                      )}
                    </div>
                    <div className="h-px bg-border" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Loan Limit
                      </p>
                      {baseLoanLimit > 0 ? (
                        <div className="flex items-center gap-2">
                          <p className="text-2xl font-bold text-foreground">
                            {formatCurrency(totalLoanLimit)}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            (110% of savings{selectedGuarantors.size > 0 ? ' + guarantors' : ''})
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Minimum savings of {formatCurrency(LOAN_LIMIT_THRESHOLD)} required
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedChamaId && (
              <div className="space-y-2">
                <Input
                  label="Loan Amount"
                  type="number"
                  placeholder="Enter amount"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  leftIcon={<HandCoins className="h-4 w-4" />}
                  min="0"
                  step="100"
                />
                {requestedAmount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    You are requesting {formatCurrency(requestedAmount)}
                  </div>
                )}
              </div>
            )}

            {needsGuarantors && (
              <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                        Guarantors Required
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Your loan request is {multiplier > 0 ? `${multiplier}x` : 'over'} your base limit. You need{' '}
                        <span className="font-semibold">
                          {minimumGuarantorsNeeded} guarantor{minimumGuarantorsNeeded > 1 ? 's' : ''}
                        </span>
                        {selectedGuarantors.size > 0 && (
                          <span>
                            {' '}({selectedGuarantors.size} selected)
                          </span>
                        )}
                        .
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(needsGuarantors || selectedGuarantors.size > 0) && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">
                    Select Guarantors ({selectedGuarantors.size} selected)
                  </h3>
                </div>

                {loading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Loading guarantors...
                  </div>
                ) : error && guarantors.length === 0 ? (
                  <div className="text-center py-8 text-sm text-destructive">
                    {error}
                  </div>
                ) : guarantors.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No chama members available as guarantors
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {guarantors.map((guarantor) => {
                      const isSelected = selectedGuarantors.has(guarantor.id)
                      return (
                        <Card
                          key={guarantor.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => handleGuarantorToggle(guarantor.id)}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-foreground">
                                  {guarantor.userName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {guarantor.chamaName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {guarantor.userPhone}
                                </p>
                              </div>
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                                  isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-muted-foreground/30'
                                }`}
                              >
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {error && !needsGuarantors && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !loanAmount || requestedAmount <= 0}
            loading={loading}
          >
            Request Loan
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

