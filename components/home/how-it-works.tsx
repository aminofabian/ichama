import { UserPlus, Users, DollarSign, TrendingUp } from 'lucide-react'

const steps = [
  {
    number: 1,
    icon: UserPlus,
    title: 'Create or Join',
    description: 'Start a new chama or join an existing one with an invite code.',
  },
  {
    number: 2,
    icon: Users,
    title: 'Invite Members',
    description: 'Add members to your chama and set contribution rules.',
  },
  {
    number: 3,
    icon: DollarSign,
    title: 'Contribute',
    description: 'Members contribute regularly. Track payments automatically.',
  },
  {
    number: 4,
    icon: TrendingUp,
    title: 'Grow Together',
    description: 'Watch your savings grow and receive payouts on schedule.',
  },
]

export function HowItWorks() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          How It Works
        </h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Get started in four simple steps
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div key={step.number} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {step.number}
                </div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

