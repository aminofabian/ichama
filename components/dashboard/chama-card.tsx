import Link from 'next/link'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { ArrowRight, Users } from 'lucide-react'
import type { ChamaWithMember } from '@/lib/db/queries/chamas'

interface ChamaCardProps {
  chama: ChamaWithMember
  memberCount?: number
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

export function ChamaCard({ chama, memberCount }: ChamaCardProps) {
  return (
    <Link href={`/chamas/${chama.id}`}>
      <Card className="transition-all hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="mb-2">{chama.name}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">
                  {chamaTypeLabels[chama.chama_type]}
                </Badge>
                <Badge variant={statusColors[chama.status] || 'default'}>
                  {chama.status}
                </Badge>
                <Badge variant="primary">
                  {chama.member_role === 'admin' ? 'Admin' : 'Member'}
                </Badge>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {chama.description && (
            <CardDescription className="mb-4">{chama.description}</CardDescription>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="mr-2 h-4 w-4" />
            <span>{memberCount || 0} members</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

