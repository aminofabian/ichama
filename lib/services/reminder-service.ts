import { normalizePhone } from '@/lib/utils/phone'
import { formatCurrency, formatDate } from '@/lib/utils/format'

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0'
const WHATSAPP_API_BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`

export type ReminderType = 'period_started' | 'three_days_before' | 'one_day_before' | 'due_date'

interface ContributionReminderData {
  userName: string
  chamaName: string
  cycleName: string
  amountDue: number
  dueDate: string
  daysUntilDue: number
  periodNumber: number
}

function replaceTemplateVariables(
  template: string,
  data: ContributionReminderData
): string {
  const { userName, chamaName, cycleName, amountDue, dueDate, daysUntilDue, periodNumber } = data
  const amount = formatCurrency(amountDue)
  const formattedDate = formatDate(dueDate)

  return template
    .replace(/\{\{userName\}\}/g, userName)
    .replace(/\{\{chamaName\}\}/g, chamaName)
    .replace(/\{\{cycleName\}\}/g, cycleName)
    .replace(/\{\{amount\}\}/g, amount)
    .replace(/\{\{dueDate\}\}/g, formattedDate)
    .replace(/\{\{daysUntilDue\}\}/g, daysUntilDue.toString())
    .replace(/\{\{periodNumber\}\}/g, periodNumber.toString())
}

function getDefaultTemplate(type: ReminderType): string {
  switch (type) {
    case 'period_started':
      return `🎉 Hello {{userName}}!\n\nA new period has started for "{{cycleName}}" in {{chamaName}}.\n\n💰 Contribution Amount: {{amount}}\n📅 Due Date: {{dueDate}}\n⏰ You have {{daysUntilDue}} days to make your contribution.\n\nDon't forget to contribute on time! 💪`

    case 'three_days_before':
      return `⏰ Reminder: {{userName}}\n\nYour contribution for "{{cycleName}}" in {{chamaName}} is due in 3 days.\n\n💰 Amount: {{amount}}\n📅 Due Date: {{dueDate}}\n\nPlease make your contribution soon to avoid any delays. 🙏`

    case 'one_day_before':
      return `🚨 Final Reminder: {{userName}}\n\nYour contribution for "{{cycleName}}" in {{chamaName}} is due TOMORROW!\n\n💰 Amount: {{amount}}\n📅 Due Date: {{dueDate}}\n\nPlease make your contribution today to stay on track. ⚡`

    case 'due_date':
      return `📢 Today's the Day, {{userName}}!\n\nYour contribution for "{{cycleName}}" in {{chamaName}} is due TODAY.\n\n💰 Amount: {{amount}}\n📅 Due Date: {{dueDate}}\n\nPlease make your contribution now to complete your payment. ✅`

    default:
      return `Reminder: Your contribution of {{amount}} for "{{cycleName}}" in {{chamaName}} is due on {{dueDate}}.`
  }
}

async function createReminderMessage(
  type: ReminderType,
  data: ContributionReminderData
): Promise<string> {
  try {
    const { getReminderTemplate } = await import('@/lib/db/queries/reminder-templates')
    const template = await getReminderTemplate(type)
    
    const templateText = template?.template_text || getDefaultTemplate(type)
    return replaceTemplateVariables(templateText, data)
  } catch (error) {
    console.error('Error loading reminder template, using default:', error)
    return replaceTemplateVariables(getDefaultTemplate(type), data)
  }
}

export async function sendContributionReminder(
  phoneNumber: string,
  type: ReminderType,
  data: ContributionReminderData
): Promise<boolean> {
  const { areRemindersEnabled, isReminderTypeEnabled } = await import('@/lib/db/queries/reminder-templates')
  
  const remindersEnabled = await areRemindersEnabled()
  if (!remindersEnabled) {
    console.log('Reminders are disabled globally')
    return false
  }

  const typeEnabled = await isReminderTypeEnabled(type)
  if (!typeEnabled) {
    console.log(`Reminder type ${type} is disabled`)
    return false
  }

  const message = await createReminderMessage(type, data)

  if (process.env.NODE_ENV !== 'production') {
    console.log('\n========================================')
    console.log(`💬 WhatsApp Reminder (${type}) to ${phoneNumber}:`)
    console.log(message)
    console.log('========================================\n')
    return true
  }

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp service not configured, skipping reminder send')
    return false
  }

  const normalizedPhone = normalizePhone(phoneNumber)
  const phoneNumberId = WHATSAPP_PHONE_NUMBER_ID

  try {
    const response = await fetch(
      `${WHATSAPP_API_BASE_URL}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedPhone,
          type: 'text',
          text: {
            body: message,
          },
        }),
      }
    )

    const responseText = await response.text()

    if (!response.ok) {
      let errorMessage = 'Unknown error'
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = JSON.stringify(errorData.error || errorData)
      } catch {
        errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`
      }
      console.error(`WhatsApp API error for reminder: ${errorMessage}`)
      return false
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      console.error('WhatsApp API returned invalid JSON response')
      return false
    }

    if (result.error) {
      console.error(`WhatsApp API error: ${JSON.stringify(result.error)}`)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send WhatsApp reminder:', error)
    return false
  }
}

