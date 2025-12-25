'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChamaCard } from '@/components/dashboard/chama-card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, Users, TrendingUp, Grid, List } from 'lucide-react'
import type { ChamaWithMember } from '@/lib/db/queries/chamas'

interface ChamaStat {
  chamaId: string
  chamaName: string
  chamaType: 'savings' | 'merry_go_round' | 'hybrid'
  contributionPaid: number
  savingsPaid: number
  totalPaid: number
  actualSavings: number
}

interface DashboardData {
  chamas: ChamaWithMember[]
  chamaStats?: ChamaStat[]
}

type ViewMode = 'grid' | 'list'
type SortOption = 'name' | 'recent' | 'members' | 'activity'

export default function ChamasPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/user/dashboard')
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

    fetchData()
  }, [])

  useEffect(() => {
    const fetchMemberCounts = async () => {
      if (!data?.chamas) return

      const counts: Record<string, number> = {}
      for (const chama of data.chamas) {
        try {
          const response = await fetch(`/api/chamas/${chama.id}/members`)
          if (response.ok) {
            const memberData = await response.json()
            counts[chama.id] = memberData.data?.members?.length || 0
          }
        } catch (error) {
          console.error(`Failed to fetch members for chama ${chama.id}:`, error)
        }
      }
      setMemberCounts(counts)
    }

    if (data?.chamas) {
      fetchMemberCounts()
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-[#FFD700]/5 blur-3xl animate-pulse" />
          <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-[#F5E6D3]/10 blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-[#FFD700]/5 blur-3xl animate-pulse" />
          <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-[#F5E6D3]/10 blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-[400px] px-4">
          <EmptyState
            title="Failed to load chamas"
            description={error}
          />
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const getSavingsForChama = (chamaId: string): number => {
    const stat = data.chamaStats?.find((s) => s.chamaId === chamaId)
    return stat?.actualSavings || 0
  }

  const filteredChamas = data.chamas.filter((chama) => {
    const matchesSearch = chama.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chama.description && chama.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || chama.status === statusFilter
    const matchesType = typeFilter === 'all' || chama.chama_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const sortedChamas = [...filteredChamas].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'members':
        return (memberCounts[b.id] || 0) - (memberCounts[a.id] || 0)
      case 'activity':
        return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const activeChamas = data.chamas.filter((c) => c.status === 'active').length
  const totalMembers = Object.values(memberCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20 md:pb-8">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-[#FFD700]/5 blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-[#F5E6D3]/10 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-3 pt-4 md:px-6 md:pt-8">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">My Chamas</h1>
              <p className="text-muted-foreground">
                Manage and explore all your savings groups
              </p>
            </div>
            <Link href="/chamas/new">
              <Button
                className="bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-lg shadow-[#FFD700]/25 hover:shadow-xl hover:shadow-[#FFD700]/30 transition-all"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Chama
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="rounded-xl border border-border/50 bg-card p-4 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#FFD700]/20 to-[#F5E6D3]/20">
                  <Users className="h-4 w-4 text-[#FFC700]" />
                </div>
                <p className="text-xs text-muted-foreground">Total Chamas</p>
              </div>
              <p className="text-2xl font-bold">{data.chamas.length}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <p className="text-2xl font-bold">{activeChamas}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
              <p className="text-2xl font-bold">{totalMembers}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-4 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <Filter className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-xs text-muted-foreground">Filtered</p>
              </div>
              <p className="text-2xl font-bold">{sortedChamas.length}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search chamas by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-input/50 bg-background/50 backdrop-blur-sm transition-all focus-visible:border-[#FFD700]/50 focus-visible:bg-background focus-visible:shadow-lg focus-visible:shadow-[#FFD700]/10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-12 px-4 rounded-xl border border-input/50 bg-background/50 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/50"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-12 px-4 rounded-xl border border-input/50 bg-background/50 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/50"
                >
                  <option value="all">All Types</option>
                  <option value="savings">Savings</option>
                  <option value="merry_go_round">Merry-go-round</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-12 px-4 rounded-xl border border-input/50 bg-background/50 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/50"
                >
                  <option value="recent">Most Recent</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="members">Most Members</option>
                  <option value="activity">Most Active</option>
                </select>
                <div className="flex rounded-xl border border-input/50 bg-background/50 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-[#FFD700] text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'list'
                        ? 'bg-[#FFD700] text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chamas List/Grid */}
        <div className="space-y-6">
          {sortedChamas.length === 0 ? (
            <EmptyState
              title={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'No chamas found' : 'No chamas yet'}
              description={
                searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filters to find chamas.'
                  : 'Create your first chama or join an existing one to get started.'
              }
              action={
                !searchQuery && statusFilter === 'all' && typeFilter === 'all'
                  ? {
                      label: 'Create Chama',
                      onClick: () => (window.location.href = '/chamas/new'),
                    }
                  : undefined
              }
            />
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
                  : 'space-y-4'
              }
            >
              {sortedChamas.map((chama) => (
                <ChamaCard
                  key={chama.id}
                  chama={chama}
                  memberCount={memberCounts[chama.id]}
                  savingsAmount={getSavingsForChama(chama.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

