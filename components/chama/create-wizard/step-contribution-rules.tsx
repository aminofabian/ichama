'use client'

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

  const total =
    (formData.payoutAmount || 0) +
    (formData.savingsAmount || 0) +
    (formData.serviceFee || 0)

  const hasMismatch =
    formData.contributionAmount !== null &&
    total !== formData.contributionAmount

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Input
          type="number"
          label="Contribution Amount (KES)"
          placeholder="330"
          value={formData.contributionAmount?.toString() || ''}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10)
            updateField('contributionAmount', isNaN(value) ? null : value)
          }}
          error={errors.contributionAmount}
          required
        />
        <p className="text-xs text-muted-foreground">
          Amount each member contributes per period
        </p>
      </div>

      {!isSavingsOnly && (
        <div className="space-y-1.5">
          <Input
            type="number"
            label="Payout Amount (KES)"
            placeholder="Enter payout amount"
            value={formData.payoutAmount?.toString() || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10)
              updateField('payoutAmount', isNaN(value) ? null : value)
            }}
            error={errors.payoutAmount}
            required={!isSavingsOnly}
          />
          <p className="text-xs text-muted-foreground">
            Amount that goes to the rotating payout pool
          </p>
        </div>
      )}

      {!isMerryGoRound && (
        <div className="space-y-1.5">
          <Input
            type="number"
            label="Savings Amount (KES)"
            placeholder="Enter savings amount"
            value={formData.savingsAmount?.toString() || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10)
              updateField('savingsAmount', isNaN(value) ? null : value)
            }}
            error={errors.savingsAmount}
            required={!isMerryGoRound}
          />
          <p className="text-xs text-muted-foreground">
            Amount that goes to member savings
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <Input
          type="number"
          label="Service Fee (KES)"
          placeholder="Enter service fee"
          value={formData.serviceFee?.toString() || ''}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10)
            updateField('serviceFee', isNaN(value) ? null : value)
          }}
          error={errors.serviceFee}
          required
        />
        <p className="text-xs text-muted-foreground">
          Platform service fee
        </p>
      </div>

      {formData.contributionAmount && (
        <div className="rounded-lg border border-border/50 bg-gradient-to-br from-muted/40 to-muted/20 p-3.5 space-y-3 shadow-sm">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-primary" />
            Breakdown Summary
          </h3>
          <div className={`grid gap-2.5 ${isHybrid ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {!isSavingsOnly && (
              <div className="p-2.5 rounded-lg bg-background/60 border border-border/30">
                <p className="text-muted-foreground text-[10px] mb-0.5 uppercase tracking-wider">Payout</p>
                <p className="font-bold text-sm">
                  {formatCurrency(formData.payoutAmount || 0)}
                </p>
              </div>
            )}
            {!isMerryGoRound && (
              <div className="p-2.5 rounded-lg bg-background/60 border border-border/30">
                <p className="text-muted-foreground text-[10px] mb-0.5 uppercase tracking-wider">Savings</p>
                <p className="font-bold text-sm">
                  {formatCurrency(formData.savingsAmount || 0)}
                </p>
              </div>
            )}
            <div className="p-2.5 rounded-lg bg-background/60 border border-border/30">
              <p className="text-muted-foreground text-[10px] mb-0.5 uppercase tracking-wider">Service Fee</p>
              <p className="font-bold text-sm">
                {formatCurrency(formData.serviceFee || 0)}
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-border/50 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total Breakdown</span>
              <span className={hasMismatch ? 'font-bold text-destructive text-sm' : 'font-bold text-sm'}>
                {formatCurrency(total)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Contribution Amount</span>
              <span className="font-bold text-sm">
                {formatCurrency(formData.contributionAmount)}
              </span>
            </div>
            {hasMismatch && (
              <div className="mt-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-[10px] text-destructive font-medium">
                  ⚠️ Total breakdown ({formatCurrency(total)}) does not match contribution amount ({formatCurrency(formData.contributionAmount)})
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
      </div>
    </div>
  )
}

