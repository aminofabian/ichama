'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Search, Filter } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'

interface AuditLog {
  id: string
  actor_id: string | null
  actor_type: string
  entity_type: string
  entity_id: string
  action: string
  old_values: string | null
  new_values: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface AuditData {
  logs: AuditLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminAuditPage() {
  const [data, setData] = useState<AuditData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    actor_id: '',
    action: '',
    entity_type: '',
    start_date: '',
    end_date: '',
  })
  const [currentPage, setCurrentPage] = useState(1)

  const fetchAuditLogs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      })
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })

      const response = await fetch(`/api/admin/audit?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch audit logs')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [currentPage])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchAuditLogs()
  }

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <EmptyState
        title="Failed to load audit logs"
        description={error}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Review all platform actions and changes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleApplyFilters} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Actor ID</label>
              <Input
                placeholder="Filter by actor ID"
                value={filters.actor_id}
                onChange={(e) => handleFilterChange('actor_id', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Action</label>
              <Input
                placeholder="Filter by action"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Entity Type</label>
              <Input
                placeholder="e.g., user, chama, cycle"
                value={filters.entity_type}
                onChange={(e) => handleFilterChange('entity_type', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Start Date</label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="primary" className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Logs ({data.pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.logs.length === 0 ? (
              <EmptyState
                title="No audit logs found"
                description="Try adjusting your filters."
              />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {data.logs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-lg border p-4 text-sm space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{log.action}</span>
                          <span className="text-muted-foreground">
                            on {log.entity_type}:{log.entity_id}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Actor: {log.actor_type} {log.actor_id || '(system)'}
                        {log.ip_address && ` · IP: ${log.ip_address}`}
                      </div>
                    </div>
                  ))}
                </div>

                {data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {data.pagination.page} of {data.pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(data.pagination.totalPages, p + 1))
                        }
                        disabled={currentPage === data.pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

