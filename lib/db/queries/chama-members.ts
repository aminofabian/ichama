import { nanoid } from 'nanoid'
import db from '../client'
import type { ChamaMember } from '../../types/chama'

export async function addChamaMember(
  chamaId: string,
  userId: string,
  role: 'admin' | 'member' = 'member'
): Promise<ChamaMember> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO chama_members (id, chama_id, user_id, role, status, joined_at)
          VALUES (?, ?, ?, ?, 'active', ?)`,
    args: [id, chamaId, userId, role, now],
  })

  return {
    id,
    chama_id: chamaId,
    user_id: userId,
    role,
    status: 'active',
    joined_at: now,
  } as ChamaMember
}

export async function getChamaMember(
  chamaId: string,
  userId: string
): Promise<ChamaMember | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM chama_members WHERE chama_id = ? AND user_id = ?',
    args: [chamaId, userId],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as ChamaMember
}

export async function getChamaMembers(chamaId: string): Promise<ChamaMember[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM chama_members WHERE chama_id = ? AND status = ?',
    args: [chamaId, 'active'],
  })

  return result.rows as unknown as ChamaMember[]
}

export async function updateChamaMember(
  id: string,
  data: Partial<Omit<ChamaMember, 'id' | 'chama_id' | 'user_id' | 'joined_at'>>
): Promise<ChamaMember> {
  const updates: string[] = []
  const args: (string | number | null)[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`)
      args.push(value as string | number | null)
    }
  })

  if (updates.length === 0) {
    const result = await db.execute({
      sql: 'SELECT * FROM chama_members WHERE id = ?',
      args: [id],
    })
    if (result.rows.length === 0) {
      throw new Error('Chama member not found')
    }
    return result.rows[0] as unknown as ChamaMember
  }

  args.push(id)

  await db.execute({
    sql: `UPDATE chama_members SET ${updates.join(', ')} WHERE id = ?`,
    args: args as unknown[],
  })

  const result = await db.execute({
    sql: 'SELECT * FROM chama_members WHERE id = ?',
    args: [id],
  })
  if (result.rows.length === 0) {
    throw new Error('Chama member not found')
  }
  return result.rows[0] as unknown as ChamaMember
}

export async function removeChamaMember(id: string): Promise<void> {
  await db.execute({
    sql: "UPDATE chama_members SET status = 'removed', removed_at = ? WHERE id = ?",
    args: [new Date().toISOString(), id],
  })
}

