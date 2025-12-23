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
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Your wallet transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No transactions found
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Your wallet transaction history</CardDescription>
          </div>
          {balance !== undefined && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
              <p className="text-2xl font-bold">{formatCurrency(balance)}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => {
            const Icon = typeIcons[tx.type] || Wallet
            const isIncoming = tx.direction === 'in'

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isIncoming
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isIncoming ? 'text-green-600' : 'text-red-600'
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{typeLabels[tx.type]}</p>
                      <Badge variant={isIncoming ? 'success' : 'default'} className="text-xs">
                        {isIncoming ? 'In' : 'Out'}
                      </Badge>
                    </div>
                    {tx.description && (
                      <p className="text-sm text-muted-foreground">{tx.description}</p>
                    )}
                    {tx.chama_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Chama ID: {tx.chama_id.slice(0, 8)}...
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(tx.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
                      isIncoming ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isIncoming ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
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

