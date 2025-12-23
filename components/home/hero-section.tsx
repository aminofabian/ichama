import Link from 'next/link'
import { Button } from '../ui/button'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-20 text-center">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Manage Your Chama with
          <span className="text-primary"> Confidence</span>
        </h1>
        <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
          Transparent contribution tracking, automated payouts, and complete
          financial history for your savings group.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" variant="primary">
              Create Chama
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/join">
            <Button size="lg" variant="primary">Join Chama</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

