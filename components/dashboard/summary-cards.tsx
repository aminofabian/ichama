import { Users, DollarSign, PiggyBank, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { formatCurrency } from '@/lib/utils/format'

interface SummaryCardsProps {
  activeChamas: number
  totalContributions: number
  savingsBalance: number
  upcomingPayout: {
    amount: number
    scheduledDate: string
    chamaName: string
  } | null
}

export function SummaryCards({
  activeChamas,
  totalContributions,
  savingsBalance,
  upcomingPayout,
}: SummaryCardsProps) {
  const cards = [
    {
      title: 'Active Chamas',
      value: activeChamas.toString(),
      description: 'Chamas you belong to',
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Total Contributed',
      value: formatCurrency(totalContributions),
      description: 'All-time contributions',
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      title: 'Savings Balance',
      value: formatCurrency(savingsBalance),
      description: 'Your savings account',
      icon: PiggyBank,
      color: 'text-purple-500',
    },
    {
      title: 'Upcoming Payout',
      value: upcomingPayout
        ? formatCurrency(upcomingPayout.amount)
        : 'None',
      description: upcomingPayout
        ? `From ${upcomingPayout.chamaName}`
        : 'No scheduled payouts',
      icon: Calendar,
      color: 'text-orange-500',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <CardDescription className="mt-1">{card.description}</CardDescription>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

