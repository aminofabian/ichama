'use client'

import { useState } from 'react'
import { Calendar, CheckCircle, Clock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
              <div>
                <p className="text-sm text-muted-foreground">Your Savings Amount</p>
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
                </div>
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

