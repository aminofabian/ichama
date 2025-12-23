import { nanoid } from 'nanoid'
import db from '../client'
import type { Contribution } from '@/lib/types/contribution'

export async function getCycleContributions(cycleId: string): Promise<Contribution[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM contributions WHERE cycle_id = ? ORDER BY period_number ASC, created_at ASC',
    args: [cycleId],
  })

  return result.rows as unknown as Contribution[]
}

export async function getMemberContributions(
  cycleId: string,
  userId: string
): Promise<Contribution[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM contributions WHERE cycle_id = ? AND user_id = ? ORDER BY period_number ASC',
    args: [cycleId, userId],
  })

  return result.rows as unknown as Contribution[]
}

export async function getPeriodContributions(
  cycleId: string,
  periodNumber: number
): Promise<Contribution[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM contributions WHERE cycle_id = ? AND period_number = ?',
    args: [cycleId, periodNumber],
  })

  return result.rows as unknown as Contribution[]
}

export async function getContributionById(id: string): Promise<Contribution | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM contributions WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as Contribution
}

export async function createContribution(data: {
  cycle_id: string
  cycle_member_id: string
  user_id: string
  period_number: number
  amount_due: number
  due_date: string
}): Promise<Contribution> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO contributions (
      id, cycle_id, cycle_member_id, user_id, period_number, amount_due,
      amount_paid, due_date, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.cycle_id,
      data.cycle_member_id,
      data.user_id,
      data.period_number,
      data.amount_due,
      0,
      data.due_date,
      'pending',
      now,
      now,
    ],
  })

  const contribution = await getContributionById(id)
  if (!contribution) {
    throw new Error('Failed to create contribution')
  }
  return contribution
}

export async function updateContribution(
  id: string,
  data: Partial<Omit<Contribution, 'id' | 'created_at'>>
): Promise<Contribution> {
  const updates: string[] = []
  const args: unknown[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`)
      args.push(value)
    }
  })

  if (updates.length === 0) {
    const contribution = await getContributionById(id)
    if (!contribution) {
      throw new Error('Contribution not found')
    }
    return contribution
  }

  updates.push('updated_at = ?')
  args.push(new Date().toISOString())
  args.push(id)

  await (db.execute as any)({
    sql: `UPDATE contributions SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  const contribution = await getContributionById(id)
  if (!contribution) {
    throw new Error('Contribution not found')
  }
  return contribution
}

export async function getPendingContributions(
  cycleId: string,
  periodNumber?: number
): Promise<Contribution[]> {
  let sql = 'SELECT * FROM contributions WHERE cycle_id = ? AND status = ?'
  const args: unknown[] = [cycleId, 'pending']

  if (periodNumber !== undefined) {
    sql += ' AND period_number = ?'
    args.push(periodNumber)
  }

  sql += ' ORDER BY due_date ASC'

  const result = await (db.execute as any)({ sql, args })
  return result.rows as unknown as Contribution[]
}

export async function getCycleContributionStats(cycleId: string): Promise<{
  totalDue: number
  totalPaid: number
  collectionRate: number
  pendingCount: number
  paidCount: number
  overdueCount: number
}> {
  const contributions = await getCycleContributions(cycleId)

  const totalDue = contributions.reduce((sum, c) => sum + c.amount_due, 0)
  const totalPaid = contributions.reduce((sum, c) => sum + c.amount_paid, 0)
  const collectionRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0

  const pendingCount = contributions.filter((c) => c.status === 'pending').length
  const paidCount = contributions.filter((c) => c.status === 'paid' || c.status === 'confirmed').length
  const overdueCount = contributions.filter((c) => c.status === 'late' || c.status === 'missed').length

  return {
    totalDue,
    totalPaid,
    collectionRate,
    pendingCount,
    paidCount,
    overdueCount,
  }
}

