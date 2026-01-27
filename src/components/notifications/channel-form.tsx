'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { NotificationChannel, NotificationChannelType } from '@/types/database'

interface ChannelFormProps {
  channel?: NotificationChannel
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChannelForm({ channel, open, onOpenChange }: ChannelFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const [name, setName] = useState(channel?.name ?? '')
  const [type, setType] = useState<NotificationChannelType>(channel?.type ?? 'slack')
  const [isActive, setIsActive] = useState(channel?.is_active ?? true)
  const [webhookUrl, setWebhookUrl] = useState(channel?.config?.webhook_url ?? '')
  const [email, setEmail] = useState(channel?.config?.email ?? '')

  const mode = channel ? 'edit' : 'create'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const config: Record<string, string> = {}
      if (type === 'slack' || type === 'discord') {
        config.webhook_url = webhookUrl
      } else if (type === 'email') {
        config.email = email
      }

      const body = {
        name,
        type,
        config,
        is_active: isActive,
      }

      const endpoint = mode === 'create'
        ? '/api/notifications/channels'
        : `/api/notifications/channels/${channel?.id}`

      const response = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error ?? 'Failed to save channel')
        return
      }

      toast.success(mode === 'create' ? 'Channel created' : 'Channel updated')
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTest = async () => {
    if (!channel?.id) return

    setIsTesting(true)
    try {
      const response = await fetch(`/api/notifications/channels/${channel.id}/test`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Test notification sent!')
      } else {
        toast.error(result.error ?? 'Failed to send test notification')
      }
    } catch {
      toast.error('Failed to send test notification')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Notification Channel' : 'Edit Channel'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Configure a new notification channel for alerts'
              : 'Update channel settings'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Slack Channel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Channel Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as NotificationChannelType)}
                disabled={mode === 'edit'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="discord">Discord</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(type === 'slack' || type === 'discord') && (
              <div className="space-y-2">
                <Label htmlFor="webhook">Webhook URL</Label>
                <Input
                  id="webhook"
                  type="url"
                  placeholder={
                    type === 'slack'
                      ? 'https://hooks.slack.com/services/...'
                      : 'https://discord.com/api/webhooks/...'
                  }
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  required
                />
              </div>
            )}

            {type === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alerts@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            {mode === 'edit' && channel?.id && (
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={isTesting}
              >
                {isTesting ? 'Sending...' : 'Send Test'}
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
