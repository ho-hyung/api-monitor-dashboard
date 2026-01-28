import https from 'https'
import http from 'http'
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

interface SimpleResponse {
  status: number
  statusText: string
}

// Custom HTTPS request with SSL verification skip option
function httpsRequestWithSkipSSL(
  url: string,
  options: {
    method: string
    headers: Record<string, string>
    timeoutMs: number
  }
): Promise<SimpleResponse> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const isHttps = parsedUrl.protocol === 'https:'

    const requestOptions: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method,
      headers: options.headers,
      timeout: options.timeoutMs,
      rejectUnauthorized: false, // Skip SSL verification
    }

    const req = (isHttps ? https : http).request(requestOptions, (res) => {
      // Consume response body to free up memory
      res.on('data', () => {})
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          statusText: res.statusMessage || '',
        })
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Request timeout after ${options.timeoutMs}ms`))
    })

    req.end()
  })
}

// Standard fetch wrapper
async function standardFetch(
  url: string,
  options: {
    method: string
    headers: Record<string, string>
    signal: AbortSignal
  }
): Promise<SimpleResponse> {
  const response = await fetch(url, {
    method: options.method,
    headers: options.headers,
    signal: options.signal,
  })
  return {
    status: response.status,
    statusText: response.statusText,
  }
}

export async function performHealthCheck(
  monitor: Monitor,
  options?: HealthCheckOptions
): Promise<HealthCheckResult> {
  const startTime = Date.now()

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'API-Monitor/1.0',
    }

    // Add authentication header if provided
    if (options?.authToken && options?.authProfile) {
      const authHeader = buildAuthHeader(options.authProfile, options.authToken)
      headers[authHeader.name] = authHeader.value
    }

    let response: SimpleResponse

    if (monitor.skip_ssl_verify) {
      // Use custom https module for SSL skip
      response = await httpsRequestWithSkipSSL(monitor.url, {
        method: monitor.method,
        headers,
        timeoutMs: TIMEOUT_MS,
      })
    } else {
      // Use standard fetch
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      response = await standardFetch(monitor.url, {
        method: monitor.method,
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
    }

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

  // Add 10% tolerance to avoid timing edge cases
  // e.g., 30min interval with cron running every 30min
  const toleranceSeconds = monitor.interval_seconds * 0.9

  return diffSeconds >= toleranceSeconds
}

// Re-export auth functions for convenience
export { getTokenForProfile, clearTokenCache }
