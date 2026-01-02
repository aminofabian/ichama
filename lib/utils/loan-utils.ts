/**
 * Calculate days until due date or days overdue
 * @param dueDate - ISO date string or Date object
 * @returns Object with daysUntil, isOverdue, and formatted message
 */
export function calculateDueDateStatus(dueDate: string | Date | null): {
  daysUntil: number
  isOverdue: boolean
  daysOverdue: number
  message: string
  urgency: 'none' | 'soon' | 'overdue' | 'critical'
} {
  if (!dueDate) {
    return {
      daysUntil: 0,
      isOverdue: false,
      daysOverdue: 0,
      message: 'No due date set',
      urgency: 'none',
    }
  }

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  const diffTime = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays)
    let urgency: 'overdue' | 'critical' = 'overdue'
    if (daysOverdue > 30) {
      urgency = 'critical'
    }

    return {
      daysUntil: 0,
      isOverdue: true,
      daysOverdue,
      message: `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`,
      urgency,
    }
  } else if (diffDays === 0) {
    return {
      daysUntil: 0,
      isOverdue: false,
      daysOverdue: 0,
      message: 'Due today',
      urgency: 'soon',
    }
  } else if (diffDays <= 7) {
    return {
      daysUntil: diffDays,
      isOverdue: false,
      daysOverdue: 0,
      message: `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
      urgency: 'soon',
    }
  } else {
    return {
      daysUntil: diffDays,
      isOverdue: false,
      daysOverdue: 0,
      message: `Due in ${diffDays} days`,
      urgency: 'none',
    }
  }
}

/**
 * Calculate penalty interest for overdue loans
 * @param principalAmount - Original loan amount
 * @param daysOverdue - Number of days the loan is overdue
 * @param penaltyRatePerDay - Penalty interest rate per day (default: 0.5% per day)
 * @returns Object with penalty amount and total with penalty
 */
export function calculatePenaltyInterest(
  principalAmount: number,
  daysOverdue: number,
  penaltyRatePerDay: number = 0.5
): {
  penaltyAmount: number
  totalWithPenalty: number
  penaltyRate: number
} {
  if (daysOverdue <= 0) {
    return {
      penaltyAmount: 0,
      totalWithPenalty: principalAmount,
      penaltyRate: 0,
    }
  }

  // Calculate penalty: 0.5% per day on the outstanding principal
  // Cap at 50% maximum penalty (100 days)
  const effectiveDays = Math.min(daysOverdue, 100)
  const penaltyRate = (effectiveDays * penaltyRatePerDay)
  const penaltyAmount = (principalAmount * penaltyRate) / 100
  const totalWithPenalty = principalAmount + penaltyAmount

  return {
    penaltyAmount,
    totalWithPenalty,
    penaltyRate,
  }
}

/**
 * Calculate complete loan breakdown including original interest and penalty interest
 * @param principalAmount - Original loan amount
 * @param interestRate - Original interest rate percentage
 * @param amountPaid - Amount already paid
 * @param dueDate - Loan due date
 * @returns Complete loan breakdown
 */
export function calculateLoanBreakdown(
  principalAmount: number,
  interestRate: number,
  amountPaid: number,
  dueDate: string | null
): {
  principal: number
  originalInterest: number
  originalTotal: number
  penaltyInterest: number
  penaltyRate: number
  totalWithPenalty: number
  outstandingAmount: number
  totalOutstanding: number
  isOverdue: boolean
  daysOverdue: number
} {
  const originalInterest = (principalAmount * interestRate) / 100
  const originalTotal = principalAmount + originalInterest
  
  const dueDateStatus = calculateDueDateStatus(dueDate)
  const isOverdue = dueDateStatus.isOverdue
  const daysOverdue = dueDateStatus.daysOverdue

  // Calculate outstanding principal (what's left to pay of the original loan)
  const outstandingPrincipal = Math.max(0, originalTotal - amountPaid)

  // If overdue, calculate penalty on outstanding principal
  let penaltyInterest = 0
  let penaltyRate = 0
  let totalWithPenalty = originalTotal
  let totalOutstanding = outstandingPrincipal

  if (isOverdue && outstandingPrincipal > 0) {
    const penaltyCalc = calculatePenaltyInterest(outstandingPrincipal, daysOverdue)
    penaltyInterest = penaltyCalc.penaltyAmount
    penaltyRate = penaltyCalc.penaltyRate
    totalWithPenalty = originalTotal + penaltyInterest
    totalOutstanding = outstandingPrincipal + penaltyInterest
  }

  return {
    principal: principalAmount,
    originalInterest,
    originalTotal,
    penaltyInterest,
    penaltyRate,
    totalWithPenalty,
    outstandingAmount: outstandingPrincipal,
    totalOutstanding,
    isOverdue,
    daysOverdue,
  }
}

