'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Clock, AlertCircle, Eye, EyeOff, Edit2, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { useToast } from '@/components/ui/toast'
import type { Cycle, CycleMember } from '@/lib/types/cycle'
import type { ChamaType } from '@/lib/types/chama'

interface CycleSummaryProps {
  cycle: Cycle
  cycleMember: CycleMember | null
  chamaType: ChamaType
  cycleId: string
  chamaId: string
}

export function CycleSummary({ cycle, cycleMember, chamaType, cycleId, chamaId }: CycleSummaryProps) {
  const { addToast } = useToast()
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false)
  const [hideSavings, setHideSavings] = useState(cycleMember?.hide_savings ?? 0)
  const [isEditingSavings, setIsEditingSavings] = useState(false)
  const [savingsInput, setSavingsInput] = useState<string>('')
  const [isSavingAmount, setIsSavingAmount] = useState(false)

  const handlePrivacyToggle = async (checked: boolean) => {
    if (!cycleMember) return

    setIsUpdatingPrivacy(true)
    try {
      const response = await fetch(
        `/api/chamas/${chamaId}/cycles/${cycleId}/members/${cycleMember.id}/savings`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hide_savings: checked ? 1 : 0 }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update privacy setting')
      }

      setHideSavings(checked ? 1 : 0)
      addToast({
        variant: 'success',
        title: 'Privacy Updated',
        description: checked
          ? 'Your savings amount is now hidden from other members'
          : 'Your savings amount is now visible to other members',
      })
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsUpdatingPrivacy(false)
    }
  }

  const savingsAmount = cycleMember?.custom_savings_amount ?? cycle.savings_amount
  const isCustom = cycleMember?.custom_savings_amount !== null
  const canEditSavings = cycle.status === 'pending' && (chamaType === 'savings' || chamaType === 'hybrid')

  useEffect(() => {
    if (cycleMember) {
      const currentAmount = cycleMember.custom_savings_amount ?? cycle.savings_amount
      setSavingsInput(currentAmount.toString())
    }
  }, [cycleMember, cycle.savings_amount])

  const handleStartEditSavings = () => {
    if (!cycleMember) return
    const currentAmount = cycleMember.custom_savings_amount ?? cycle.savings_amount
    setSavingsInput(currentAmount.toString())
    setIsEditingSavings(true)
  }

  const handleCancelEditSavings = () => {
    if (cycleMember) {
      const currentAmount = cycleMember.custom_savings_amount ?? cycle.savings_amount
      setSavingsInput(currentAmount.toString())
    }
    setIsEditingSavings(false)
  }

  const handleSaveSavings = async () => {
    if (!cycleMember) return

    const amount = savingsInput.trim() === '' ? null : parseInt(savingsInput, 10)
    
    if (amount !== null && (isNaN(amount) || amount < 0)) {
      addToast({
        variant: 'error',
        title: 'Invalid Amount',
        description: 'Savings amount must be a positive number or empty to use default.',
      })
      return
    }

    setIsSavingAmount(true)
    try {
      const response = await fetch(
        `/api/chamas/${chamaId}/cycles/${cycleId}/members/${cycleMember.id}/savings`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ custom_savings_amount: amount }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update savings amount')
      }

      addToast({
        variant: 'success',
        title: 'Savings Updated',
        description: amount === null 
          ? 'Your savings amount has been reset to the cycle default'
          : 'Your custom savings amount has been updated successfully',
      })

      setIsEditingSavings(false)
      // Refresh the page to show updated value
      window.location.reload()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update savings amount. Please try again.',
      })
    } finally {
      setIsSavingAmount(false)
    }
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Current Cycle</CardTitle>
          <Badge variant={cycle.status === 'active' ? 'default' : 'default'}>
            {cycle.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Period</p>
            <p className="font-medium">
              {cycle.start_date ? formatDate(cycle.start_date) : 'Not started'} - {cycle.end_date ? formatDate(cycle.end_date) : 'TBD'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Current Period</p>
            <p className="font-medium">
              Period {cycle.current_period} of {cycle.total_periods}
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Contribution Amount</span>
          </div>
          <p className="mt-2 text-lg font-semibold">
            {formatCurrency(cycle.contribution_amount)}
          </p>
        </div>

        {chamaType !== 'savings' && (
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">This Period&apos;s Payout</p>
            <p className="text-lg font-semibold">
              {formatCurrency(cycle.payout_amount || 0)}
            </p>
          </div>
        )}

        {cycle.savings_amount > 0 && cycleMember && (
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Your Savings Amount</p>
                {isEditingSavings ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={savingsInput}
                        onChange={(e) => setSavingsInput(e.target.value)}
                        placeholder={cycle.savings_amount.toString()}
                        min={0}
                        className="max-w-[200px]"
                        disabled={isSavingAmount}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveSavings}
                        disabled={isSavingAmount}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditSavings}
                        disabled={isSavingAmount}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use default ({formatCurrency(cycle.savings_amount)})
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-lg font-semibold">{formatCurrency(savingsAmount)}</p>
                    {isCustom && (
                      <Badge variant="info" className="text-xs">
                        Custom
                      </Badge>
                    )}
                    {!isCustom && (
                      <span className="text-xs text-muted-foreground">(Default)</span>
                    )}
                    {canEditSavings && (
                      <button
                        onClick={handleStartEditSavings}
                        className="text-primary hover:text-primary/80 transition-colors p-1 rounded hover:bg-primary/10"
                        title="Edit savings amount"
                        type="button"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-2 flex-1">
                {hideSavings === 1 ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="hide-savings" className="text-sm cursor-pointer">
                  Hide my savings amount from other members
                </Label>
              </div>
              <Switch
                id="hide-savings"
                checked={hideSavings === 1}
                onCheckedChange={handlePrivacyToggle}
                disabled={isUpdatingPrivacy}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {hideSavings === 1
                ? 'Other members will not see your savings amount'
                : 'Other members can see your savings amount'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

