'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Zap, Settings, Play, Star } from 'lucide-react'
import { UrlTestResultDisplay } from './url-test-result'
import { useUrlTest } from '@/hooks/use-url-test'
import { useSmartDefaults } from '@/hooks/use-smart-defaults'
import type { Monitor, AuthProfile, MonitorMethod } from '@/types/database'

interface MonitorFormProps {
  monitor?: Monitor
  mode: 'create' | 'edit'
}

export function MonitorForm({ monitor, mode }: MonitorFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [authProfiles, setAuthProfiles] = useState<AuthProfile[]>([])
  const [activeTab, setActiveTab] = useState<'quick' | 'advanced'>(mode === 'edit' ? 'advanced' : 'quick')

  // Form state
  const [name, setName] = useState(monitor?.name ?? '')
  const [url, setUrl] = useState(monitor?.url ?? '')
  const [method, setMethod] = useState<MonitorMethod>(monitor?.method ?? 'GET')
  const [intervalSeconds, setIntervalSeconds] = useState(monitor?.interval_seconds ?? 1800)
  const [isPublic, setIsPublic] = useState(monitor?.is_public ?? false)
  const [authProfileId, setAuthProfileId] = useState<string | null>(monitor?.auth_profile_id ?? null)
  const [skipSslVerify, setSkipSslVerify] = useState(monitor?.skip_ssl_verify ?? false)

  // Hooks
  const { testUrl, result: testResult, isLoading: isTestingUrl, reset: resetTest } = useUrlTest()
  const { fetchDefaults, defaults: smartDefaults, isLoading: isLoadingDefaults } = useSmartDefaults()

  // Track if name was manually edited
  const [nameManuallyEdited, setNameManuallyEdited] = useState(mode === 'edit')

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

  // Fetch smart defaults when URL changes (only in create mode)
  useEffect(() => {
    if (mode === 'create' && url && activeTab === 'quick') {
      fetchDefaults(url)
    }
  }, [url, mode, activeTab, fetchDefaults])

  // Apply smart defaults to form
  useEffect(() => {
    if (smartDefaults && mode === 'create') {
      if (!nameManuallyEdited && smartDefaults.suggested_name) {
        setName(smartDefaults.suggested_name)
      }
      setMethod(smartDefaults.suggested_method)

      // Auto-select first matching auth profile if none selected
      if (!authProfileId && smartDefaults.matching_auth_profiles.length > 0) {
        setAuthProfileId(smartDefaults.matching_auth_profiles[0].id)
      }
    }
  }, [smartDefaults, mode, nameManuallyEdited, authProfileId])

  const handleNameChange = useCallback((value: string) => {
    setName(value)
    setNameManuallyEdited(true)
  }, [])

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value)
    resetTest()
  }, [resetTest])

  const handleTestUrl = useCallback(async () => {
    if (!url) return

    await testUrl({
      url,
      method,
      skip_ssl_verify: skipSslVerify,
      auth_profile_id: authProfileId,
    })
  }, [url, method, skipSslVerify, authProfileId, testUrl])

  const handleApplySuggestion = useCallback((suggestion: { skip_ssl_verify?: boolean }) => {
    if (suggestion.skip_ssl_verify !== undefined) {
      setSkipSslVerify(suggestion.skip_ssl_verify)
      toast.info('Applied: Skip SSL verification enabled')
    }
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

  // Check if an auth profile is recommended
  const isProfileRecommended = (profileId: string) => {
    return smartDefaults?.matching_auth_profiles.some(p => p.id === profileId)
  }

  const getProfileMatchReason = (profileId: string) => {
    return smartDefaults?.matching_auth_profiles.find(p => p.id === profileId)?.match_reason
  }

  // Quick Add preview card
  const renderQuickPreview = () => {
    if (!url) return null

    const recommendedProfile = smartDefaults?.matching_auth_profiles[0]
    const profileName = recommendedProfile
      ? authProfiles.find(p => p.id === recommendedProfile.id)?.name
      : null

    return (
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {isLoadingDefaults ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing URL...
            </div>
          ) : smartDefaults ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{name || smartDefaults.suggested_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method:</span>
                <span className="font-medium">{method}</span>
              </div>
              {profileName && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Auth:</span>
                  <span className="font-medium flex items-center gap-1">
                    {profileName}
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-2 w-2 mr-1" />
                      Matched
                    </Badge>
                  </span>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  // URL input with test button
  const renderUrlInput = () => (
    <div className="space-y-2">
      <Label htmlFor="url">URL</Label>
      <div className="flex gap-2">
        <Input
          id="url"
          type="url"
          placeholder="https://api.example.com/health"
          value={url}
          onChange={(e) => handleUrlChange(e.target.value)}
          required
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleTestUrl}
          disabled={!url || isTestingUrl}
        >
          {isTestingUrl ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Test</span>
        </Button>
      </div>
    </div>
  )

  // Auth profile select with recommendations
  const renderAuthProfileSelect = () => (
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
          {authProfiles.map(profile => {
            const recommended = isProfileRecommended(profile.id)
            const matchReason = getProfileMatchReason(profile.id)

            return (
              <SelectItem key={profile.id} value={profile.id}>
                <div className="flex items-center gap-2">
                  <span>{profile.name}</span>
                  {recommended && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-2 w-2 mr-1" />
                      {matchReason}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Select an auth profile if this API requires authentication
      </p>
    </div>
  )

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

      {mode === 'create' ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quick' | 'advanced')}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Add
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>
          </div>

          <form onSubmit={handleSubmit}>
            <TabsContent value="quick" className="mt-0">
              <CardContent className="space-y-4 pt-4">
                {renderUrlInput()}
                {renderQuickPreview()}
                <UrlTestResultDisplay
                  result={testResult}
                  isLoading={isTestingUrl}
                  onApplySuggestion={handleApplySuggestion}
                />

                {/* Hidden but included in form */}
                <input type="hidden" name="name" value={name} />
                <input type="hidden" name="method" value={method} />
              </CardContent>
            </TabsContent>

            <TabsContent value="advanced" className="mt-0">
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="My API"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>

                {renderUrlInput()}

                <UrlTestResultDisplay
                  result={testResult}
                  isLoading={isTestingUrl}
                  onApplySuggestion={handleApplySuggestion}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="method">Method</Label>
                    <Select value={method} onValueChange={(v) => setMethod(v as MonitorMethod)}>
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
                        <SelectItem value="1800">30 minutes</SelectItem>
                        <SelectItem value="3600">1 hour</SelectItem>
                        <SelectItem value="7200">2 hours</SelectItem>
                        <SelectItem value="21600">6 hours</SelectItem>
                        <SelectItem value="43200">12 hours</SelectItem>
                        <SelectItem value="86400">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {renderAuthProfileSelect()}

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
            </TabsContent>

            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !url || !name}>
                {isLoading ? 'Saving...' : mode === 'create' ? 'Create Monitor' : 'Save Changes'}
              </Button>
            </CardFooter>
          </form>
        </Tabs>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My API"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            {renderUrlInput()}

            <UrlTestResultDisplay
              result={testResult}
              isLoading={isTestingUrl}
              onApplySuggestion={handleApplySuggestion}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method">Method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as MonitorMethod)}>
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
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                    <SelectItem value="7200">2 hours</SelectItem>
                    <SelectItem value="21600">6 hours</SelectItem>
                    <SelectItem value="43200">12 hours</SelectItem>
                    <SelectItem value="86400">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {renderAuthProfileSelect()}

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
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
