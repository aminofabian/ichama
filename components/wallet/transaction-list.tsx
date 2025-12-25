'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils/format'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Gift,
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
} from 'lucide-react'
import type { WalletTransaction } from '@/lib/types/financial'

interface TransactionListProps {
  transactions: WalletTransaction[]
  balance?: number
}

const typeIcons = {
  contribution: ArrowDownCircle,
  payout: Gift,
  savings_credit: TrendingUp,
  savings_debit: TrendingDown,
  fee: CreditCard,
  refund: RefreshCw,
}

const typeLabels = {
  contribution: 'Contribution',
  payout: 'Payout',
  savings_credit: 'Savings Credit',
  savings_debit: 'Savings Debit',
  fee: 'Fee',
  refund: 'Refund',
}

export function TransactionList({ transactions, balance }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <Card className="border-border/50 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Transactions</CardTitle>
          <CardDescription className="text-xs">Your wallet transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-xs text-muted-foreground py-6">
            No transactions found
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Transactions</CardTitle>
            <CardDescription className="text-xs">Your wallet transaction history</CardDescription>
          </div>
          {balance !== undefined && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Wallet Balance</p>
              <p className="text-xl font-bold">{formatCurrency(balance)}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {transactions.map((tx) => {
            const Icon = typeIcons[tx.type] || Wallet
            const isIncoming = tx.direction === 'in'

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isIncoming
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isIncoming ? 'text-green-600' : 'text-red-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-xs">{typeLabels[tx.type]}</p>
                      <Badge variant={isIncoming ? 'success' : 'default'} className="text-[10px] px-1.5 py-0">
                        {isIncoming ? 'In' : 'Out'}
                      </Badge>
                    </div>
                    {tx.description && (
                      <p className="text-xs text-muted-foreground">{tx.description}</p>
                    )}
                    {tx.chama_id && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Chama ID: {tx.chama_id.slice(0, 8)}...
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatRelativeTime(tx.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-bold ${
                      isIncoming ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isIncoming ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDate(tx.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

