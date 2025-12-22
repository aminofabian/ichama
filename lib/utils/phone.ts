export function validateKenyanPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '')
  return /^(254|0)[17]\d{8}$/.test(cleaned)
}

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '')
  if (cleaned.startsWith('0')) {
    return `254${cleaned.slice(1)}`
  }
  if (!cleaned.startsWith('254')) {
    return `254${cleaned}`
  }
  return cleaned
}

