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
      <div className="group relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-xl md:rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
        <Card className="relative rounded-xl md:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-base md:text-lg font-bold">Chama History</CardTitle>
            <CardDescription className="text-xs md:text-sm">Your past and current chamas</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No chamas yet"
              description="You haven't joined any chamas yet. Create or join a chama to get started."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-xl md:rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
      <Card className="relative rounded-xl md:rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-base md:text-lg font-bold">Chama History</CardTitle>
          <CardDescription className="text-xs md:text-sm">Your past and current chamas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chamas.map((chama) => (
              <Link
                key={chama.id}
                href={`/chamas/${chama.id}`}
                className="group/item block rounded-lg border-2 border-border/50 bg-gradient-to-br from-card/80 to-card/50 p-3 md:p-4 transition-all hover:border-primary/50 hover:shadow-md hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-sm md:text-base">{chama.name}</h3>
                      <Badge variant={statusColors[chama.status] || 'default'} className="text-[10px] md:text-xs">
                        {chama.status}
                      </Badge>
                      <Badge variant="info" className="text-[10px] md:text-xs">{chamaTypeLabels[chama.chama_type]}</Badge>
                    </div>
                    {chama.description && (
                      <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 line-clamp-2">{chama.description}</p>
                    )}
                    <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span>Joined {formatDate(chama.joined_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
    </div>
  )
}

