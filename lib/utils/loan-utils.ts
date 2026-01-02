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

