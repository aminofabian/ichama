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
    <section id="how-it-works" className="container mx-auto px-4 py-24">
      <div className="mb-16 text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          How It Works
        </h2>
        <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
          Get started in four simple steps
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.number} className="relative group">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] border-t-2 border-dashed border-muted-foreground/20" />
              )}
              <div className="flex flex-col items-center text-center">
                <div className="mb-6 relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-3xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {step.number}
                  </div>
                  <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-xl bg-background border-2 border-primary/20 shadow-md">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

