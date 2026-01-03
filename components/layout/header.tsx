'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { Avatar } from '../ui/avatar'

export interface HeaderProps {
  user?: {
    id: string
    full_name: string
    phone_number: string
  } | null
}

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full transition-all duration-300",
      scrolled ? "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md" : "bg-transparent"
    )}>
      <div className="container flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <span className="text-xl font-bold text-white">M</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Merry</span>
        </Link>

        <nav className="hidden md:flex md:items-center md:space-x-8">
          <Link
            href="#features"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4"
          >
            How It Works
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4"
              >
                Dashboard
              </Link>
              <Link
                href="/wallet"
                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4"
              >
                Wallet
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground hover:underline underline-offset-4"
              >
                Sign In
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="default" className="shadow-md hover:shadow-lg transition-all">Get Started</Button>
              </Link>
            </>
          )}
        </nav>

        {user && (
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Avatar name={user.full_name} size="sm" />
            <span className="text-sm font-semibold">{user.full_name}</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="default"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="container flex flex-col space-y-4 px-4 py-6">
            <Link
              href="#features"
              className="text-base font-semibold text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-base font-semibold text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-base font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/wallet"
                  className="text-base font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Wallet
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-base font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="lg" className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

