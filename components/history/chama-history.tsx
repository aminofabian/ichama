'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Users, Calendar, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import type { ChamaWithMember } from '@/lib/db/queries/chamas'

interface ChamaHistoryProps {
  chamas: ChamaWithMember[]
}

const chamaTypeLabels = {
  savings: 'Savings',
  merry_go_round: 'Merry-go-round',
  hybrid: 'Hybrid',
}

const statusColors = {
  active: 'success',
  paused: 'warning',
  closed: 'default',
} as const

export function ChamaHistory({ chamas }: ChamaHistoryProps) {
  if (chamas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chama History</CardTitle>
          <CardDescription>Your past and current chamas</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No chamas yet"
            description="You haven't joined any chamas yet. Create or join a chama to get started."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chama History</CardTitle>
        <CardDescription>Your past and current chamas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chamas.map((chama) => (
            <Link
              key={chama.id}
              href={`/chamas/${chama.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{chama.name}</h3>
                    <Badge variant={statusColors[chama.status] || 'default'}>
                      {chama.status}
                    </Badge>
                    <Badge variant="info">{chamaTypeLabels[chama.chama_type]}</Badge>
                  </div>
                  {chama.description && (
                    <p className="text-sm text-muted-foreground mb-3">{chama.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDate(chama.joined_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>Role: {chama.member_role === 'admin' ? 'Admin' : 'Member'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

