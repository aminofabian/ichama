import { HeroSection } from '@/components/home/hero-section'
import { FeaturesSection } from '@/components/home/features-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { ExampleBreakdown } from '@/components/home/example-breakdown'
import { TrustSignals } from '@/components/home/trust-signals'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <ExampleBreakdown />
      <TrustSignals />
    </>
  )
}
