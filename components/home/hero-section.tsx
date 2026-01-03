import Link from 'next/link'
import { Button } from '../ui/button'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 py-24 text-center md:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <span className="mr-2 flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          Trusted by 1,000+ chamas across Kenya
        </div>
        <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          Manage Your Chama with
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> Confidence</span>
        </h1>
        <p className="mb-10 text-xl text-muted-foreground sm:text-2xl md:text-3xl leading-relaxed">
          Transparent contribution tracking, automated payouts, and complete
          financial history for your savings group.
        </p>
        <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" variant="primary" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all">
              Create Chama
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/join">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-primary/10 transition-all">Join Chama</Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/signin" className="text-primary font-semibold underline-offset-4 hover:underline transition-all">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  )
}

