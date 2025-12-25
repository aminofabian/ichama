'use client'

import { useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils/format'
import type { Chama } from '@/lib/types/chama'

interface CycleFormProps {
  chama: Chama
  formData: {
    name: string
    contribution_amount: number | null
    payout_amount: number | null
    savings_amount: number | null
    service_fee: number | null
    frequency: 'weekly' | 'biweekly' | 'monthly' | null
    start_date: string
    total_periods: number | null
  }
  updateField: (field: string, value: unknown) => void
  errors: Record<string, string>
}

export function CycleForm({
  chama,
  formData,
  updateField,
  errors,
}: CycleFormProps) {
  const isSavingsOnly = chama.chama_type === 'savings'
  const isMerryGoRound = chama.chama_type === 'merry_go_round'
  const isHybrid = chama.chama_type === 'hybrid'

  // Calculate total contribution amount based on chama type
  const calculatedTotal = (() => {
    if (isSavingsOnly) {
      return (formData.savings_amount || 0) + (formData.service_fee || 0)
    }
    if (isMerryGoRound) {
      return (formData.payout_amount || 0) + (formData.service_fee || 0)
    }
    // Hybrid
    return (formData.payout_amount || 0) + (formData.savings_amount || 0) + (formData.service_fee || 0)
  })()

  // Auto-update contribution amount when components change
  useEffect(() => {
    if (calculatedTotal > 0 && formData.contribution_amount !== calculatedTotal) {
      updateField('contribution_amount', calculatedTotal)
    }
  }, [formData.payout_amount, formData.savings_amount, formData.service_fee, chama.chama_type])

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
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              💡 Contribution amounts are pre-filled from chama defaults. You can adjust them for this cycle if needed.
            </p>
          </div>
        </div>
      </div>

      {/* Cycle Name */}
      <div className="space-y-1.5">
        <Input
          label="Cycle Name"
          placeholder="e.g., Q1 2024 Savings Cycle"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          required
        />
      </div>

      {/* Frequency and Date Row */}
      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
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

        <div className="space-y-1.5">
          <Input
            type="date"
            label="Start Date"
            value={formData.start_date}
            onChange={(e) => updateField('start_date', e.target.value)}
            error={errors.start_date}
            required
          />
        </div>
      </div>

      {/* Total Periods */}
      <div className="space-y-1.5">
        <Input
          type="number"
          label="Total Periods"
          placeholder="e.g., 12"
          value={formData.total_periods?.toString() || ''}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10)
            updateField('total_periods', isNaN(value) ? null : value)
          }}
          error={errors.total_periods}
          required
        />
        <p className="text-xs text-muted-foreground">
          Number of contribution periods in this cycle
        </p>
      </div>

      {/* Payout Amount - Only for Merry-Go-Round and Hybrid */}
      {!isSavingsOnly && (
        <div className="space-y-1.5">
          <Input
            type="number"
            label="Payout Amount (KES)"
            placeholder="e.g., 1000"
            value={formData.payout_amount?.toString() || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10)
              updateField('payout_amount', isNaN(value) ? null : value)
            }}
            error={errors.payout_amount}
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
            value={formData.savings_amount?.toString() || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10)
              updateField('savings_amount', isNaN(value) ? null : value)
            }}
            error={errors.savings_amount}
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
          value={formData.service_fee?.toString() || ''}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10)
            updateField('service_fee', isNaN(value) ? null : value)
          }}
          error={errors.service_fee}
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
                  {formatCurrency(formData.payout_amount || 0)}
                </p>
              </div>
            )}
            {!isMerryGoRound && (
              <div className="p-3 rounded-lg bg-background/60 border border-border/30">
                <p className="text-muted-foreground text-[10px] mb-1 uppercase tracking-wider">Savings</p>
                <p className="font-bold text-sm text-foreground">
                  {formatCurrency(formData.savings_amount || 0)}
                </p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-background/60 border border-border/30">
              <p className="text-muted-foreground text-[10px] mb-1 uppercase tracking-wider">Service Fee</p>
              <p className="font-bold text-sm text-foreground">
                {formatCurrency(formData.service_fee || 0)}
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

          {errors.contribution_amount && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-[10px] text-destructive font-medium">
                ⚠️ {errors.contribution_amount}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

