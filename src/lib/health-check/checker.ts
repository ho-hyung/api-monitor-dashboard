import type { Monitor, MonitorStatus } from '@/types/database'

export interface HealthCheckResult {
  status: MonitorStatus
  response_time_ms: number | null
  status_code: number | null
  error_message: string | null
}

const TIMEOUT_MS = 30000 // 30 seconds

export async function performHealthCheck(monitor: Monitor): Promise<HealthCheckResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(monitor.url, {
      method: monitor.method,
      signal: controller.signal,
      headers: {
        'User-Agent': 'API-Monitor/1.0',
      },
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
