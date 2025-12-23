import { describe, it, expect } from 'vitest'
import { validateCustomSavingsAmount } from '@/lib/utils/validation'

describe('validateCustomSavingsAmount', () => {
  const contributionAmount = 1000
  const savingsChama = 'savings'
  const hybridChama = 'hybrid'
  const merryGoRoundChama = 'merry_go_round'

  describe('Chama type validation', () => {
    it('should reject custom savings for merry-go-round chamas', () => {
      const result = validateCustomSavingsAmount(100, contributionAmount, merryGoRoundChama)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('merry-go-round')
    })

    it('should allow custom savings for savings chamas', () => {
      const result = validateCustomSavingsAmount(100, contributionAmount, savingsChama)
      expect(result.valid).toBe(true)
    })

    it('should allow custom savings for hybrid chamas', () => {
      const result = validateCustomSavingsAmount(100, contributionAmount, hybridChama)
      expect(result.valid).toBe(true)
    })
  })

  describe('NULL/undefined handling', () => {
    it('should accept NULL (use default)', () => {
      const result = validateCustomSavingsAmount(null, contributionAmount, savingsChama)
      expect(result.valid).toBe(true)
    })

    it('should accept undefined (use default)', () => {
      const result = validateCustomSavingsAmount(undefined, contributionAmount, savingsChama)
      expect(result.valid).toBe(true)
    })
  })

  describe('Amount validation', () => {
    it('should reject negative amounts', () => {
      const result = validateCustomSavingsAmount(-10, contributionAmount, savingsChama)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('negative')
    })

    it('should accept zero', () => {
      const result = validateCustomSavingsAmount(0, contributionAmount, savingsChama)
      expect(result.valid).toBe(true)
    })

    it('should accept valid amounts', () => {
      const result = validateCustomSavingsAmount(100, contributionAmount, savingsChama)
      expect(result.valid).toBe(true)
    })

    it('should accept amount equal to contribution', () => {
      const result = validateCustomSavingsAmount(contributionAmount, contributionAmount, savingsChama)
      expect(result.valid).toBe(true)
    })

    it('should reject amounts exceeding contribution', () => {
      const result = validateCustomSavingsAmount(1500, contributionAmount, savingsChama)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceed')
      expect(result.error).toContain(contributionAmount.toString())
    })
  })

  describe('Edge cases', () => {
    it('should handle very small amounts', () => {
      const result = validateCustomSavingsAmount(1, contributionAmount, savingsChama)
      expect(result.valid).toBe(true)
    })

    it('should handle large contribution amounts', () => {
      const largeContribution = 100000
      const result = validateCustomSavingsAmount(50000, largeContribution, savingsChama)
      expect(result.valid).toBe(true)
    })
  })
})

