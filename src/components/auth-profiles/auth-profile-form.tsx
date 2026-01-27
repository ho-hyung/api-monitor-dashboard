'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AuthProfile } from '@/types/database'

interface AuthProfileFormProps {
  profile?: AuthProfile
  onSubmit: (data: Partial<AuthProfile>) => Promise<void>
  onCancel: () => void
}

export function AuthProfileForm({ profile, onSubmit, onCancel }: AuthProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [loginUrl, setLoginUrl] = useState(profile?.login_url ?? '')
  const [loginMethod, setLoginMethod] = useState(profile?.login_method ?? 'POST')
  const [loginBody, setLoginBody] = useState(
    profile?.login_body ? JSON.stringify(profile.login_body, null, 2) : '{\n  "email": "",\n  "password": ""\n}'
  )
  const [tokenPath, setTokenPath] = useState(profile?.token_path ?? 'access_token')
  const [tokenType, setTokenType] = useState(profile?.token_type ?? 'Bearer')
  const [headerName, setHeaderName] = useState(profile?.header_name ?? 'Authorization')
  const [expiresIn, setExpiresIn] = useState(profile?.expires_in_seconds?.toString() ?? '3600')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let parsedBody: Record<string, string> = {}
      if (loginBody.trim()) {
        parsedBody = JSON.parse(loginBody)
      }

      await onSubmit({
        name,
        login_url: loginUrl,
        login_method: loginMethod as 'GET' | 'POST',
        login_body: parsedBody,
        token_path: tokenPath,
        token_type: tokenType as 'Bearer' | 'Basic' | 'API-Key',
        header_name: headerName,
        expires_in_seconds: expiresIn ? parseInt(expiresIn, 10) : null,
      })
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Profile Name</Label>
        <Input
          id="name"
          placeholder="e.g., Shopping Mall API"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3 space-y-2">
          <Label htmlFor="loginUrl">Login URL</Label>
          <Input
            id="loginUrl"
            type="url"
            placeholder="https://api.example.com/auth/login"
            value={loginUrl}
            onChange={(e) => setLoginUrl(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loginMethod">Method</Label>
          <Select value={loginMethod} onValueChange={setLoginMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="loginBody">Login Body (JSON)</Label>
        <Textarea
          id="loginBody"
          placeholder='{"email": "user@example.com", "password": "secret"}'
          value={loginBody}
          onChange={(e) => setLoginBody(e.target.value)}
          className="font-mono text-sm"
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          JSON body to send with the login request
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tokenPath">Token Path</Label>
          <Input
            id="tokenPath"
            placeholder="data.accessToken"
            value={tokenPath}
            onChange={(e) => setTokenPath(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Path to extract token from response (e.g., data.accessToken)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tokenType">Token Type</Label>
          <Select value={tokenType} onValueChange={setTokenType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bearer">Bearer</SelectItem>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="API-Key">API-Key</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="headerName">Header Name</Label>
          <Input
            id="headerName"
            placeholder="Authorization"
            value={headerName}
            onChange={(e) => setHeaderName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiresIn">Token Expires In (seconds)</Label>
          <Input
            id="expiresIn"
            type="number"
            placeholder="3600"
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : profile ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
