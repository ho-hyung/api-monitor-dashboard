import { z } from 'zod'

export const monitorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  url: z.string().url('Invalid URL format'),
  method: z.enum(['GET', 'POST', 'HEAD']).default('GET'),
  interval_seconds: z.number().int().min(60).max(86400).default(300),
  is_public: z.boolean().default(false),
})

export const monitorUpdateSchema = monitorSchema.partial()

export type MonitorInput = z.infer<typeof monitorSchema>
export type MonitorUpdateInput = z.infer<typeof monitorUpdateSchema>
