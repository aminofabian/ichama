import { nanoid } from 'nanoid'
import db from '../client'
import type { ReminderType } from '@/lib/services/reminder-service'

export interface ReminderTemplate {
  id: string
  reminder_type: ReminderType
  template_text: string
  is_active: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ReminderSetting {
  id: string
  setting_key: string
  setting_value: string
  description: string | null
  updated_at: string
}

export async function getReminderTemplate(
  reminderType: ReminderType
): Promise<ReminderTemplate | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM reminder_templates WHERE reminder_type = ? AND is_active = 1',
    args: [reminderType],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as ReminderTemplate
}

export async function getAllReminderTemplates(): Promise<ReminderTemplate[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM reminder_templates ORDER BY reminder_type',
    args: [],
  })

  return result.rows as unknown as ReminderTemplate[]
}

export async function createOrUpdateReminderTemplate(data: {
  reminder_type: ReminderType
  template_text: string
  is_active: number
  created_by: string
}): Promise<ReminderTemplate> {
  const existing = await db.execute({
    sql: 'SELECT id FROM reminder_templates WHERE reminder_type = ?',
    args: [data.reminder_type],
  })

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `UPDATE reminder_templates 
            SET template_text = ?, is_active = ?, updated_at = ?
            WHERE reminder_type = ?`,
      args: [
        data.template_text,
        data.is_active,
        new Date().toISOString(),
        data.reminder_type,
      ],
    })
  } else {
    await db.execute({
      sql: `INSERT INTO reminder_templates 
            (id, reminder_type, template_text, is_active, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        nanoid(),
        data.reminder_type,
        data.template_text,
        data.is_active,
        data.created_by,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    })
  }

  const template = await getReminderTemplate(data.reminder_type)
  if (!template) {
    throw new Error('Failed to create/update reminder template')
  }

  return template
}

export async function deleteReminderTemplate(reminderType: ReminderType): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM reminder_templates WHERE reminder_type = ?',
    args: [reminderType],
  })
}

export async function getReminderSetting(key: string): Promise<string | null> {
  const result = await db.execute({
    sql: 'SELECT setting_value FROM reminder_settings WHERE setting_key = ?',
    args: [key],
  })

  if (result.rows.length === 0) {
    return null
  }

  return (result.rows[0] as any).setting_value as string
}

export async function getAllReminderSettings(): Promise<ReminderSetting[]> {
  const result = await db.execute({
    sql: 'SELECT * FROM reminder_settings ORDER BY setting_key',
    args: [],
  })

  return result.rows as unknown as ReminderSetting[]
}

export async function updateReminderSetting(
  key: string,
  value: string
): Promise<void> {
  await db.execute({
    sql: `UPDATE reminder_settings 
          SET setting_value = ?, updated_at = ?
          WHERE setting_key = ?`,
    args: [value, new Date().toISOString(), key],
  })
}

export async function areRemindersEnabled(): Promise<boolean> {
  const enabled = await getReminderSetting('reminders_enabled')
  return enabled === '1'
}

export async function isReminderTypeEnabled(reminderType: ReminderType): Promise<boolean> {
  const settingKey = `send_${reminderType}` as string
  const enabled = await getReminderSetting(settingKey)
  return enabled === '1'
}

