'use client'

import { Users, Calendar, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Chama } from '@/lib/types/chama'

interface InvitePreviewProps {
  chama: Chama & { memberCount: number }
  inviter: { id: string; full_name: string } | null
  onJoin: () => void
  isJoining?: boolean
  isLoggedIn: boolean
}

const chamaTypeLabels = {
  savings: 'Savings',
  merry_go_round: 'Merry-go-round',
  hybrid: 'Hybrid',
}

export function InvitePreview({
  chama,
  inviter,
  onJoin,
  isJoining = false,
  isLoggedIn,
}: InvitePreviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">{chama.name}</CardTitle>
          <Badge variant={chama.is_private ? 'default' : 'info'}>
            {chama.is_private ? 'Private' : 'Public'}
          </Badge>
        </div>
        {chama.description && (
          <CardDescription className="mt-2">{chama.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="font-semibold">{chama.memberCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-semibold">{chamaTypeLabels[chama.chama_type]}</p>
            </div>
          </div>
        </div>

        {inviter && (
          <div className="rounded-lg border p-3 bg-muted/50">
            <p className="text-sm text-muted-foreground">Invited by</p>
            <p className="font-medium">{inviter.full_name}</p>
          </div>
        )}

        <Button
          className="w-full"
          onClick={onJoin}
          disabled={isJoining}
        >
          {isJoining ? 'Joining...' : isLoggedIn ? 'Join Chama' : 'Sign Up to Join'}
        </Button>
      </CardContent>
    </Card>
  )
}

