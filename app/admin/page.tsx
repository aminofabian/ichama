'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Users, Building2, TrendingUp, DollarSign, Activity, UserPlus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'

interface DashboardData {
  totalUsers: number
  activeUsers: number
  recentUsers: number
  totalChamas: number
  recentChamas: number
  activeCycles: number
  totalRevenue: number
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard')
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch dashboard data')
        }

        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <EmptyState
        title="Failed to load dashboard"
        description={error}
      />
    )
  }

  if (!data) {
    return (
      <EmptyState
        title="No data available"
        description="Unable to load dashboard statistics."
      />
    )
  }

  const stats = [
    {
      title: 'Total Users',
      value: data.totalUsers.toLocaleString(),
      description: `${data.activeUsers} active`,
      icon: Users,
      trend: data.recentUsers > 0 ? `+${data.recentUsers} this week` : undefined,
    },
    {
      title: 'Total Chamas',
      value: data.totalChamas.toLocaleString(),
      description: `${data.activeCycles} active cycles`,
      icon: Building2,
      trend: data.recentChamas > 0 ? `+${data.recentChamas} this week` : undefined,
    },
    {
      title: 'Active Cycles',
      value: data.activeCycles.toLocaleString(),
      description: 'Currently running',
      icon: Activity,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      description: 'From service fees',
      icon: DollarSign,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                {stat.trend && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {stat.trend}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Common admin tasks</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>View and manage users</li>
              <li>Monitor chamas and cycles</li>
              <li>Update platform settings</li>
              <li>Review audit logs</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">User Growth</span>
                <span className="text-sm font-semibold text-green-600">
                  {data.recentUsers > 0 ? `+${data.recentUsers}` : '0'} this week
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Chama Growth</span>
                <span className="text-sm font-semibold text-green-600">
                  {data.recentChamas > 0 ? `+${data.recentChamas}` : '0'} this week
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Rate</span>
                <span className="text-sm font-semibold">
                  {data.totalUsers > 0
                    ? Math.round((data.activeUsers / data.totalUsers) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

