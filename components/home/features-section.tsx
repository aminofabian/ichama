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
    <section id="features" className="container mx-auto px-4 py-24 bg-muted/30 -mx-4 sm:mx-0">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Three Ways to Save
        </h2>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Choose the chama type that works best for your group
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Card key={feature.title} className="group relative overflow-hidden border-2 hover:border-primary transition-all duration-300 hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <CardDescription className="text-lg leading-relaxed">
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

