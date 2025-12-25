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
    <Card className="border-border/50 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4 text-[#FFC700]" />
          Savings Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-2xl md:text-3xl font-bold">{formatCurrency(account.balance || 0)}</p>
        </div>

        {recentTransactions.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium mb-2">Recent Transactions</p>
            <div className="space-y-2">
              {recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      className={`h-3.5 w-3.5 ${
                        tx.type === 'credit' ? 'text-green-500' : 'text-red-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium capitalize text-xs">{tx.reason}</p>
                      {tx.notes && (
                        <p className="text-[10px] text-muted-foreground">{tx.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold text-xs ${
                        tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
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

