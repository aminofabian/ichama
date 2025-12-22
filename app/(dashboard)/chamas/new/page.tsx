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
      if (!formData.contributionAmount) {
        newErrors.contributionAmount = 'Contribution amount is required'
      } else {
        const amountValidation = validateContributionAmount(
          formData.contributionAmount
        )
        if (!amountValidation.valid) {
          newErrors.contributionAmount = amountValidation.error || ''
        }
      }

      if (!formData.frequency) {
        newErrors.frequency = 'Please select a frequency'
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
      const response = await fetch('/api/chamas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          chama_type: formData.chamaType,
          is_private: formData.isPrivate ? 1 : 0,
          contribution_amount: formData.contributionAmount,
          payout_amount: formData.payoutAmount,
          savings_amount: formData.savingsAmount,
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Chama</h1>
        <p className="text-muted-foreground">
          Set up your savings group in a few simple steps
        </p>
      </div>

      <StepIndicator currentStep={currentStep} steps={steps} />

      <div className="mb-8 rounded-lg border bg-card p-6">
        {renderStep()}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          Back
        </Button>
        {currentStep < 4 ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Creating...</span>
              </>
            ) : (
              'Create Chama'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

