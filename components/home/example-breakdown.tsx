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
    <section className="container mx-auto px-4 py-24 bg-muted/30 -mx-4 sm:mx-0">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          See How Your Money Works
        </h2>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Every contribution is automatically split transparently
        </p>
      </div>
      <div className="mx-auto max-w-3xl">
        <Card className="border-2 shadow-xl">
          <CardHeader className="border-b bg-muted/50">
            <CardTitle className="text-2xl">KES {breakdown.total} Contribution Breakdown</CardTitle>
            <CardDescription className="text-base">
              Example of how your contribution is allocated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-5 w-5 rounded-full ${colors.payout} shadow-md`} />
                  <span className="font-bold text-lg">Payout Amount</span>
                </div>
                <Badge variant="info" className="text-lg px-4 py-1">KES {breakdown.payout}</Badge>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                <div
                  className={`h-full ${colors.payout} transition-all duration-1000 ease-out rounded-full shadow-lg`}
                  style={{ width: `${payoutPercent}%` }}
                />
              </div>
              <p className="text-base text-muted-foreground pl-8">
                Goes to the recipient member this period
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-5 w-5 rounded-full ${colors.savings} shadow-md`} />
                  <span className="font-bold text-lg">Savings</span>
                </div>
                <Badge variant="success" className="text-lg px-4 py-1">KES {breakdown.savings}</Badge>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                <div
                  className={`h-full ${colors.savings} transition-all duration-1000 ease-out rounded-full shadow-lg`}
                  style={{ width: `${savingsPercent}%` }}
                />
              </div>
              <p className="text-base text-muted-foreground pl-8">
                Added to your personal savings account
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`h-5 w-5 rounded-full ${colors.fee} shadow-md`} />
                  <span className="font-bold text-lg">Service Fee</span>
                </div>
                <Badge variant="warning" className="text-lg px-4 py-1">KES {breakdown.fee}</Badge>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                <div
                  className={`h-full ${colors.fee} transition-all duration-1000 ease-out rounded-full shadow-lg`}
                  style={{ width: `${feePercent}%` }}
                />
              </div>
              <p className="text-base text-muted-foreground pl-8">
                Platform maintenance and support
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

