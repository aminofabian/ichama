import { nanoid } from 'nanoid'
import db from '../client'
import type { ReminderType } from '@/lib/services/reminder-service'

export interface ContributionReminder {
  id: string
  contribution_id: string
  reminder_type: ReminderType
  sent_at: string
  created_at: string
}

export async function hasReminderBeenSent(
  contributionId: string,
  reminderType: ReminderType
): Promise<boolean> {
  const result = await db.execute({
    sql: 'SELECT id FROM contribution_reminders WHERE contribution_id = ? AND reminder_type = ?',
    args: [contributionId, reminderType],
  })

  return result.rows.length > 0
}

export async function recordReminderSent(
  contributionId: string,
  reminderType: ReminderType
): Promise<void> {
  await db.execute({
    sql: `INSERT INTO contribution_reminders (id, contribution_id, reminder_type, sent_at, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [
      nanoid(),
      contributionId,
      reminderType,
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  })
}

export async function getContributionsNeedingReminders(): Promise<
  Array<{
    contribution_id: string
    user_id: string
    user_phone: string
    user_name: string
    chama_name: string
    cycle_name: string
    amount_due: number
    due_date: string
    period_number: number
    days_until_due: number
  }>
> {
  const result = await db.execute({
    sql: `
      SELECT 
        c.id as contribution_id,
        c.user_id,
        u.phone_number as user_phone,
        u.full_name as user_name,
        ch.name as chama_name,
        cy.name as cycle_name,
        c.amount_due,
        c.due_date,
        c.period_number,
        CAST(
          ROUND(julianday(c.due_date) - julianday('now')) AS INTEGER
        ) as days_until_due
      FROM contributions c
      INNER JOIN users u ON c.user_id = u.id
      INNER JOIN cycles cy ON c.cycle_id = cy.id
      INNER JOIN chamas ch ON cy.chama_id = ch.id
      WHERE c.status IN ('pending', 'partial')
        AND c.due_date IS NOT NULL
        AND CAST(ROUND(julianday(c.due_date) - julianday('now')) AS INTEGER) >= 0
        AND CAST(ROUND(julianday(c.due_date) - julianday('now')) AS INTEGER) <= 7
        AND cy.status = 'active'
    `,
    args: [],
  })

  return result.rows as unknown as Array<{
    contribution_id: string
    user_id: string
    user_phone: string
    user_name: string
    chama_name: string
    cycle_name: string
    amount_due: number
    due_date: string
    period_number: number
    days_until_due: number
  }>
}

