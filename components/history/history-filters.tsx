'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Filter, X } from 'lucide-react'

interface HistoryFiltersProps {
  chamas: Array<{ id: string; name: string }>
  onFilterChange: (filters: HistoryFilters) => void
}

export interface HistoryFilters {
  chama_id?: string
  status?: string
  start_date?: string
  end_date?: string
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'closed', label: 'Closed' },
]

export function HistoryFilters({ chamas, onFilterChange }: HistoryFiltersProps) {
  const [filters, setFilters] = useState<HistoryFilters>({})

  const handleFilterChange = (key: keyof HistoryFilters, value: string | undefined) => {
    const newFilters = { ...filters }
    if (value && value !== '') {
      newFilters[key] = value
    } else {
      delete newFilters[key]
    }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: HistoryFilters = {}
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <div className="group relative">
      <Card className="relative rounded-xl md:rounded-2xl border border-border/60 bg-card shadow-xl">
        <CardContent className="pt-4 md:pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
              <div className="relative">
                <Filter className="relative h-4 w-4 md:h-5 md:w-5 text-[#FFC700]" />
              </div>
              <h3 className="font-semibold text-sm md:text-base">Filters</h3>
          </div>
          {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="border-2 hover:border-destructive/50 hover:text-destructive transition-all"
              >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="chama" className="text-xs md:text-sm font-medium">Chama</Label>
            <select
              id="chama"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
              value={filters.chama_id || ''}
              onChange={(e) => handleFilterChange('chama_id', e.target.value || undefined)}
            >
              <option value="">All Chamas</option>
              {chamas.map((chama) => (
                <option key={chama.id} value={chama.id}>
                  {chama.name}
                </option>
              ))}
            </select>
          </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs md:text-sm font-medium">Status</Label>
            <select
              id="status"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

            <div className="space-y-1.5">
              <Label htmlFor="start_date" className="text-xs md:text-sm font-medium">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={filters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
            />
          </div>

            <div className="space-y-1.5">
              <Label htmlFor="end_date" className="text-xs md:text-sm font-medium">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={filters.end_date || ''}
              onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  )
}

