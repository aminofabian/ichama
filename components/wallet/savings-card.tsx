'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { TrendingUp, Wallet } from 'lucide-react'
import type { SavingsAccount, SavingsTransaction } from '@/lib/types/financial'

interface SavingsCardProps {
  account: SavingsAccount
  recentTransactions?: SavingsTransaction[]
}

export function SavingsCard({ account, recentTransactions = [] }: SavingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Savings Account
        </CardTitle>
        <CardDescription>Your total savings balance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
          <p className="text-4xl font-bold">{formatCurrency(account.balance || 0)}</p>
        </div>

        {recentTransactions.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Recent Transactions</p>
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      className={`h-4 w-4 ${
                        tx.type === 'credit' ? 'text-green-500' : 'text-red-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium capitalize">{tx.reason}</p>
                      {tx.notes && (
                        <p className="text-xs text-muted-foreground">{tx.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

