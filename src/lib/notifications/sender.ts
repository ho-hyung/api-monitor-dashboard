import type { NotificationChannel, Monitor } from '@/types/database'
import { sendSlackNotification } from './slack'
import { sendDiscordNotification } from './discord'
import { sendEmailNotification } from './email'

interface SendResult {
  success: boolean
  error?: string
}

export async function sendNotification(
  channel: NotificationChannel,
  monitor: Monitor,
  status: 'down' | 'up',
  message: string
): Promise<SendResult> {
  if (!channel.is_active) {
    return { success: false, error: 'Channel is not active' }
  }

  switch (channel.type) {
    case 'slack': {
      const webhookUrl = channel.config.webhook_url
      if (!webhookUrl) {
        return { success: false, error: 'Slack webhook URL not configured' }
      }
      return sendSlackNotification(webhookUrl, message, monitor.name, status)
    }

    case 'discord': {
      const webhookUrl = channel.config.webhook_url
      if (!webhookUrl) {
        return { success: false, error: 'Discord webhook URL not configured' }
      }
      return sendDiscordNotification(webhookUrl, message, monitor.name, status)
    }

    case 'email': {
      const email = channel.config.email
      if (!email) {
        return { success: false, error: 'Email address not configured' }
      }
      return sendEmailNotification(email, message, monitor.name, status)
    }

    default:
      return { success: false, error: `Unknown channel type: ${channel.type}` }
  }
}
