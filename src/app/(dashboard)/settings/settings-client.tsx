'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Globe, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'

interface StatusPageSettings {
  id: string
  slug: string
  title: string
  description: string | null
  theme_color: string
  is_public: boolean
}

interface SettingsClientProps {
  user: User | null
  initialStatusPage: StatusPageSettings | null
}

export function SettingsClient({ user, initialStatusPage }: SettingsClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [slug, setSlug] = useState(initialStatusPage?.slug ?? '')
  const [title, setTitle] = useState(initialStatusPage?.title ?? '')
  const [description, setDescription] = useState(initialStatusPage?.description ?? '')
  const [themeColor, setThemeColor] = useState(initialStatusPage?.theme_color ?? '#000000')
  const [isPublic, setIsPublic] = useState(initialStatusPage?.is_public ?? true)

  const handleSaveStatusPage = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/status-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title,
          description: description || null,
          theme_color: themeColor,
          is_public: isPublic,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error ?? 'Failed to save settings')
        return
      }

      toast.success('Status page settings saved')
      router.refresh()
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsLoading(false)
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure your status page and account settings
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Public Status Page
            </CardTitle>
            <CardDescription>
              Configure your public-facing status page
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveStatusPage}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Page URL</Label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center">
                    <span className="text-sm text-muted-foreground mr-2 whitespace-nowrap">
                      {appUrl}/status/
                    </span>
                    <Input
                      id="slug"
                      placeholder="my-company"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1"
                      required
                    />
                  </div>
                  {slug && (
                    <a
                      href={`/status/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button type="button" variant="outline" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and hyphens allowed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  placeholder="My Company Status"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Real-time status and incident updates for our services"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="themeColor">Theme Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="themeColor"
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="flex-1"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public">Make status page publicly accessible</Label>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Status Page Settings'}
              </Button>
            </CardContent>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={user?.id ?? ''} disabled className="font-mono text-sm" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
