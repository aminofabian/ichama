'use client'

import { useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils/format'
import type { CreateChamaFormData } from '@/lib/hooks/use-create-chama-form'
import { Label } from '@/components/ui/label'

interface StepContributionRulesProps {
  formData: CreateChamaFormData
  updateField: <K extends keyof CreateChamaFormData>(
    field: K,
    value: CreateChamaFormData[K]
  ) => void
  errors: Record<string, string>
}

export function StepContributionRules({
  formData,
  updateField,
  errors,
}: StepContributionRulesProps) {
  const isSavingsOnly = formData.chamaType === 'savings'
  const isMerryGoRound = formData.chamaType === 'merry_go_round'
  const isHybrid = formData.chamaType === 'hybrid'

  // Calculate total contribution amount based on chama type
  const calculatedTotal = (() => {
    if (isSavingsOnly) {
      return (formData.savingsAmount || 0) + (formData.serviceFee || 0)
    }
    if (isMerryGoRound) {
      return (formData.payoutAmount || 0) + (formData.serviceFee || 0)
    }
    // Hybrid
    return (formData.payoutAmount || 0) + (formData.savingsAmount || 0) + (formData.serviceFee || 0)
  })()

  // Auto-update contribution amount when components change
  useEffect(() => {
    if (calculatedTotal > 0 && formData.contributionAmount !== calculatedTotal) {
      updateField('contributionAmount', calculatedTotal)
    }
  }, [formData.payoutAmount, formData.savingsAmount, formData.serviceFee, formData.chamaType])

  // Get contextual description based on chama type
  const getTypeDescription = () => {
    if (isSavingsOnly) {
      return {
        title: 'Savings Chama',
        description: 'Members contribute to build personal savings. No rotating payouts.',
        icon: '💰',
      }
    }
    if (isMerryGoRound) {
      return {
        title: 'Merry-Go-Round',
        description: 'Members contribute to a pool that rotates to each member in turn.',
        icon: '🔄',
      }
    }
    return {
      title: 'Hybrid Chama',
      description: 'Combines rotating payouts with personal savings for each member.',
      icon: '⚡',
    }
  }

  const typeInfo = getTypeDescription()

  return (
    <div className="space-y-5">
      {/* Chama Type Context Banner */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{typeInfo.icon}</span>
          <div>
            <h3 className="font-semibold text-sm text-foreground">{typeInfo.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{typeInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Frequency Selection - First as it's common to all types */}
      <div className="space-y-1.5">
        <Label htmlFor="frequency" className="text-sm font-medium">Contribution Frequency</Label>
        <select
          id="frequency"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
          value={formData.frequency || ''}
          onChange={(e) =>
            updateField(
              'frequency',
              e.target.value as 'weekly' | 'biweekly' | 'monthly' | null
            )
          }
        >
          <option value="">Select frequency</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        {errors.frequency && (
          <p className="text-xs text-destructive">{errors.frequency}</p>
        )}
        <p className="text-xs text-muted-foreground">
          How often members will contribute
        </p>
      </div>

      {/* Payout Amount - Only for Merry-Go-Round and Hybrid */}
      {!isSavingsOnly && (
        <div className="space-y-1.5">
          <Input
            type="number"
            label="Payout Amount (KES)"
            placeholder="e.g., 1000"
            value={formData.payoutAmount?.toString() || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10)
              updateField('payoutAmount', isNaN(value) ? null : value)
            }}
            error={errors.payoutAmount}
            required
          />
          <p className="text-xs text-muted-foreground">
            Amount that goes to the rotating payout pool each period
          </p>
        </div>
      )}

      {/* Savings Amount - Only for Savings and Hybrid */}
      {!isMerryGoRound && (
        <div className="space-y-1.5">
          <Input
            type="number"
            label={isSavingsOnly ? "Savings Amount per Period (KES)" : "Savings Amount (KES)"}
            placeholder="e.g., 500"
            value={formData.savingsAmount?.toString() || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10)
              updateField('savingsAmount', isNaN(value) ? null : value)
            }}
            error={errors.savingsAmount}
            required
          />
          <p className="text-xs text-muted-foreground">
            {isSavingsOnly 
              ? "Amount each member saves per period" 
              : "Additional amount that goes to member's personal savings"}
          </p>
        </div>
      )}

      {/* Service Fee - Common to all types */}
      <div className="space-y-1.5">
        <Input
          type="number"
          label="Service Fee (KES)"
          placeholder="e.g., 30"
          value={formData.serviceFee?.toString() || ''}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10)
            updateField('serviceFee', isNaN(value) ? null : value)
          }}
          error={errors.serviceFee}
        />
        <p className="text-xs text-muted-foreground">
          Platform service fee per contribution (optional)
        </p>
      </div>

      {/* Auto-calculated Contribution Summary */}
      {calculatedTotal > 0 && (
        <div className="rounded-xl border border-border/50 bg-gradient-to-br from-muted/40 to-muted/20 p-4 space-y-3 shadow-sm">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Contribution Breakdown
          </h3>
          
          <div className={`grid gap-2.5 ${isHybrid ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {!isSavingsOnly && (
              <div className="p-3 rounded-lg bg-background/60 border border-border/30">
                <p className="text-muted-foreground text-[10px] mb-1 uppercase tracking-wider">Payout Pool</p>
                <p className="font-bold text-sm text-foreground">
                  {formatCurrency(formData.payoutAmount || 0)}
                </p>
              </div>
            )}
            {!isMerryGoRound && (
              <div className="p-3 rounded-lg bg-background/60 border border-border/30">
                <p className="text-muted-foreground text-[10px] mb-1 uppercase tracking-wider">Savings</p>
                <p className="font-bold text-sm text-foreground">
                  {formatCurrency(formData.savingsAmount || 0)}
                </p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-background/60 border border-border/30">
              <p className="text-muted-foreground text-[10px] mb-1 uppercase tracking-wider">Service Fee</p>
              <p className="font-bold text-sm text-foreground">
                {formatCurrency(formData.serviceFee || 0)}
              </p>
            </div>
          </div>

          {/* Total Contribution - Auto-calculated */}
          <div className="pt-3 border-t border-border/50">
            <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div>
                <span className="text-xs text-muted-foreground block">Total Contribution per {formData.frequency || 'Period'}</span>
                <span className="text-[10px] text-muted-foreground/70">Auto-calculated</span>
              </div>
              <span className="font-bold text-lg text-primary">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
          </div>

          {errors.contributionAmount && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-[10px] text-destructive font-medium">
                ⚠️ {errors.contributionAmount}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

