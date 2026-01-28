'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Monitor, AuthProfile } from '@/types/database'

interface MonitorFormProps {
  monitor?: Monitor
  mode: 'create' | 'edit'
}

export function MonitorForm({ monitor, mode }: MonitorFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [authProfiles, setAuthProfiles] = useState<AuthProfile[]>([])

  const [name, setName] = useState(monitor?.name ?? '')
  const [url, setUrl] = useState(monitor?.url ?? '')
  const [method, setMethod] = useState<'GET' | 'POST' | 'HEAD'>(monitor?.method ?? 'GET')
  const [intervalSeconds, setIntervalSeconds] = useState(monitor?.interval_seconds ?? 300)
  const [isPublic, setIsPublic] = useState(monitor?.is_public ?? false)
  const [authProfileId, setAuthProfileId] = useState<string | null>(monitor?.auth_profile_id ?? null)
  const [skipSslVerify, setSkipSslVerify] = useState(monitor?.skip_ssl_verify ?? false)

  // Fetch auth profiles
  useEffect(() => {
    fetch('/api/auth-profiles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAuthProfiles(data)
        }
      })
      .catch(err => console.error('Failed to fetch auth profiles:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const body = {
        name,
        url,
        method,
        interval_seconds: intervalSeconds,
        is_public: isPublic,
        auth_profile_id: authProfileId,
        skip_ssl_verify: skipSslVerify,
      }

      const endpoint = mode === 'create'
        ? '/api/monitors'
        : `/api/monitors/${monitor?.id}`

      const response = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error ?? 'Failed to save monitor')
        return
      }

      toast.success(mode === 'create' ? 'Monitor created' : 'Monitor updated')
      router.push(mode === 'create' ? `/monitors/${result.data.id}` : `/monitors/${monitor?.id}`)
      router.refresh()
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create Monitor' : 'Edit Monitor'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Add a new API endpoint to monitor'
            : 'Update monitor settings'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My API"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://api.example.com/health"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as 'GET' | 'POST' | 'HEAD')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Check Interval</Label>
              <Select
                value={intervalSeconds.toString()}
                onValueChange={(v) => setIntervalSeconds(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="600">10 minutes</SelectItem>
                  <SelectItem value="1800">30 minutes</SelectItem>
                  <SelectItem value="3600">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="authProfile">Authentication Profile</Label>
            <Select
              value={authProfileId ?? 'none'}
              onValueChange={(v) => setAuthProfileId(v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select auth profile (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Authentication</SelectItem>
                {authProfiles.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Select an auth profile if this API requires authentication
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="public">Show on public status page</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="skipSsl"
              checked={skipSslVerify}
              onCheckedChange={setSkipSslVerify}
            />
            <Label htmlFor="skipSsl">Skip SSL certificate verification</Label>
          </div>
          {skipSslVerify && (
            <p className="text-xs text-amber-600">
              Warning: Only enable this for self-signed certificates in trusted environments
            </p>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'create' ? 'Create Monitor' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
