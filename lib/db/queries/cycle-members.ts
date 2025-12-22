import { nanoid } from 'nanoid'
import db from '../client'
import type { CycleMember } from '../../types/cycle'
import { getChamaMember } from './chama-members'

export interface CycleMemberInput {
  user_id: string
  chama_member_id: string
  turn_order: number
  assigned_number: number
}

export async function addCycleMembers(
  cycleId: string,
  chamaId: string,
  members: CycleMemberInput[]
): Promise<CycleMember[]> {
  const cycleMembers: CycleMember[] = []

  for (const member of members) {
    const id = nanoid()
    const now = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO cycle_members (
        id, cycle_id, chama_member_id, user_id, assigned_number, 
        turn_order, status, joined_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        cycleId,
        member.chama_member_id,
        member.user_id,
        member.assigned_number,
        member.turn_order,
        'active',
        now,
      ],
    })

    const cycleMember = await getCycleMemberById(id)
    if (cycleMember) {
      cycleMembers.push(cycleMember)
    }
  }

  return cycleMembers
}

async function getCycleMemberById(id: string): Promise<CycleMember | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM cycle_members WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as CycleMember
}

export async function getCycleMembers(cycleId: string): Promise<CycleMember[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM cycle_members WHERE cycle_id = ? ORDER BY turn_order ASC',
    args: [cycleId],
  })

  return result.rows as unknown as CycleMember[]
}

export async function updateCycleMember(
  id: string,
  data: Partial<Omit<CycleMember, 'id' | 'cycle_id' | 'joined_at'>>
): Promise<CycleMember> {
  const updates: string[] = []
  const args: unknown[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`)
      args.push(value)
    }
  })

  if (updates.length === 0) {
    const result = await db.execute({
      sql: 'SELECT * FROM cycle_members WHERE id = ?',
      args: [id],
    })
    if (result.rows.length === 0) {
      throw new Error('Cycle member not found')
    }
    return result.rows[0] as unknown as CycleMember
  }

  args.push(id)

  await db.execute({
    sql: `UPDATE cycle_members SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  const result = await db.execute({
    sql: 'SELECT * FROM cycle_members WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    throw new Error('Cycle member not found')
  }

  return result.rows[0] as unknown as CycleMember
}

export async function shuffleTurnOrder(cycleId: string): Promise<void> {
  const members = await getCycleMembers(cycleId)

  // Shuffle turn orders
  const shuffled = [...members]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  // Update turn orders
  for (let i = 0; i < shuffled.length; i++) {
    await updateCycleMember(shuffled[i].id, { turn_order: i + 1, assigned_number: i + 1 })
  }
}

