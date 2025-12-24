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
    <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="border-border/50 shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-transparent pointer-events-none" />
            <CardContent className="relative p-4 md:p-5">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2.5 md:p-3 ${stat.bgColor} flex-shrink-0`}>
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm md:text-base font-bold truncate">{stat.value}</p>
                    {stat.badge && (
                      <Badge variant={stat.badge === 'active' ? 'success' : 'default'} className="text-[9px] px-1.5 py-0">
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

