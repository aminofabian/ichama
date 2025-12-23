import { nanoid } from 'nanoid'
import db from '../client'
import type { Payout } from '@/lib/types/contribution'

export async function getCyclePayouts(cycleId: string): Promise<Payout[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM payouts WHERE cycle_id = ? ORDER BY period_number ASC',
    args: [cycleId],
  })

  return result.rows as unknown as Payout[]
}

export async function getMemberPayouts(cycleId: string, userId: string): Promise<Payout[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM payouts WHERE cycle_id = ? AND user_id = ? ORDER BY period_number ASC',
    args: [cycleId, userId],
  })

  return result.rows as unknown as Payout[]
}

export async function getPeriodPayout(
  cycleId: string,
  periodNumber: number
): Promise<Payout | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM payouts WHERE cycle_id = ? AND period_number = ?',
    args: [cycleId, periodNumber],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as Payout
}

export async function getPayoutById(id: string): Promise<Payout | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM payouts WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as Payout
}

export async function createPayout(data: {
  cycle_id: string
  cycle_member_id: string
  user_id: string
  period_number: number
  amount: number
  scheduled_date: string
}): Promise<Payout> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO payouts (
      id, cycle_id, cycle_member_id, user_id, period_number, amount,
      status, scheduled_date, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.cycle_id,
      data.cycle_member_id,
      data.user_id,
      data.period_number,
      data.amount,
      'scheduled',
      data.scheduled_date,
      now,
    ],
  })

  const payout = await getPayoutById(id)
  if (!payout) {
    throw new Error('Failed to create payout')
  }
  return payout
}

export async function updatePayout(
  id: string,
  data: Partial<Omit<Payout, 'id' | 'created_at'>>
): Promise<Payout> {
  const updates: string[] = []
  const args: unknown[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`)
      args.push(value)
    }
  })

  if (updates.length === 0) {
    const payout = await getPayoutById(id)
    if (!payout) {
      throw new Error('Payout not found')
    }
    return payout
  }

  await (db.execute as any)({
    sql: `UPDATE payouts SET ${updates.join(', ')} WHERE id = ?`,
    args: [...args, id],
  })

  const payout = await getPayoutById(id)
  if (!payout) {
    throw new Error('Payout not found')
  }
  return payout
}

