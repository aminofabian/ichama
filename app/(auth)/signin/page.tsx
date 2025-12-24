'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Lock, Eye, EyeOff, ArrowRight, MessageSquare, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

type LoginMethod = 'phone' | 'email'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const inviteCode = searchParams.get('invite')
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (loginMethod === 'phone' && !phoneNumber) {
      setErrors({ identifier: 'Phone number is required' })
      return
    }

    if (loginMethod === 'email' && !email) {
      setErrors({ identifier: 'Email is required' })
      return
    }

    if (!password) {
      setErrors({ password: 'Password is required' })
      return
    }

    if (loginMethod === 'phone' && phoneNumber.length !== 9) {
      setErrors({ identifier: 'Please enter a valid 9-digit phone number' })
      return
    }

    setIsLoading(true)

    try {
      const formattedPhone = loginMethod === 'phone' ? `+254${phoneNumber}` : undefined
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: formattedPhone,
          email: loginMethod === 'email' ? email : undefined,
          password 
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to sign in')
      }

      addToast({
        variant: 'success',
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      })

      if (inviteCode) {
        try {
          const joinResponse = await fetch(`/api/chamas/join/${inviteCode}`, {
            method: 'POST',
          })

          const joinResult = await joinResponse.json()

          if (joinResponse.ok && joinResult.success) {
            addToast({
              variant: 'success',
              title: 'Welcome to the chama!',
              description: 'You have successfully joined.',
            })
            router.push(`/chamas/${joinResult.data.chamaId}`)
          } else {
            router.push('/dashboard')
          }
        } catch {
          router.push('/dashboard')
        }
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPLogin = async () => {
    if (loginMethod === 'email') {
      addToast({
        variant: 'error',
        title: 'OTP Login',
        description: 'OTP login is only available for phone numbers.',
      })
      return
    }

    if (!phoneNumber) {
      setErrors({ identifier: 'Phone number is required' })
      return
    }

    if (phoneNumber.length !== 9) {
      setErrors({ identifier: 'Please enter a valid 9-digit phone number' })
      return
    }

    setIsLoading(true)

    try {
      const formattedPhone = `+254${phoneNumber}`
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: formattedPhone, purpose: 'login', deliveryMethod: 'sms' }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      addToast({
        variant: 'success',
        title: 'OTP Sent',
        description: 'Check your SMS for the verification code.',
      })

      router.push(`/signin/otp?phone=${encodeURIComponent(formattedPhone)}${inviteCode ? `&invite=${inviteCode}` : ''}`)
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Failed to send OTP',
        description: error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 px-4 py-6 md:items-center md:justify-center md:px-0">
      {/* Animated background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-[#FFD700]/5 blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-[#F5E6D3]/10 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <button
            onClick={() => router.back()}
            className="group mr-4 flex h-11 w-11 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm transition-all hover:bg-background hover:shadow-md hover:scale-105"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sign In</h1>
            <p className="text-xs text-muted-foreground">Access your account</p>
          </div>
        </div>

        {/* Hero Image Section */}
        <div className="group relative mb-8 h-56 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFD700]/20 via-[#F5E6D3]/30 to-primary/10 shadow-xl transition-all duration-500 hover:shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/10 to-transparent" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V4h4V2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V4h4V2H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }} />
          </div>
          <div className="relative flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#FFD700]/20 blur-xl animate-pulse" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#F5E6D3]/30 text-5xl shadow-lg backdrop-blur-sm">
                    🤝
                  </div>
                </div>
              </div>
              <p className="text-sm font-medium text-foreground/80">Community Together</p>
              <p className="mt-1 text-xs text-muted-foreground">Building wealth, one contribution at a time</p>
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Welcome back
          </h2>
          <p className="text-muted-foreground">
            Manage your savings and merry-go-rounds securely.
          </p>
        </div>

        {/* Login Method Toggle */}
        <div className="mb-6 flex rounded-xl border border-input/50 bg-muted/40 p-1.5 shadow-inner backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setLoginMethod('phone')}
            className={`relative flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
              loginMethod === 'phone'
                ? 'bg-background text-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Phone className="h-4 w-4" />
              Phone
            </span>
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod('email')}
            className={`relative flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
              loginMethod === 'email'
                ? 'bg-background text-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input Fields */}
          <div className="space-y-1">
            {loginMethod === 'phone' ? (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-input/50 bg-background/50 backdrop-blur-sm transition-all focus-within:border-[#FFD700]/50 focus-within:bg-background focus-within:shadow-lg focus-within:shadow-[#FFD700]/10">
                  <div className="flex items-center gap-2 px-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span className="text-base font-bold text-foreground">+254</span>
                    <div className="h-6 w-px bg-input" />
                  </div>
                  <input
                    type="tel"
                    placeholder="712 345 678"
                    value={
                      phoneNumber.length > 0
                        ? phoneNumber
                            .replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
                            .trim()
                        : ''
                    }
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                      setPhoneNumber(value)
                      setErrors({})
                    }}
                    disabled={isLoading}
                    className="flex-1 border-0 bg-transparent py-3 pr-4 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your 9-digit phone number (without country code)
                </p>
                {errors.identifier && (
                  <p className="text-sm text-destructive">{errors.identifier}</p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors({})
                  }}
                  error={errors.identifier}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-input/50 bg-background/50 backdrop-blur-sm transition-all focus-visible:border-[#FFD700]/50 focus-visible:bg-background focus-visible:shadow-lg focus-visible:shadow-[#FFD700]/10"
                  leftIcon={<Mail className="h-5 w-5 text-muted-foreground" />}
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors({})
              }}
              error={errors.password}
              disabled={isLoading}
              className="h-12 rounded-xl border-input/50 bg-background/50 backdrop-blur-sm transition-all focus-visible:border-[#FFD700]/50 focus-visible:bg-background focus-visible:shadow-lg focus-visible:shadow-[#FFD700]/10"
              leftIcon={<Lock className="h-5 w-5 text-muted-foreground" />}
              rightIcon={
                showPassword ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                )
              }
              onRightIconClick={() => setShowPassword(!showPassword)}
            />
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-[#FFD700]"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#FFD700] to-[#FFC700] text-foreground shadow-lg shadow-[#FFD700]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#FFD700]/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            disabled={isLoading}
            size="lg"
          >
            <span className="relative z-10 flex items-center justify-center">
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 font-semibold">Signing in...</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">Sign In</span>
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFE44D] to-[#FFD700] opacity-0 transition-opacity group-hover:opacity-100" />
          </Button>

          {/* OTP Login Button */}
          <Button
            type="button"
            onClick={handleOTPLogin}
            variant="secondary"
            className="group relative w-full overflow-hidden rounded-xl border border-input/50 bg-gradient-to-r from-[#F5E6D3] to-[#F0D9C0] text-foreground shadow-md transition-all duration-300 hover:border-input hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            disabled={isLoading || loginMethod === 'email'}
            size="lg"
          >
            <span className="relative z-10 flex items-center justify-center">
              <MessageSquare className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              <span className="font-medium">Login via OTP</span>
            </span>
          </Button>

          {/* Sign Up Link */}
          <div className="pt-2">
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/join"
                className="font-semibold text-[#FFD700] transition-colors hover:text-[#FFC700] hover:underline"
              >
                Join Chamas
              </Link>
            </p>
          </div>
        </form>

        {/* Social Login Section */}
        <div className="mt-10">
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-input/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              className="group flex h-12 w-12 items-center justify-center rounded-xl border border-input/50 bg-background/50 backdrop-blur-sm shadow-sm transition-all hover:border-input hover:bg-background hover:shadow-md hover:scale-105 active:scale-95"
              aria-label="Google login"
            >
              <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </button>
            <button
              type="button"
              className="group flex h-12 w-12 items-center justify-center rounded-xl border border-input/50 bg-background/50 backdrop-blur-sm shadow-sm transition-all hover:border-input hover:bg-background hover:shadow-md hover:scale-105 active:scale-95"
              aria-label="Apple login"
            >
              <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.08-.4C1.79 15.25 4.23 5.87 9.2 5.6c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zm-2.67-15.4c.27-.32.46-.75.56-1.21 0-.01 0-.01 0-.01-.51.2-1.11.55-1.45 1-.29.33-.54.75-.6 1.21.51.04 1.05-.17 1.49-.99h-.01z" />
              </svg>
            </button>
            <button
              type="button"
              className="group flex h-12 w-12 items-center justify-center rounded-xl border border-input/50 bg-background/50 backdrop-blur-sm shadow-sm transition-all hover:border-input hover:bg-background hover:shadow-md hover:scale-105 active:scale-95"
              aria-label="Facebook login"
            >
              <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  )
}

