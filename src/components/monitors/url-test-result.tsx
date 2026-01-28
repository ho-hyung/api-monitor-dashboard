'use client'

import { CheckCircle, XCircle, AlertTriangle, Clock, Shield, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { UrlTestResult } from '@/types/database'

interface UrlTestResultProps {
  result: UrlTestResult | null
  isLoading: boolean
  onApplySuggestion?: (suggestion: { skip_ssl_verify?: boolean }) => void
}

export function UrlTestResultDisplay({
  result,
  isLoading,
  onApplySuggestion,
}: UrlTestResultProps) {
  if (isLoading) {
    return (
      <Alert>
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Testing URL...</AlertTitle>
        <AlertDescription>
          Checking connectivity and SSL certificate
        </AlertDescription>
      </Alert>
    )
  }

  if (!result) {
    return null
  }

  const statusColor = result.success
    ? 'text-green-600'
    : 'text-red-600'

  const StatusIcon = result.success ? CheckCircle : XCircle

  return (
    <div className="space-y-3">
      {/* Main result */}
      <Alert className={cn(
        result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      )}>
        <StatusIcon className={cn('h-4 w-4', statusColor)} />
        <AlertTitle className={statusColor}>
          {result.success ? 'Connection Successful' : 'Connection Failed'}
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          {/* Status code and response time */}
          <div className="flex flex-wrap gap-2">
            {result.status_code && (
              <Badge variant={result.success ? 'default' : 'destructive'}>
                HTTP {result.status_code}
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {result.response_time_ms}ms
            </Badge>
          </div>

          {/* Error message */}
          {result.error_message && (
            <p className="text-sm text-red-700 mt-2">
              {result.error_message}
            </p>
          )}
        </AlertDescription>
      </Alert>

      {/* SSL Info */}
      {result.ssl_info && (
        <Alert className={cn(
          result.ssl_info.valid
            ? 'border-green-200 bg-green-50'
            : 'border-amber-200 bg-amber-50'
        )}>
          <Shield className={cn(
            'h-4 w-4',
            result.ssl_info.valid ? 'text-green-600' : 'text-amber-600'
          )} />
          <AlertTitle className={result.ssl_info.valid ? 'text-green-700' : 'text-amber-700'}>
            SSL Certificate
          </AlertTitle>
          <AlertDescription className="mt-2">
            {result.ssl_info.valid ? (
              <div className="space-y-1 text-sm text-green-700">
                <p>Valid certificate</p>
                {result.ssl_info.days_until_expiry !== undefined && (
                  <p className={cn(
                    result.ssl_info.days_until_expiry <= 30 && 'text-amber-600 font-medium'
                  )}>
                    Expires in {result.ssl_info.days_until_expiry} day{result.ssl_info.days_until_expiry !== 1 && 's'}
                  </p>
                )}
                {result.ssl_info.issuer && (
                  <p className="text-muted-foreground">Issued by: {result.ssl_info.issuer}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-amber-700">
                {result.ssl_info.error}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions */}
      {result.suggested_settings.skip_ssl_verify && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-700">SSL Certificate Issue Detected</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="text-sm text-amber-700">
              The connection failed due to an SSL certificate issue.
              You can enable &quot;Skip SSL verification&quot; if this is a trusted internal server.
            </p>
            {onApplySuggestion && (
              <button
                type="button"
                onClick={() => onApplySuggestion({ skip_ssl_verify: true })}
                className="text-sm font-medium text-amber-700 hover:text-amber-800 underline"
              >
                Apply suggestion
              </button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
