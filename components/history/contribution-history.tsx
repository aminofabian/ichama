'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { CheckCircle2, Clock, XCircle, AlertCircle, Calendar } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'

interface ContributionHistoryItem {
  id: string
  cycle_id: string
  cycle_name: string
  chama_name: string
  period_number: number
  amount_due: number
  amount_paid: number
  status: string
  due_date: string
  paid_at: string | null
  created_at: string
}

interface ContributionHistoryProps {
  contributions: ContributionHistoryItem[]
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmed':
      return (
        <Badge variant="success">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Confirmed
        </Badge>
      )
    case 'paid':
      return (
        <Badge variant="info">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Paid
        </Badge>
      )
    case 'partial':
      return (
        <Badge variant="warning">
          <AlertCircle className="mr-1 h-3 w-3" />
          Partial
        </Badge>
      )
    case 'late':
      return (
        <Badge variant="error">
          <Clock className="mr-1 h-3 w-3" />
          Late
        </Badge>
      )
    case 'missed':
      return (
        <Badge variant="error">
          <XCircle className="mr-1 h-3 w-3" />
          Missed
        </Badge>
      )
    default:
      return (
        <Badge variant="default">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      )
  }
}

export function ContributionHistory({ contributions }: ContributionHistoryProps) {
  if (contributions.length === 0) {
    return (
      <Card className="border-border/50 shadow-md">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Contribution History</CardTitle>
            <CardDescription className="text-xs">All your past contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No contributions yet"
            description="Your contribution history will appear here once you start contributing."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-md">
      <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Contribution History</CardTitle>
          <CardDescription className="text-xs">All your past contributions</CardDescription>
      </CardHeader>
      <CardContent>
          <div className="space-y-2">
          {contributions.map((contribution) => (
            <div
              key={contribution.id}
                className="rounded-lg border border-border/50 bg-gradient-to-br from-card/80 to-card/50 p-2.5 hover:border-[#FFD700]/50 hover:shadow-md transition-all"
            >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-sm">{contribution.cycle_name}</h3>
                    {getStatusBadge(contribution.status)}
                  </div>
                    <p className="text-xs text-muted-foreground">
                    {contribution.chama_name} • Period {contribution.period_number}
                  </p>
                </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm">
                    {formatCurrency(contribution.amount_paid)}
                  </p>
                    <p className="text-[10px] text-muted-foreground">
                    of {formatCurrency(contribution.amount_due)}
                  </p>
                </div>
              </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50 flex-wrap">
                <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                  <span>Due: {formatDate(contribution.due_date)}</span>
                </div>
                {contribution.paid_at && (
                  <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span>Paid: {formatDate(contribution.paid_at)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

