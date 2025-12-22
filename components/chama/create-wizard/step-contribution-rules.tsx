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
  const total =
    (formData.payoutAmount || 0) +
    (formData.savingsAmount || 0) +
    (formData.serviceFee || 0)

  const hasMismatch =
    formData.contributionAmount !== null &&
    total !== formData.contributionAmount

  return (
    <div className="space-y-6">
      <div>
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
        <p className="mt-1 text-sm text-muted-foreground">
          Amount each member contributes per period
        </p>
      </div>

      <div>
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
          required
        />
        <p className="mt-1 text-sm text-muted-foreground">
          Amount that goes to the rotating payout pool
        </p>
      </div>

      <div>
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
          required
        />
        <p className="mt-1 text-sm text-muted-foreground">
          Amount that goes to member savings
        </p>
      </div>

      <div>
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
        <p className="mt-1 text-sm text-muted-foreground">
          Platform service fee
        </p>
      </div>

      {formData.contributionAmount && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="font-semibold">Breakdown Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Payout</p>
              <p className="font-semibold">
                {formatCurrency(formData.payoutAmount || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Savings</p>
              <p className="font-semibold">
                {formatCurrency(formData.savingsAmount || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Service Fee</p>
              <p className="font-semibold">
                {formatCurrency(formData.serviceFee || 0)}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className={hasMismatch ? 'font-semibold text-destructive' : 'font-semibold'}>
                {formatCurrency(total)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Contribution</span>
              <span className="font-semibold">
                {formatCurrency(formData.contributionAmount)}
              </span>
            </div>
            {hasMismatch && (
              <p className="mt-2 text-xs text-destructive">
                Total breakdown ({formatCurrency(total)}) does not match contribution amount ({formatCurrency(formData.contributionAmount)})
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="frequency">Contribution Frequency</Label>
        <select
          id="frequency"
          className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          <p className="mt-1 text-sm text-destructive">{errors.frequency}</p>
        )}
      </div>
    </div>
  )
}

