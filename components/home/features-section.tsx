import { PiggyBank, RotateCcw, Layers } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

const features = [
  {
    icon: PiggyBank,
    title: 'Savings',
    description:
      'Build your savings over time. Members contribute regularly to grow their savings account with no rotating payouts.',
  },
  {
    icon: RotateCcw,
    title: 'Merry-go-round',
    description:
      'Traditional rotating savings. Pooled contributions go to one member per period, rotating through all members.',
  },
  {
    icon: Layers,
    title: 'Hybrid',
    description:
      'Best of both worlds. Combination of rotating payouts and savings, giving members flexibility and growth.',
  },
]

export function FeaturesSection() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Three Ways to Save
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Choose the chama type that works best for your group
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.title}>
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

