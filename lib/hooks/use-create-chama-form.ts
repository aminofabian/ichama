'use client'

import { useState } from 'react'
import type { ChamaType } from '@/lib/types/chama'

export interface CreateChamaFormData {
  name: string
  description: string
  isPrivate: boolean
  chamaType: ChamaType | null
  contributionAmount: number | null
  payoutAmount: number | null
  savingsAmount: number | null
  serviceFee: number | null
  frequency: 'weekly' | 'biweekly' | 'monthly' | null
}

const DEFAULT_SERVICE_FEE_PERCENTAGE = 3

export function useCreateChamaForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CreateChamaFormData>({
    name: '',
    description: '',
    isPrivate: true,
    chamaType: null,
    contributionAmount: null,
    payoutAmount: null,
    savingsAmount: null,
    serviceFee: null,
    frequency: null,
  })

  const updateField = <K extends keyof CreateChamaFormData>(
    field: K,
    value: CreateChamaFormData[K]
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }

      if (field === 'contributionAmount' && value !== null) {
        const contribution = value as number
        const serviceFee = Math.round(contribution * (DEFAULT_SERVICE_FEE_PERCENTAGE / 100))
        const remaining = contribution - serviceFee
        const savings = Math.round(remaining * 0.1)
        const payout = remaining - savings

        updated.serviceFee = serviceFee
        updated.savingsAmount = savings
        updated.payoutAmount = payout
      }

      return updated
    })
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= 4) {
      setCurrentStep(step)
    }
  }

  const reset = () => {
    setCurrentStep(1)
    setFormData({
      name: '',
      description: '',
      isPrivate: true,
      chamaType: null,
      contributionAmount: null,
      payoutAmount: null,
      savingsAmount: null,
      serviceFee: null,
      frequency: null,
    })
  }

  return {
    currentStep,
    formData,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    reset,
  }
}

