import db from '../client'
import type { Chama, ChamaMember } from '../../types/chama'

export interface ChamaWithMember extends Chama {
  member_role: string
  member_status: string
  joined_at: string
}

export async function getUserChamas(userId: string): Promise<ChamaWithMember[]> {
  const result = await db.execute({
    sql: `SELECT c.*, cm.role as member_role, cm.status as member_status, cm.joined_at
          FROM chamas c
          INNER JOIN chama_members cm ON c.id = cm.chama_id
          WHERE cm.user_id = ? AND cm.status = 'active'
          ORDER BY c.created_at DESC`,
    args: [userId],
  })

  return result.rows as unknown as ChamaWithMember[]
}

export async function getChamaById(id: string): Promise<Chama | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM chamas WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as Chama
}

export async function getChamaByInviteCode(inviteCode: string): Promise<Chama | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM chamas WHERE invite_code = ?',
    args: [inviteCode],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as Chama
}

export async function createChama(data: {
  name: string
  description: string | null
  created_by: string
  chama_type: 'savings' | 'merry_go_round' | 'hybrid'
  invite_code: string
  is_private: number
  max_members: number
}): Promise<Chama> {
  const { nanoid } = await import('nanoid')
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO chamas (id, name, description, created_by, chama_type, invite_code, is_private, max_members, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.name,
      data.description || null,
      data.created_by,
      data.chama_type,
      data.invite_code,
      data.is_private,
      data.max_members,
      now,
      now,
    ],
  })

  const chama = await getChamaById(id)
  if (!chama) {
    throw new Error('Failed to create chama')
  }
  return chama
}

export async function updateChama(
  id: string,
  data: Partial<Omit<Chama, 'id' | 'created_at'>>
): Promise<Chama> {
  const updates: string[] = []
  const args: unknown[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`)
      args.push(value)
    }
  })

  if (updates.length === 0) {
    const chama = await getChamaById(id)
    if (!chama) {
      throw new Error('Chama not found')
    }
    return chama
  }

  updates.push('updated_at = ?')
  args.push(new Date().toISOString())
  args.push(id)

  await (db.execute as any)({
    sql: `UPDATE chamas SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  const chama = await getChamaById(id)
  if (!chama) {
    throw new Error('Chama not found')
  }
  return chama
}

export async function getChamaMembers(chamaId: string): Promise<ChamaMember[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM chama_members WHERE chama_id = ? AND status = ?',
    args: [chamaId, 'active'],
  })

  return result.rows as unknown as ChamaMember[]
}

