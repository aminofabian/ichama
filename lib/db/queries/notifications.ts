import { nanoid } from 'nanoid'
import db from '../client'
import type { Notification } from '@/lib/types/notification'

export type NotificationType =
  | 'contribution_reminder'
  | 'contribution_confirmed'
  | 'contribution_overdue'
  | 'payout_scheduled'
  | 'payout_sent'
  | 'payout_received'
  | 'cycle_started'
  | 'cycle_ended'
  | 'cycle_period_advanced'
  | 'member_joined'
  | 'member_left'
  | 'member_removed'
  | 'invite_received'
  | 'invite_accepted'
  | 'announcement'
  | 'dispute_update'
  | 'rating_changed'
  | 'system'

export interface CreateNotificationData {
  user_id: string
  type: NotificationType
  title: string
  message: string
  data?: string | null
  chama_id?: string | null
}

export async function createNotification(
  data: CreateNotificationData
): Promise<Notification> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO notifications (id, user_id, type, title, message, data, chama_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.user_id,
      data.type,
      data.title,
      data.message,
      data.data || null,
      data.chama_id || null,
      now,
    ],
  })

  const notification = await getNotificationById(id)
  if (!notification) {
    throw new Error('Failed to create notification')
  }
  return notification
}

export async function getNotificationById(id: string): Promise<Notification | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM notifications WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as Notification
}

export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  let sql = `SELECT * FROM notifications WHERE user_id = ?`
  const args: unknown[] = [userId]

  if (unreadOnly) {
    sql += ' AND read_at IS NULL'
  }

  sql += ' ORDER BY created_at DESC LIMIT ?'
  args.push(limit)

  const result = await db.execute({ sql, args })

  return result.rows as unknown as Notification[]
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE notifications SET read_at = ? WHERE id = ?',
    args: [new Date().toISOString(), id],
  })
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL',
    args: [new Date().toISOString(), userId],
  })
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const result = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL',
    args: [userId],
  })

  return (result.rows[0]?.count as number) || 0
}

export async function deleteNotification(id: string): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM notifications WHERE id = ?',
    args: [id],
  })
}

export async function createCycleNotifications(
  cycleId: string,
  chamaId: string,
  type: 'cycle_started' | 'cycle_ended' | 'cycle_period_advanced',
  additionalData?: Record<string, unknown>
): Promise<void> {
  // Get all chama members
  const { getChamaMembers } = await import('./chama-members')
  const members = await getChamaMembers(chamaId)

  const { getCycleById } = await import('./cycles')
  const cycle = await getCycleById(cycleId)
  if (!cycle) {
    throw new Error('Cycle not found')
  }

  let title = ''
  let message = ''

  switch (type) {
    case 'cycle_started':
      title = `Cycle "${cycle.name}" Started`
      message = `The contribution cycle "${cycle.name}" has started. Your first contribution of ${cycle.contribution_amount} KES is due soon.`
      break
    case 'cycle_ended':
      title = `Cycle "${cycle.name}" Completed`
      message = `The contribution cycle "${cycle.name}" has been completed. Thank you for your participation!`
      break
    case 'cycle_period_advanced':
      title = `Cycle "${cycle.name}" - Period Advanced`
      message = `Period ${cycle.current_period} has started. Your contribution of ${cycle.contribution_amount} KES is due.`
      break
  }

  // Create notifications for all members
  const notifications = members.map((member) => ({
    user_id: member.user_id,
    type,
    title,
    message,
    data: JSON.stringify({
      cycle_id: cycleId,
      chama_id: chamaId,
      ...additionalData,
    }),
    chama_id: chamaId,
  }))

  // Batch insert notifications
  const statements = notifications.map((notif) => ({
    sql: `INSERT INTO notifications (id, user_id, type, title, message, data, chama_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      nanoid(),
      notif.user_id,
      notif.type,
      notif.title,
      notif.message,
      notif.data,
      notif.chama_id,
      new Date().toISOString(),
    ],
  }))

  await db.batch(statements)
}

