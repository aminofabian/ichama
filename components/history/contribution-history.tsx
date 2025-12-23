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
      <Card>
        <CardHeader>
          <CardTitle>Contribution History</CardTitle>
          <CardDescription>All your past contributions</CardDescription>
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
    <Card>
      <CardHeader>
        <CardTitle>Contribution History</CardTitle>
        <CardDescription>All your past contributions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contributions.map((contribution) => (
            <div
              key={contribution.id}
              className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{contribution.cycle_name}</h3>
                    {getStatusBadge(contribution.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {contribution.chama_name} • Period {contribution.period_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {formatCurrency(contribution.amount_paid)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {formatCurrency(contribution.amount_due)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Due: {formatDate(contribution.due_date)}</span>
                </div>
                {contribution.paid_at && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
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

