'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { SmartDefaults } from '@/types/database'

interface UseSmartDefaultsReturn {
  fetchDefaults: (url: string) => Promise<SmartDefaults | null>
  defaults: SmartDefaults | null
  isLoading: boolean
  error: string | null
  reset: () => void
}

const DEBOUNCE_MS = 500

export function useSmartDefaults(): UseSmartDefaultsReturn {
  const [defaults, setDefaults] = useState<SmartDefaults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const fetchDefaults = useCallback(async (url: string): Promise<SmartDefaults | null> => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Validate URL first
    try {
      new URL(url)
    } catch {
      setDefaults(null)
      setError(null)
      return null
    }

    return new Promise((resolve) => {
      debounceTimerRef.current = setTimeout(async () => {
        setIsLoading(true)
        setError(null)

        abortControllerRef.current = new AbortController()

        try {
          const response = await fetch(
            `/api/monitors/smart-defaults?url=${encodeURIComponent(url)}`,
            { signal: abortControllerRef.current.signal }
          )

          const data = await response.json()

          if (!response.ok) {
            const errorMessage = data.error ?? 'Failed to fetch defaults'
            setError(errorMessage)
            resolve(null)
            return
          }

          setDefaults(data.data)
          resolve(data.data)
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            resolve(null)
            return
          }
          const errorMessage = err instanceof Error ? err.message : 'Unknown error'
          setError(errorMessage)
          resolve(null)
        } finally {
          setIsLoading(false)
        }
      }, DEBOUNCE_MS)
    })
  }, [])

  const reset = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setDefaults(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    fetchDefaults,
    defaults,
    isLoading,
    error,
    reset,
  }
}
