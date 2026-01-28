'use client'

import { useState, useCallback } from 'react'
import type { UrlTestResult, MonitorMethod } from '@/types/database'

interface TestUrlParams {
  url: string
  method?: MonitorMethod
  skip_ssl_verify?: boolean
  auth_profile_id?: string | null
}

interface UseUrlTestReturn {
  testUrl: (params: TestUrlParams) => Promise<UrlTestResult | null>
  result: UrlTestResult | null
  isLoading: boolean
  error: string | null
  reset: () => void
}

export function useUrlTest(): UseUrlTestReturn {
  const [result, setResult] = useState<UrlTestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testUrl = useCallback(async (params: TestUrlParams): Promise<UrlTestResult | null> => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/monitors/test-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: params.url,
          method: params.method ?? 'GET',
          skip_ssl_verify: params.skip_ssl_verify ?? false,
          auth_profile_id: params.auth_profile_id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.error ?? 'Failed to test URL'
        setError(errorMessage)
        return null
      }

      setResult(data.data)
      return data.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    testUrl,
    result,
    isLoading,
    error,
    reset,
  }
}
