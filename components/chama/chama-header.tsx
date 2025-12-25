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
    <div className="relative">
      <div className="rounded-xl border border-input/50 bg-card p-4 md:p-5 shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="relative bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-xl md:text-2xl font-bold tracking-tight text-transparent">
                {chama.name}
              </h1>
              <Badge variant={statusColors[chama.status] || 'default'} className="text-xs">
            {chama.status}
          </Badge>
        </div>
        {chama.description && (
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">{chama.description}</p>
        )}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-[#FFD700]/10 to-[#F5E6D3]/10 border border-[#FFD700]/30">
                  <Users className="h-3 w-3 text-[#FFC700]" />
                  <span className="text-xs font-semibold text-[#FFC700]">
                    {memberCount} {memberCount !== 1 ? 'members' : 'member'}
          </span>
                </div>
              <Badge variant="info" className="text-xs">{chamaTypeLabels[chama.chama_type]}</Badge>
              <Badge variant={chama.is_private ? 'default' : 'info'} className="text-xs">
            {chama.is_private ? 'Private' : 'Public'}
          </Badge>
        </div>
      </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 px-3 border border-input/50 hover:border-[#FFD700]/50 transition-all"
            >
          <Share2 className="h-3.5 w-3.5" />
        </Button>
        {isAdmin && (
          <Link href={`/chamas/${chama.id}/settings`}>
                <Button 
                  variant="primary" 
                  size="sm"
                  className="h-8 px-3 bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-md shadow-[#FFD700]/25 hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all"
                >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}

