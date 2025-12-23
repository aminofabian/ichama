import { nanoid } from 'nanoid'
import db from '../client'
import type { User } from '../../types/user'

export async function createUser(data: {
  fullName: string
  phoneNumber: string
  passwordHash: string
  email?: string | null
}): Promise<User> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO users (id, full_name, phone_number, password_hash, email, phone_verified_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.fullName,
      data.phoneNumber,
      data.passwordHash,
      data.email || null,
      now,
      now,
      now,
    ],
  })

  const user = await getUserById(id)
  if (!user) {
    throw new Error('Failed to create user')
  }
  return user
}

export async function getUserByPhone(phoneNumber: string): Promise<User | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE phone_number = ?',
    args: [phoneNumber],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as User
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as User
}

export async function updateUser(
  id: string,
  data: Partial<Omit<User, 'id' | 'created_at'>>
): Promise<User> {
  const updates: string[] = []
  const args: unknown[] = []

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = ?`)
      args.push(value)
    }
  })

  if (updates.length === 0) {
    const user = await getUserById(id)
    if (!user) {
      throw new Error('User not found')
    }
    return user
  }

  updates.push('updated_at = ?')
  args.push(new Date().toISOString())
  args.push(id)

  await (db.execute as any)({
    sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    args,
  })

  const user = await getUserById(id)
  if (!user) {
    throw new Error('User not found')
  }
  return user
}

export async function markPhoneVerified(userId: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE users SET phone_verified_at = ? WHERE id = ?',
    args: [new Date().toISOString(), userId],
  })
}

