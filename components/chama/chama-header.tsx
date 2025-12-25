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
      <div className="rounded-2xl border border-input/50 bg-card p-6 md:p-8 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="relative">
                <h1 className="relative bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-2xl md:text-3xl font-bold tracking-tight text-transparent">
                  {chama.name}
                </h1>
              </div>
              <Badge variant={statusColors[chama.status] || 'default'} className="mt-1">
            {chama.status}
          </Badge>
        </div>
        {chama.description && (
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{chama.description}</p>
        )}
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="relative">
                <div className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#FFD700]/10 to-[#F5E6D3]/10 border border-[#FFD700]/30">
                  <Users className="h-3.5 w-3.5 text-[#FFC700]" />
                  <span className="text-xs font-semibold text-[#FFC700]">
                    {memberCount} {memberCount !== 1 ? 'members' : 'member'}
          </span>
                </div>
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
              className="border-2 border-input/50 hover:border-[#FFD700]/50 transition-all"
            >
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
        {isAdmin && (
          <Link href={`/chamas/${chama.id}/settings`}>
                <Button 
                  variant="primary" 
                  size="sm"
                  className="bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-white shadow-lg shadow-[#FFD700]/25 hover:shadow-xl hover:shadow-[#FFD700]/30 transition-all"
                >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}

