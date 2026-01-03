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
    <section className="container mx-auto px-4 py-24">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Built for Trust
        </h2>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Everything you need to run your chama with confidence
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {signals.map((signal, index) => {
          const Icon = signal.icon
          return (
            <Card key={signal.title} className="group relative overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">{signal.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-lg leading-relaxed">
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

