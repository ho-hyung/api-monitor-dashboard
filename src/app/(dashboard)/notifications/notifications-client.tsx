'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChannelForm } from '@/components/notifications/channel-form'
import { Plus, Bell, MessageSquare, Mail, MoreHorizontal, Pencil, Trash2, Send } from 'lucide-react'
import { toast } from 'sonner'
import type { NotificationChannel } from '@/types/database'

interface NotificationsClientProps {
  initialChannels: NotificationChannel[]
}

export function NotificationsClient({ initialChannels }: NotificationsClientProps) {
  const router = useRouter()
  const [channels] = useState(initialChannels)
  const [showForm, setShowForm] = useState(false)
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | undefined>()

  const channelIcons = {
    slack: MessageSquare,
    discord: MessageSquare,
    email: Mail,
  }

  const handleEdit = (channel: NotificationChannel) => {
    setEditingChannel(channel)
    setShowForm(true)
  }

  const handleDelete = async (channel: NotificationChannel) => {
    if (!confirm(`Delete "${channel.name}"? This will also delete all associated alert rules.`)) {
      return
    }

    try {
      const response = await fetch(`/api/notifications/channels/${channel.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error ?? 'Failed to delete channel')
        return
      }

      toast.success('Channel deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete channel')
    }
  }

  const handleTest = async (channel: NotificationChannel) => {
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
    }
  }

  const handleFormClose = (open: boolean) => {
    setShowForm(open)
    if (!open) {
      setEditingChannel(undefined)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Configure notification channels for alerts
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Channel
        </Button>
      </div>

      {channels.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => {
            const Icon = channelIcons[channel.type as keyof typeof channelIcons] ?? Bell
            return (
              <Card key={channel.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{channel.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={channel.is_active ? 'default' : 'secondary'}>
                        {channel.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(channel)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTest(channel)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send Test
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(channel)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardDescription className="capitalize">
                    {channel.type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground truncate">
                    {channel.type === 'email'
                      ? channel.config.email
                      : channel.config.webhook_url?.slice(0, 50) + '...'
                    }
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No notification channels configured yet.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Channel
            </Button>
          </CardContent>
        </Card>
      )}

      <ChannelForm
        channel={editingChannel}
        open={showForm}
        onOpenChange={handleFormClose}
      />
    </div>
  )
}
