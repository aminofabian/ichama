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
      if (!formData.contribution_amount) newErrors.contribution_amount = 'Required'
      if (!formData.payout_amount) newErrors.payout_amount = 'Required'
      if (!formData.savings_amount) newErrors.savings_amount = 'Required'
      if (!formData.service_fee) newErrors.service_fee = 'Required'
      if (!formData.frequency) newErrors.frequency = 'Required'
      if (!formData.start_date) newErrors.start_date = 'Required'
      if (!formData.total_periods || formData.total_periods < 1) {
        newErrors.total_periods = 'Must be at least 1'
      }

      const total =
        (formData.payout_amount || 0) +
        (formData.savings_amount || 0) +
        (formData.service_fee || 0)
      if (total !== formData.contribution_amount) {
        newErrors.contribution_amount = 'Total breakdown must match contribution amount'
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
      }))

      const response = await fetch(`/api/chamas/${chamaId}/cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/chamas/${chamaId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chama
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Cycle</h1>
        <p className="text-muted-foreground">
          Set up a new contribution cycle for {chamaData.chama.name}
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <div
          className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}
        />
        <div
          className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}
        />
        <div
          className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
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
                } else {
                  newSet.add(memberId)
                }
                setSelectedMemberIds(newSet)
              }}
              onSelectAll={() => {
                const allIds = new Set(chamaData.members.map((m) => m.id))
                setSelectedMemberIds(allIds)
              }}
              onSelectNone={() => setSelectedMemberIds(new Set())}
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

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          Back
        </Button>
        {step < 3 ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Cycle'}
          </Button>
        )}
      </div>
    </div>
  )
}

