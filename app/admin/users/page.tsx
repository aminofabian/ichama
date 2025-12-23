'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/components/ui/toast'
import { Search, UserCheck, UserX } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import type { User } from '@/lib/types/user'

interface UserListItem extends Omit<User, 'password_hash'> {}

interface UsersData {
  users: UserListItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminUsersPage() {
  const { addToast } = useToast()
  const [data, setData] = useState<UsersData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch users')
      }

      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update user status')
      }

      addToast({
        variant: 'success',
        title: 'User Updated',
        description: result.message || 'User status updated successfully',
      })

      fetchUsers()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update user status',
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
        title="Failed to load users"
        description={error}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">Manage all platform users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, phone, or email..."
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
              <option value="suspended">Suspended</option>
            </select>
            <Button type="submit" variant="primary">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Users ({data.pagination.total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.users.length === 0 ? (
                <EmptyState
                  title="No users found"
                  description="Try adjusting your search or filters."
                />
              ) : (
                <div className="space-y-4">
                  <div className="divide-y">
                    {data.users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between py-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold">{user.full_name}</p>
                            <Badge
                              variant={user.status === 'active' ? 'success' : 'warning'}
                            >
                              {user.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {user.phone_number}
                            {user.email && ` · ${user.email}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined: {formatDate(user.created_at)}
                            {user.last_login_at &&
                              ` · Last login: ${formatDate(user.last_login_at)}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {user.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(user.id, 'suspended')}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Suspend
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleStatusChange(user.id, 'active')}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Activate
                            </Button>
                          )}
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
        </>
      )}
    </div>
  )
}

