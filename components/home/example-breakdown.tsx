'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'

const breakdown = {
  total: 330,
  payout: 300,
  savings: 20,
  fee: 10,
}

const colors = {
  payout: 'bg-blue-500',
  savings: 'bg-green-500',
  fee: 'bg-orange-500',
}

export function ExampleBreakdown() {
  const payoutPercent = (breakdown.payout / breakdown.total) * 100
  const savingsPercent = (breakdown.savings / breakdown.total) * 100
  const feePercent = (breakdown.fee / breakdown.total) * 100

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          See How Your Money Works
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Every contribution is automatically split transparently
        </p>
      </div>
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>KES {breakdown.total} Contribution Breakdown</CardTitle>
            <CardDescription>
              Example of how your contribution is allocated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-4 w-4 rounded ${colors.payout}`} />
                  <span className="font-medium">Payout Amount</span>
                </div>
                <Badge variant="info">KES {breakdown.payout}</Badge>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${colors.payout} transition-all`}
                  style={{ width: `${payoutPercent}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Goes to the recipient member this period
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-4 w-4 rounded ${colors.savings}`} />
                  <span className="font-medium">Savings</span>
                </div>
                <Badge variant="success">KES {breakdown.savings}</Badge>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${colors.savings} transition-all`}
                  style={{ width: `${savingsPercent}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Added to your personal savings account
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-4 w-4 rounded ${colors.fee}`} />
                  <span className="font-medium">Service Fee</span>
                </div>
                <Badge variant="warning">KES {breakdown.fee}</Badge>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${colors.fee} transition-all`}
                  style={{ width: `${feePercent}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Platform maintenance and support
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

