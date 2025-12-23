'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Search, Users, TrendingUp, Pause, Play, XCircle, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import { useToast } from '@/components/ui/toast'
import type { Chama } from '@/lib/types/chama'

interface ChamaWithStats extends Chama {
  member_count: number
  cycle_count: number
  active_cycles: number
}

interface ChamasData {
  chamas: ChamaWithStats[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminChamasPage() {
  const { addToast } = useToast()
  const [data, setData] = useState<ChamasData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [updatingChamas, setUpdatingChamas] = useState<Set<string>>(new Set())

  const fetchChamas = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)

      const response = await fetch(`/api/admin/chamas?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch chamas')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chamas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChamas()
  }, [currentPage, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchChamas()
  }

  const handleStatusChange = async (chamaId: string, newStatus: 'active' | 'paused' | 'closed') => {
    setUpdatingChamas((prev) => new Set(prev).add(chamaId))
    try {
      const response = await fetch(`/api/admin/chamas/${chamaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update chama status')
      }

      addToast({
        variant: 'success',
        title: 'Chama Updated',
        description: result.message || 'Chama status updated successfully',
      })

      fetchChamas()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update chama status',
      })
    } finally {
      setUpdatingChamas((prev) => {
        const next = new Set(prev)
        next.delete(chamaId)
        return next
      })
    }
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
        title="Failed to load chamas"
        description={error}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chama Management</h1>
        <p className="text-muted-foreground mt-1">View and monitor all chamas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            <Button type="submit" variant="primary">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Chamas ({data.pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.chamas.length === 0 ? (
              <EmptyState
                title="No chamas found"
                description="Try adjusting your search or filters."
              />
            ) : (
              <div className="space-y-4">
                <div className="divide-y">
                  {data.chamas.map((chama) => {
                    const isUpdating = updatingChamas.has(chama.id)
                    return (
                      <div
                        key={chama.id}
                        className="py-4 flex items-start justify-between gap-4"
                      >
                        <Link
                          href={`/chamas/${chama.id}`}
                          className="flex-1 transition-colors hover:bg-muted -mx-4 px-4 py-2 rounded"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <p className="font-semibold">{chama.name}</p>
                                <Badge
                                  variant={
                                    chama.status === 'active'
                                      ? 'success'
                                      : chama.status === 'paused'
                                        ? 'warning'
                                        : 'default'
                                  }
                                >
                                  {chama.status}
                                </Badge>
                                <Badge variant="info">{chama.chama_type}</Badge>
                              </div>
                              {chama.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {chama.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  <span>{chama.member_count} members</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-4 w-4" />
                                  <span>
                                    {chama.active_cycles} active / {chama.cycle_count} total cycles
                                  </span>
                                </div>
                                <span>Created: {formatDate(chama.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link href={`/chamas/${chama.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Button>
                          </Link>
                          {chama.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                handleStatusChange(chama.id, 'paused')
                              }}
                              disabled={isUpdating}
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </Button>
                          )}
                          {chama.status === 'paused' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                handleStatusChange(chama.id, 'active')
                              }}
                              disabled={isUpdating}
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </Button>
                          )}
                          {chama.status !== 'closed' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                if (
                                  confirm(
                                    `Are you sure you want to close "${chama.name}"? This action cannot be undone.`
                                  )
                                ) {
                                  handleStatusChange(chama.id, 'closed')
                                }
                              }}
                              disabled={isUpdating}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Close
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
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

