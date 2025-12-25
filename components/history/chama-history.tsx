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
      <Card className="border-border/50 shadow-md">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Chama History</CardTitle>
            <CardDescription className="text-xs">Your past and current chamas</CardDescription>
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
    <Card className="border-border/50 shadow-md">
      <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Chama History</CardTitle>
          <CardDescription className="text-xs">Your past and current chamas</CardDescription>
      </CardHeader>
      <CardContent>
          <div className="space-y-2">
          {chamas.map((chama) => (
            <Link
              key={chama.id}
              href={`/chamas/${chama.id}`}
                className="group/item block rounded-lg border border-border/50 bg-gradient-to-br from-card/80 to-card/50 p-2.5 transition-all hover:border-[#FFD700]/50 hover:shadow-md hover:scale-[1.01]"
            >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-semibold text-sm">{chama.name}</h3>
                      <Badge variant={statusColors[chama.status] || 'default'} className="text-[10px]">
                      {chama.status}
                    </Badge>
                      <Badge variant="info" className="text-[10px]">{chamaTypeLabels[chama.chama_type]}</Badge>
                  </div>
                  {chama.description && (
                      <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">{chama.description}</p>
                  )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                      <span>Joined {formatDate(chama.joined_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
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

