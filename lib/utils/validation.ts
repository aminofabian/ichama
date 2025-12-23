export function validateChamaName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Chama name is required' }
  }
  if (name.trim().length < 3) {
    return { valid: false, error: 'Chama name must be at least 3 characters' }
  }
  if (name.trim().length > 100) {
    return { valid: false, error: 'Chama name must be less than 100 characters' }
  }
  return { valid: true }
}

export function validateContributionAmount(amount: number): { valid: boolean; error?: string } {
  if (!amount || amount <= 0) {
    return { valid: false, error: 'Contribution amount must be greater than 0' }
  }
  if (amount < 100) {
    return { valid: false, error: 'Contribution amount must be at least KES 100' }
  }
  if (amount > 100000) {
    return { valid: false, error: 'Contribution amount must be less than KES 100,000' }
  }
  return { valid: true }
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '')
  const kenyanPhoneRegex = /^(254|0)[17]\d{8}$/
  if (!kenyanPhoneRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid Kenyan phone number format' }
  }
  return { valid: true }
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: true }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  return { valid: true }
}

export function validateRequired(value: unknown): { valid: boolean; error?: string } {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'This field is required' }
  }
  return { valid: true }
}

export function validateCustomSavingsAmount(
  amount: number | null | undefined,
  contributionAmount: number,
  chamaType: 'savings' | 'merry_go_round' | 'hybrid'
): { valid: boolean; error?: string } {
  // Only allow for savings and hybrid chamas
  if (chamaType === 'merry_go_round') {
    return { valid: false, error: 'Custom savings is not available for merry-go-round chamas' }
  }

  // NULL is valid (means use default)
  if (amount === null || amount === undefined) {
    return { valid: true }
  }

  // Must be >= 0
  if (amount < 0) {
    return { valid: false, error: 'Savings amount cannot be negative' }
  }

  // Note: Savings amounts can exceed contribution amount (admin override allowed)
  // No maximum limit validation

  return { valid: true }
}

