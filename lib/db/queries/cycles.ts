import { nanoid } from 'nanoid'
import db from '../client'
import type { Cycle } from '../../types/cycle'

export async function createCycle(data: {
  chama_id: string
  name: string
  contribution_amount: number
  payout_amount: number
  savings_amount: number
  service_fee: number
  frequency: 'weekly' | 'biweekly' | 'monthly'
  start_date: string
  total_periods: number
  created_by: string
}): Promise<Cycle> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO cycles (
      id, chama_id, name, contribution_amount, payout_amount, 
      savings_amount, service_fee, frequency, total_periods, 
      current_period, start_date, end_date, status, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.chama_id,
      data.name,
      data.contribution_amount,
      data.payout_amount,
      data.savings_amount,
      data.service_fee,
      data.frequency,
      data.total_periods,
      0, // current_period starts at 0 (not started)
      data.start_date,
      null, // end_date starts as null
      'pending', // status starts as pending
      data.created_by,
      now,
      now,
    ],
  })

  const cycle = await getCycleById(id)
  if (!cycle) {
    throw new Error('Failed to create cycle')
  }

  return cycle
}

export async function getCycleById(id: string): Promise<Cycle | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM cycles WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as Cycle
}

export async function getChamasCycles(chamaId: string): Promise<Cycle[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM cycles WHERE chama_id = ? ORDER BY created_at DESC',
    args: [chamaId],
  })

  return result.rows as unknown as Cycle[]
}

export async function getActiveCycle(chamaId: string): Promise<Cycle | null> {
  const result = await db.execute({
    sql: "SELECT * FROM cycles WHERE chama_id = ? AND status = 'active' LIMIT 1",
    args: [chamaId],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as Cycle
}

export async function updateCycle(
  id: string,
  data: Partial<Omit<Cycle, 'id' | 'created_at'>>
): Promise<Cycle> {
  const updates: string[] = []
  const args: unknown[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`)
      args.push(value)
    }
  })

  if (updates.length === 0) {
    const cycle = await getCycleById(id)
    if (!cycle) {
      throw new Error('Cycle not found')
    }
    return cycle
  }

  updates.push('updated_at = ?')
  args.push(new Date().toISOString())
  args.push(id)

  await db.execute({
    sql: `UPDATE cycles SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  const cycle = await getCycleById(id)
  if (!cycle) {
    throw new Error('Cycle not found')
  }

  return cycle
}

