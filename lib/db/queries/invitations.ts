import { nanoid } from 'nanoid'
import db from '../client'
import type { Invitation } from '../../types/chama'

export async function createInvitation(
  chamaId: string,
  invitedBy: string,
  expiresAt: string
): Promise<Invitation> {
  const id = nanoid()
  const code = nanoid(8).toUpperCase()
  const createdAt = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO invitations (id, chama_id, invited_by, invite_code, expires_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, chamaId, invitedBy, code, expiresAt, createdAt],
  })

  return {
    id,
    chama_id: chamaId,
    invited_by: invitedBy,
    invited_phone: null,
    invited_email: null,
    invite_code: code,
    status: 'pending',
    expires_at: expiresAt,
    accepted_at: null,
    created_at: createdAt,
  } as Invitation
}

export async function getInvitationByCode(code: string): Promise<Invitation | null> {
  const result = await db.execute({
    sql: `SELECT * FROM invitations 
          WHERE invite_code = ? AND status = 'pending'
          ORDER BY created_at DESC
          LIMIT 1`,
    args: [code],
  })

  if (result.rows.length === 0) {
    return null
  }

  const invitation = result.rows[0] as unknown as Invitation

  // Check if expired
  if (new Date(invitation.expires_at) < new Date()) {
    return null
  }

  return invitation
}

export async function acceptInvitation(id: string, userId: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE invitations SET status = ?, accepted_at = ? WHERE id = ?',
    args: ['accepted', new Date().toISOString(), id],
  })
}

export async function expireInvitation(id: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE invitations SET status = ? WHERE id = ?',
    args: ['expired', id],
  })
}

export async function getChamaInvitations(chamaId: string): Promise<Invitation[]> {
  const result = await db.execute({
    sql: `SELECT * FROM invitations 
          WHERE chama_id = ?
          ORDER BY created_at DESC`,
    args: [chamaId],
  })

  return result.rows as unknown as Invitation[]
}

