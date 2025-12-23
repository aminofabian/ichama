import { createNotification } from '@/lib/db/queries/notifications'
import { getChamaMembers } from '@/lib/db/queries/chama-members'
import { getCycleById } from '@/lib/db/queries/cycles'
import { getChamaById } from '@/lib/db/queries/chamas'
import { formatCurrency } from '@/lib/utils/format'
import type { NotificationType } from '@/lib/db/queries/notifications'

export async function notifyUser(
  userId: string,
  type: NotificationType,
  data: {
    title?: string
    message?: string
    chama_id?: string | null
    data?: Record<string, unknown>
  }
): Promise<void> {
  const { title, message } = getNotificationContent(type, data.data || {})

  await createNotification({
    user_id: userId,
    type,
    title: data.title || title,
    message: data.message || message,
    chama_id: data.chama_id || null,
    data: data.data ? JSON.stringify(data.data) : null,
  })
}

export async function notifyChamaMembers(
  chamaId: string,
  type: NotificationType,
  notificationData: {
    title?: string
    message?: string
    data?: Record<string, unknown>
  }
): Promise<void> {
  const members = await getChamaMembers(chamaId)

  const { title, message } = getNotificationContent(type, notificationData.data || {})

  for (const member of members) {
    await createNotification({
      user_id: member.user_id,
      type,
      title: notificationData.title || title,
      message: notificationData.message || message,
      chama_id: chamaId,
      data: notificationData.data ? JSON.stringify(notificationData.data) : null,
    })
  }
}

function getNotificationContent(
  type: NotificationType,
  data: Record<string, unknown>
): { title: string; message: string } {
  switch (type) {
    case 'contribution_reminder':
      return {
        title: 'Contribution Reminder',
        message: `Your contribution is due soon. Please make your payment to avoid any delays.`,
      }
    case 'contribution_confirmed':
      return {
        title: 'Contribution Confirmed',
        message: `Your contribution has been confirmed by the admin.`,
      }
    case 'contribution_overdue':
      return {
        title: 'Contribution Overdue',
        message: `Your contribution is overdue. Please make your payment as soon as possible.`,
      }
    case 'payout_scheduled':
      return {
        title: 'Payout Scheduled',
        message: `You are scheduled to receive a payout. The payout will be processed on the scheduled date.`,
      }
    case 'payout_sent':
      return {
        title: 'Payout Sent',
        message: `Your payout has been sent. Please confirm receipt when you receive it.`,
      }
    case 'payout_received':
      return {
        title: 'Payout Received',
        message: `Your payout has been confirmed by the recipient.`,
      }
    case 'cycle_started':
      return {
        title: 'Cycle Started',
        message: `A new cycle has started. You can now make your contributions.`,
      }
    case 'cycle_ended':
      return {
        title: 'Cycle Ended',
        message: `The cycle has ended. All contributions have been completed.`,
      }
    case 'cycle_period_advanced':
      return {
        title: 'Period Advanced',
        message: `The cycle has advanced to the next period.`,
      }
    case 'member_joined':
      return {
        title: 'Member Joined',
        message: `A new member has joined the chama.`,
      }
    case 'member_left':
      return {
        title: 'Member Left',
        message: `A member has left the chama.`,
      }
    case 'member_removed':
      return {
        title: 'Member Removed',
        message: `A member has been removed from the chama.`,
      }
    case 'invite_received':
      return {
        title: 'Invite Received',
        message: `You have been invited to join a chama.`,
      }
    case 'invite_accepted':
      return {
        title: 'Invite Accepted',
        message: `Your invite has been accepted.`,
      }
    case 'announcement':
      return {
        title: 'New Announcement',
        message: `There is a new announcement in your chama.`,
      }
    default:
      return {
        title: 'Notification',
        message: `You have a new notification.`,
      }
  }
}

