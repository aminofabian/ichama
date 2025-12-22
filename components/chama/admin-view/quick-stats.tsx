'use client'

import { Users, TrendingUp, PiggyBank, Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/format'
import type { Cycle } from '@/lib/types/cycle'

interface QuickStatsProps {
  totalMembers: number
  activeCycle: Cycle | null
  collectionRate: number
  savingsPot: number
}

export function QuickStats({
  totalMembers,
  activeCycle,
  collectionRate,
  savingsPot,
}: QuickStatsProps) {
  const stats = [
    {
      label: 'Total Members',
      value: totalMembers.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Cycle Status',
      value: activeCycle ? `Period ${activeCycle.current_period}/${activeCycle.total_periods}` : 'No Active Cycle',
      icon: Activity,
      color: activeCycle ? 'text-green-600' : 'text-gray-600',
      bgColor: activeCycle ? 'bg-green-100' : 'bg-gray-100',
      badge: activeCycle?.status,
    },
    {
      label: 'Collection Rate',
      value: `${collectionRate}%`,
      icon: TrendingUp,
      color: collectionRate >= 80 ? 'text-green-600' : collectionRate >= 50 ? 'text-yellow-600' : 'text-red-600',
      bgColor: collectionRate >= 80 ? 'bg-green-100' : collectionRate >= 50 ? 'bg-yellow-100' : 'bg-red-100',
    },
    {
      label: 'Savings Pot',
      value: formatCurrency(savingsPot),
      icon: PiggyBank,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-semibold">{stat.value}</p>
                    {stat.badge && (
                      <Badge variant={stat.badge === 'active' ? 'success' : 'default'} className="text-xs">
                        {stat.badge}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

