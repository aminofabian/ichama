import { HeroSection } from '@/components/home/hero-section'
import { FeaturesSection } from '@/components/home/features-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { ExampleBreakdown } from '@/components/home/example-breakdown'
import { TrustSignals } from '@/components/home/trust-signals'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export default function HomePage() {
  return (
    <>
    <Header />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <ExampleBreakdown />
      <TrustSignals />
      <Footer />
    </>
  )
}
