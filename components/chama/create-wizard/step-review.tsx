'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/format'
import type { CreateChamaFormData } from '@/lib/hooks/use-create-chama-form'

interface StepReviewProps {
  formData: CreateChamaFormData
  onEdit: (step: number) => void
}

const chamaTypeLabels = {
  savings: 'Savings',
  merry_go_round: 'Merry-go-round',
  hybrid: 'Hybrid',
}

const frequencyLabels = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
}

export function StepReview({ formData, onEdit }: StepReviewProps) {
  return (
    <div className="space-y-3">
      <Card className="border-border/50 shadow-sm hover:shadow-md transition-all hover:border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
          <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
          <button
            onClick={() => onEdit(1)}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
          >
            Edit
          </button>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-0 px-4 pb-4">
          <div>
            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Name</p>
            <p className="font-semibold text-sm">{formData.name}</p>
          </div>
          {formData.description && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Description</p>
              <p className="font-medium text-xs text-foreground/80">{formData.description}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Privacy</p>
            <Badge variant={formData.isPrivate ? 'default' : 'info'} className="mt-1 text-xs">
              {formData.isPrivate ? 'Private' : 'Public'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm hover:shadow-md transition-all hover:border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
          <CardTitle className="text-sm font-semibold">Chama Type</CardTitle>
          <button
            onClick={() => onEdit(2)}
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
          >
            Edit
          </button>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-4">
          <Badge variant="info" className="text-xs px-2.5 py-1">
            {formData.chamaType
              ? chamaTypeLabels[formData.chamaType]
              : 'Not selected'}
          </Badge>
        </CardContent>
      </Card>

      {formData.contributionAmount && (
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-all hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-semibold">Contribution Rules</CardTitle>
            <button
              onClick={() => onEdit(3)}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md hover:bg-primary/10"
            >
              Edit
            </button>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
            <div>
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Contribution Amount</p>
                <p className="font-bold text-sm">
                {formatCurrency(formData.contributionAmount)}
              </p>
            </div>
            <div>
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Frequency</p>
                <p className="font-semibold text-sm">
                {formData.frequency
                  ? frequencyLabels[formData.frequency]
                  : 'Not selected'}
              </p>
            </div>
            </div>
            <div className="mt-2 rounded-lg border border-border/50 bg-gradient-to-br from-muted/40 to-muted/20 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Breakdown</p>
              <div className={`grid gap-2 ${formData.chamaType === 'hybrid' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {formData.chamaType !== 'savings' && (
                  <div className="p-2 rounded-lg bg-background/60 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">Payout</p>
                    <p className="font-bold text-xs">
                      {formatCurrency(formData.payoutAmount || 0)}
                    </p>
                  </div>
                )}
                {formData.chamaType !== 'merry_go_round' && (
                  <div className="p-2 rounded-lg bg-background/60 border border-border/30">
                    <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">Savings</p>
                    <p className="font-bold text-xs">
                      {formatCurrency(formData.savingsAmount || 0)}
                    </p>
                  </div>
                )}
                <div className="p-2 rounded-lg bg-background/60 border border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wider">Service Fee</p>
                  <p className="font-bold text-xs">
                    {formatCurrency(formData.serviceFee || 0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

