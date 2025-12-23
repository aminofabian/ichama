'use client'

import Link from 'next/link'
import { Settings, Users, Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Chama } from '@/lib/types/chama'

interface ChamaHeaderProps {
  chama: Chama
  memberCount: number
  isAdmin: boolean
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

export function ChamaHeader({ chama, memberCount, isAdmin }: ChamaHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{chama.name}</h1>
          <Badge variant={statusColors[chama.status] || 'default'}>
            {chama.status}
          </Badge>
        </div>
        {chama.description && (
          <p className="mt-1 text-muted-foreground">{chama.description}</p>
        )}
        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>
          <Badge variant="info">{chamaTypeLabels[chama.chama_type]}</Badge>
          <Badge variant={chama.is_private ? 'default' : 'info'}>
            {chama.is_private ? 'Private' : 'Public'}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
        {isAdmin && (
          <Link href={`/chamas/${chama.id}/settings`}>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

