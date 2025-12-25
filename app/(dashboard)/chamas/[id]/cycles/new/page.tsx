'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/components/ui/toast'
import { CycleForm } from '@/components/chama/create-cycle/cycle-form'
import { MemberSelector } from '@/components/chama/create-cycle/member-selector'
import { TurnAssignment } from '@/components/chama/create-cycle/turn-assignment'
import type { Chama, ChamaMember } from '@/lib/types/chama'

interface MemberWithUser extends ChamaMember {
  user?: {
    id: string
    full_name: string
    phone_number: string
  }
}

interface ChamaData {
  chama: Chama
  members: MemberWithUser[]
  isAdmin: boolean
}

export default function CreateCyclePage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const chamaId = params.id as string

  const [chamaData, setChamaData] = useState<ChamaData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    contribution_amount: null as number | null,
    payout_amount: null as number | null,
    savings_amount: null as number | null,
    service_fee: null as number | null,
    frequency: null as 'weekly' | 'biweekly' | 'monthly' | null,
    start_date: new Date().toISOString().split('T')[0],
    total_periods: null as number | null,
  })

  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set())
  const [turnOrder, setTurnOrder] = useState<Map<string, number>>(new Map())
  const [memberSavings, setMemberSavings] = useState<Map<string, number | null>>(new Map())
  const [memberHideSavings, setMemberHideSavings] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    async function fetchChama() {
      try {
        const response = await fetch(`/api/chamas/${chamaId}`)
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch chama')
        }

        if (!result.data.isAdmin) {
          throw new Error('Only admins can create cycles')
        }

        setChamaData(result.data)

        // Pre-populate form with chama's default contribution values
        const chama = result.data.chama
        setFormData(prev => ({
          ...prev,
          contribution_amount: chama.contribution_amount ?? null,
          payout_amount: chama.payout_amount ?? null,
          savings_amount: chama.savings_amount ?? null,
          service_fee: chama.service_fee ?? null,
          frequency: chama.frequency ?? null,
        }))

        // Select all members by default
        const allMemberIds = new Set<string>(
          result.data.members.map((m: MemberWithUser) => m.id) // chama_member_id
        )
        setSelectedMemberIds(allMemberIds)

        // Initialize turn order
        const initialTurnOrder = new Map<string, number>()
        result.data.members.forEach((m: MemberWithUser, index: number) => {
          initialTurnOrder.set(m.id, index + 1) // using chama_member_id as key
        })
        setTurnOrder(initialTurnOrder)
      } catch (err) {
        setErrors({ general: err instanceof Error ? err.message : 'Failed to load chama' })
      } finally {
        setIsLoading(false)
      }
    }

    if (chamaId) {
      fetchChama()
    }
  }, [chamaId])

  const handleNext = () => {
    if (step === 1) {
      const newErrors: Record<string, string> = {}
      if (!formData.name) newErrors.name = 'Cycle name is required'
      if (!formData.frequency) newErrors.frequency = 'Please select a frequency'
      if (!formData.start_date) newErrors.start_date = 'Start date is required'
      if (!formData.total_periods || formData.total_periods < 1) {
        newErrors.total_periods = 'Must be at least 1'
      }
      
      // Validate based on chama type
      const chamaType = chamaData?.chama.chama_type
      const isSavingsOnly = chamaType === 'savings'
      const isMerryGoRound = chamaType === 'merry_go_round'

      // Savings and Hybrid need savings amount
      if (!isMerryGoRound && !formData.savings_amount) {
        newErrors.savings_amount = 'Savings amount is required'
      }

      // Merry-go-round and Hybrid need payout amount
      if (!isSavingsOnly && !formData.payout_amount) {
        newErrors.payout_amount = 'Payout amount is required'
      }

      // Contribution amount is auto-calculated, just verify it exists
      if (!formData.contribution_amount) {
        newErrors.contribution_amount = 'Please enter the required amounts to calculate contribution'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }
    }

    if (step === 2) {
      if (selectedMemberIds.size === 0) {
        setErrors({ members: 'Please select at least one member' })
        return
      }
    }

    setErrors({})
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    if (selectedMemberIds.size === 0) {
      setErrors({ members: 'Please select at least one member' })
      return
    }

    setIsSubmitting(true)
    try {
      const selectedMembers = chamaData!.members.filter((m) =>
        selectedMemberIds.has(m.id)
      )

      const members = selectedMembers.map((member) => ({
        chama_member_id: member.id,
        user_id: member.user_id,
        turn_order: turnOrder.get(member.id) || 0,
        assigned_number: turnOrder.get(member.id) || 0,
        custom_savings_amount: memberSavings.get(member.id) ?? null,
        hide_savings: memberHideSavings.get(member.id) ?? 0,
      }))

      // Auto-set payout_amount to 0 for savings-only chamas
      const payoutAmount = chamaData!.chama.chama_type === 'savings' ? 0 : (formData.payout_amount || 0)
      // Auto-set savings_amount to 0 for merry-go-round chamas
      const savingsAmount = chamaData!.chama.chama_type === 'merry_go_round' ? 0 : (formData.savings_amount || 0)

      const response = await fetch(`/api/chamas/${chamaId}/cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          payout_amount: payoutAmount,
          savings_amount: savingsAmount,
          members,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create cycle')
      }

      addToast({
        variant: 'success',
        title: 'Cycle created!',
        description: 'Your cycle has been created successfully.',
      })

      router.push(`/chamas/${chamaId}`)
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Failed to create cycle',
        description: err instanceof Error ? err.message : 'Please try again',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShuffle = () => {
    const selectedMembers = chamaData!.members.filter((m) =>
      selectedMemberIds.has(m.id)
    )
    const shuffled = [...selectedMembers]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const newTurnOrder = new Map(turnOrder)
    shuffled.forEach((member, index) => {
      newTurnOrder.set(member.id, index + 1)
    })
    setTurnOrder(newTurnOrder)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (errors.general || !chamaData) {
    return (
      <EmptyState
        title="Error"
        description={errors.general || 'Could not load chama data'}
      />
    )
  }

  const selectedMembers = chamaData.members.filter((m) => selectedMemberIds.has(m.id))

  const steps = [
    { number: 1, label: 'Cycle Details' },
    { number: 2, label: 'Select Members' },
    { number: 3, label: 'Turn Order' },
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pb-4 md:pb-12">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#FFD700]/10 via-[#FFD700]/5 to-transparent blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent blur-3xl animate-pulse delay-2000" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-3 pt-4 md:px-6 md:pt-12">
        {/* Header */}
        <div className="mb-4 md:mb-8">
        <Link href={`/chamas/${chamaId}`}>
            <Button variant="ghost" size="sm" className="mb-4 hover:bg-muted/80">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chama
          </Button>
        </Link>
          <div className="relative inline-block mb-2 md:mb-3">
            <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-primary/30 via-purple-500/20 to-blue-500/30 rounded-xl md:rounded-2xl blur-xl opacity-60 animate-pulse" />
            <div className="absolute -inset-0.5 md:-inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg md:rounded-xl blur-md opacity-40" />
            <h1 className="relative bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-2xl md:text-4xl font-bold tracking-tight text-transparent">
              Create New Cycle
            </h1>
      </div>
          <p className="text-xs md:text-sm text-muted-foreground">
          Set up a new contribution cycle for {chamaData.chama.name}
        </p>
      </div>

        {/* Step Indicator */}
        <div className="relative mb-4 md:mb-8 py-3 md:py-6">
          <div className="absolute inset-0 -mx-3 md:-mx-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30 border border-border/30" />
          <div className="relative flex items-center justify-between px-1 md:px-2">
            {steps.map((stepItem, index) => {
              const isCompleted = step > stepItem.number
              const isCurrent = step === stepItem.number
              const isUpcoming = step < stepItem.number

              return (
                <div key={stepItem.number} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center relative z-10 flex-1">
                    <div className="relative mb-2 md:mb-4">
                      {isCurrent && (
                        <>
                          <div className="absolute -inset-2 md:-inset-3 bg-primary/10 rounded-full blur-lg animate-pulse" />
                          <div className="absolute -inset-1 md:-inset-2 bg-primary/20 rounded-full blur-md" />
                        </>
                      )}
                      <div
                        className={`relative flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-full border-2 transition-all duration-500 shadow-xl ${
                          isCompleted
                            ? 'border-primary bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground shadow-primary/30'
                            : isCurrent
                            ? 'border-primary bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground shadow-primary/40 scale-110 ring-2 md:ring-4 ring-primary/20'
                            : 'border-muted/50 bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm'
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="h-4 w-4 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-sm md:text-base font-bold">{stepItem.number}</span>
                        )}
                        {(isCompleted || isCurrent) && (
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <span
                        className={`block text-[9px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest transition-all duration-300 ${
                          isCurrent
                            ? 'text-foreground scale-105'
                            : isCompleted
                            ? 'text-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {stepItem.label}
                      </span>
                      {isCurrent && (
                        <div className="mt-1 md:mt-2 mx-auto h-0.5 md:h-1 w-6 md:w-8 rounded-full bg-gradient-to-r from-primary to-primary/50 animate-pulse" />
                      )}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="relative mx-1 md:mx-2 h-0.5 md:h-1 flex-1 -mt-6 md:-mt-8">
                      <div className="absolute inset-0 bg-muted/50 rounded-full" />
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${
                          isCompleted
                            ? 'from-primary via-primary/90 to-primary/80 w-full shadow-sm shadow-primary/20'
                            : 'from-primary/30 to-transparent w-0'
                        }`}
                      />
                      {isCompleted && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
      </div>

        {/* Step Content Card */}
        <div className="group relative mb-4 md:mb-10">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-xl md:rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
          <Card className="relative rounded-xl md:rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 md:p-10 shadow-2xl">
            <div className="absolute inset-0 rounded-xl md:rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
            <CardContent className="relative pt-0">
          {step === 1 && (
            <CycleForm
              chama={chamaData.chama}
              formData={formData}
              updateField={(field, value) =>
                setFormData((prev) => ({ ...prev, [field]: value }))
              }
              errors={errors}
            />
          )}

          {step === 2 && (
            <MemberSelector
              members={chamaData.members.map((m) => ({
                id: m.id,
                chama_member_id: m.id,
                user_id: m.user_id,
                full_name: m.user?.full_name || 'Unknown',
                phone_number: m.user?.phone_number || '',
                role: m.role,
              }))}
              selectedMemberIds={selectedMemberIds}
              onToggle={(memberId) => {
                const newSet = new Set(selectedMemberIds)
                if (newSet.has(memberId)) {
                  newSet.delete(memberId)
                  setMemberSavings((prev) => {
                    const next = new Map(prev)
                    next.delete(memberId)
                    return next
                  })
                  setMemberHideSavings((prev) => {
                    const next = new Map(prev)
                    next.delete(memberId)
                    return next
                  })
                } else {
                  newSet.add(memberId)
                }
                setSelectedMemberIds(newSet)
              }}
              onSelectAll={() => {
                const allIds = new Set(chamaData.members.map((m) => m.id))
                setSelectedMemberIds(allIds)
              }}
              onSelectNone={() => {
                setSelectedMemberIds(new Set())
                setMemberSavings(new Map())
                setMemberHideSavings(new Map())
              }}
              chamaType={chamaData.chama.chama_type}
              defaultSavingsAmount={formData.savings_amount}
              contributionAmount={formData.contribution_amount}
              memberSavings={memberSavings}
              onSavingsChange={(memberId, amount) => {
                setMemberSavings((prev) => {
                  const next = new Map(prev)
                  if (amount === null) {
                    next.delete(memberId)
                  } else {
                    next.set(memberId, amount)
                  }
                  return next
                })
              }}
              memberHideSavings={memberHideSavings}
              onHideSavingsChange={(memberId, hide) => {
                setMemberHideSavings((prev) => {
                  const next = new Map(prev)
                  next.set(memberId, hide)
                  return next
                })
              }}
            />
          )}

          {step === 3 && (
            <TurnAssignment
              members={selectedMembers.map((m) => ({
                chama_member_id: m.id,
                user_id: m.user_id,
                full_name: m.user?.full_name || 'Unknown',
                phone_number: m.user?.phone_number || '',
              }))}
              turnOrder={turnOrder}
              onTurnOrderChange={(memberId, turn) => {
                const newTurnOrder = new Map(turnOrder)
                newTurnOrder.set(memberId, turn)
                setTurnOrder(newTurnOrder)
              }}
              onShuffle={handleShuffle}
            />
          )}
        </CardContent>
      </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse gap-2 md:gap-4 sm:flex-row sm:justify-between sm:items-center pb-4 md:pb-0">
        <Button
            variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
            className="group relative w-full sm:w-auto overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02] disabled:opacity-40"
        >
            <span className="relative z-10">Back</span>
            {step > 1 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            )}
        </Button>
        {step < 3 ? (
            <Button 
              onClick={handleNext}
              className="group relative w-full sm:w-auto overflow-hidden bg-gradient-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Next
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </Button>
        ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="group relative w-full sm:w-auto overflow-hidden bg-gradient-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="relative z-10 flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Creating...</span>
                </span>
              ) : (
                <>
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Cycle
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </>
              )}
          </Button>
        )}
        </div>
      </div>
    </div>
  )
}

