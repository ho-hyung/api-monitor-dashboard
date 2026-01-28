import https from 'https'
import type { Monitor, MonitorStatus, AuthProfile } from '@/types/database'
import { getTokenForProfile, buildAuthHeader, clearTokenCache } from './auth'

export interface HealthCheckResult {
  status: MonitorStatus
  response_time_ms: number | null
  status_code: number | null
  error_message: string | null
}

export interface HealthCheckOptions {
  authToken?: string
  authProfile?: AuthProfile
}

const TIMEOUT_MS = 30000 // 30 seconds

// Custom fetch with SSL verification option
async function fetchWithSSLOption(
  url: string,
  options: {
    method: string
    headers: Record<string, string>
    signal: AbortSignal
    skipSSLVerify?: boolean
  }
): Promise<Response> {
  // If SSL verification should be skipped and it's HTTPS, use custom agent
  if (options.skipSSLVerify && url.startsWith('https://')) {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    })

    return fetch(url, {
      method: options.method,
      headers: options.headers,
      signal: options.signal,
      // @ts-expect-error - Node.js fetch supports agent option
      agent,
    })
  }

  // Use standard fetch for HTTP or when SSL verification is enabled
  return fetch(url, {
    method: options.method,
    headers: options.headers,
    signal: options.signal,
  })
}

export async function performHealthCheck(
  monitor: Monitor,
  options?: HealthCheckOptions
): Promise<HealthCheckResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const headers: Record<string, string> = {
      'User-Agent': 'API-Monitor/1.0',
    }

    // Add authentication header if provided
    if (options?.authToken && options?.authProfile) {
      const authHeader = buildAuthHeader(options.authProfile, options.authToken)
      headers[authHeader.name] = authHeader.value
    }

    const response = await fetchWithSSLOption(monitor.url, {
      method: monitor.method,
      headers,
      signal: controller.signal,
      skipSSLVerify: monitor.skip_ssl_verify,
    })

    clearTimeout(timeoutId)

    const responseTime = Date.now() - startTime
    const isUp = response.status >= 200 && response.status < 400

    return {
      status: isUp ? 'up' : 'down',
      response_time_ms: responseTime,
      status_code: response.status,
      error_message: isUp ? null : `HTTP ${response.status}: ${response.statusText}`,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = `Request timeout after ${TIMEOUT_MS}ms`
      } else {
        errorMessage = error.message
      }
    }

    return {
      status: 'down',
      response_time_ms: responseTime,
      status_code: null,
      error_message: errorMessage,
    }
  }
}

export function shouldRunHealthCheck(
  monitor: Monitor,
  now: Date = new Date()
): boolean {
  if (!monitor.last_checked_at) {
    return true
  }

  const lastChecked = new Date(monitor.last_checked_at)
  const diffMs = now.getTime() - lastChecked.getTime()
  const diffSeconds = diffMs / 1000

  return diffSeconds >= monitor.interval_seconds
}

// Re-export auth functions for convenience
export { getTokenForProfile, clearTokenCache }
