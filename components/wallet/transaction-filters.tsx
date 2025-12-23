'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Filter, X } from 'lucide-react'
import type { WalletTransactionType } from '@/lib/types/financial'

interface TransactionFiltersProps {
  onFilterChange: (filters: TransactionFilters) => void
}

export interface TransactionFilters {
  type?: WalletTransactionType
  chama_id?: string
  start_date?: string
  end_date?: string
}

const transactionTypes: { value: WalletTransactionType; label: string }[] = [
  { value: 'contribution', label: 'Contribution' },
  { value: 'payout', label: 'Payout' },
  { value: 'savings_credit', label: 'Savings Credit' },
  { value: 'savings_debit', label: 'Savings Debit' },
  { value: 'fee', label: 'Fee' },
  { value: 'refund', label: 'Refund' },
]

export function TransactionFilters({ onFilterChange }: TransactionFiltersProps) {
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [isOpen, setIsOpen] = useState(false)

  const handleFilterChange = (key: keyof TransactionFilters, value: string | undefined) => {
    const newFilters = { ...filters }
    if (value && value !== '') {
      newFilters[key] = value as any
    } else {
      delete newFilters[key]
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: TransactionFilters = {}
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Filters</h3>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
            >
              <option value="">All Types</option>
              {transactionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="chama_id">Chama ID</Label>
            <Input
              id="chama_id"
              type="text"
              placeholder="Filter by chama"
              value={filters.chama_id || ''}
              onChange={(e) => handleFilterChange('chama_id', e.target.value || undefined)}
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

