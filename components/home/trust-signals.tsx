import { Eye, Zap, History } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

const signals = [
  {
    icon: Eye,
    title: 'Complete Transparency',
    description:
      'Every transaction is recorded and visible to all members. No hidden fees or surprises.',
  },
  {
    icon: Zap,
    title: 'Automatic Tracking',
    description:
      'Contributions and payouts are tracked automatically. No manual record-keeping needed.',
  },
  {
    icon: History,
    title: 'Complete History',
    description:
      'Access your full financial history anytime. Export records for your records.',
  },
]

export function TrustSignals() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Built for Trust
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Everything you need to run your chama with confidence
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {signals.map((signal) => {
          const Icon = signal.icon
          return (
            <Card key={signal.title}>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{signal.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {signal.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

