import { z } from 'zod'

export const slackConfigSchema = z.object({
  webhook_url: z.string().url().startsWith('https://hooks.slack.com'),
})

export const discordConfigSchema = z.object({
  webhook_url: z.string().url().startsWith('https://discord.com/api/webhooks'),
})

export const emailConfigSchema = z.object({
  email: z.string().email(),
})

export const notificationChannelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(['slack', 'discord', 'email']),
  config: z.record(z.string(), z.string()),
  is_active: z.boolean().default(true),
})

export const notificationChannelUpdateSchema = notificationChannelSchema.partial()

export const alertRuleSchema = z.object({
  monitor_id: z.string().uuid(),
  channel_id: z.string().uuid(),
  trigger_after_failures: z.number().int().min(1).max(10).default(1),
  notify_on_recovery: z.boolean().default(true),
})

export type NotificationChannelInput = z.infer<typeof notificationChannelSchema>
export type AlertRuleInput = z.infer<typeof alertRuleSchema>
