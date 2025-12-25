'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { StepIndicator } from '@/components/chama/create-wizard/step-indicator'
import { StepBasicInfo } from '@/components/chama/create-wizard/step-basic-info'
import { StepChamaType } from '@/components/chama/create-wizard/step-chama-type'
import { StepContributionRules } from '@/components/chama/create-wizard/step-contribution-rules'
import { StepReview } from '@/components/chama/create-wizard/step-review'
import { useCreateChamaForm } from '@/lib/hooks/use-create-chama-form'
import {
  validateChamaName,
  validateContributionAmount,
} from '@/lib/utils/validation'
import { useToast } from '@/components/ui/toast'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

const steps = [
  { number: 1, label: 'Basic Info' },
  { number: 2, label: 'Chama Type' },
  { number: 3, label: 'Contribution Rules' },
  { number: 4, label: 'Review' },
]

export default function CreateChamaPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const {
    currentStep,
    formData,
    updateField,
    nextStep,
    prevStep,
    goToStep,
  } = useCreateChamaForm()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      const nameValidation = validateChamaName(formData.name)
      if (!nameValidation.valid) {
        newErrors.name = nameValidation.error || ''
      }
    }

    if (step === 2) {
      if (!formData.chamaType) {
        newErrors.chamaType = 'Please select a chama type'
      }
    }

    if (step === 3) {
      if (!formData.frequency) {
        newErrors.frequency = 'Please select a frequency'
      }

      // Validate based on chama type
      const isSavingsOnly = formData.chamaType === 'savings'
      const isMerryGoRound = formData.chamaType === 'merry_go_round'

      // Savings and Hybrid need savings amount
      if (!isMerryGoRound && !formData.savingsAmount) {
        newErrors.savingsAmount = 'Savings amount is required'
      }

      // Merry-go-round and Hybrid need payout amount
      if (!isSavingsOnly && !formData.payoutAmount) {
        newErrors.payoutAmount = 'Payout amount is required'
      }

      // Validate the auto-calculated contribution amount
      if (formData.contributionAmount) {
        const amountValidation = validateContributionAmount(
          formData.contributionAmount
        )
        if (!amountValidation.valid) {
          newErrors.contributionAmount = amountValidation.error || ''
        }
      } else {
        newErrors.contributionAmount = 'Please enter the required amounts to calculate contribution'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      nextStep()
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      return
    }

    setIsSubmitting(true)
    try {
      // Auto-set payout_amount to 0 for savings-only chamas
      const payoutAmount = formData.chamaType === 'savings' ? 0 : (formData.payoutAmount || 0)
      // Auto-set savings_amount to 0 for merry-go-round chamas
      const savingsAmount = formData.chamaType === 'merry_go_round' ? 0 : (formData.savingsAmount || 0)

      const response = await fetch('/api/chamas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          chama_type: formData.chamaType,
          is_private: formData.isPrivate ? 1 : 0,
          contribution_amount: formData.contributionAmount,
          payout_amount: payoutAmount,
          savings_amount: savingsAmount,
          service_fee: formData.serviceFee,
          frequency: formData.frequency,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create chama')
      }

      addToast({
        variant: 'success',
        title: 'Chama created successfully!',
        description: 'Your chama is ready. Start inviting members!',
      })

      router.push(`/chamas/${data.data.id}`)
    } catch (error) {
      addToast({
        variant: 'error',
        title: 'Failed to create chama',
        description:
          error instanceof Error ? error.message : 'Please try again',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepBasicInfo
            formData={formData}
            updateField={updateField}
            errors={errors}
          />
        )
      case 2:
        return (
          <StepChamaType formData={formData} updateField={updateField} />
        )
      case 3:
        return (
          <StepContributionRules
            formData={formData}
            updateField={updateField}
            errors={errors}
          />
        )
      case 4:
        return <StepReview formData={formData} onEdit={goToStep} />
      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pb-4 md:pb-12">
      {/* Sophisticated Animated Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#FFD700]/10 via-[#FFD700]/5 to-transparent blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent blur-3xl animate-pulse delay-2000" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-3 pt-4 md:px-6 md:pt-12">
        {/* Premium Header Section */}
        <div className="mb-4 md:mb-10 text-center md:text-left">
          <div className="relative inline-block mb-2 md:mb-4">
            {/* Multi-layer glow effect */}
            <div className="absolute -inset-1 md:-inset-2 bg-gradient-to-r from-primary/30 via-purple-500/20 to-blue-500/30 rounded-xl md:rounded-2xl blur-xl opacity-60 animate-pulse" />
            <div className="absolute -inset-0.5 md:-inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-lg md:rounded-xl blur-md opacity-40" />
            <h1 className="relative bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-2xl md:text-5xl font-bold tracking-tight text-transparent">
              Create New Chama
            </h1>
          </div>
          <div className="hidden md:flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-muted-foreground/30" />
            <p className="text-sm md:text-base font-medium">
          Set up your savings group in a few simple steps
        </p>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-muted-foreground/30" />
          </div>
      </div>

        {/* Enhanced Step Indicator */}
        <div className="mb-4 md:mb-10">
      <StepIndicator currentStep={currentStep} steps={steps} />
        </div>

        {/* Premium Step Content Card */}
        <div className="group relative mb-4 md:mb-10">
          {/* Card glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-xl md:rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
          <div className="relative rounded-xl md:rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 md:p-10 shadow-2xl">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 rounded-xl md:rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
            <div className="relative">
        {renderStep()}
            </div>
          </div>
      </div>

        {/* Premium Navigation Section */}
        <div className="flex flex-col-reverse gap-2 md:gap-4 sm:flex-row sm:justify-between sm:items-center pb-4 md:pb-0">
        <Button
            variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
            className="group relative w-full sm:w-auto overflow-hidden border-2 transition-all duration-300 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
        >
            <span className="relative z-10">Back</span>
            {currentStep > 1 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            )}
        </Button>
        {currentStep < 4 ? (
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
                    Create Chama
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


