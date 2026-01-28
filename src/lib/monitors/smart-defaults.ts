import type { AuthProfile, MonitorMethod } from '@/types/database'

/**
 * Extract a display name from a URL
 * e.g., "https://api.example.com/health" → "api.example.com/health"
 */
export function extractNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/^\/|\/$/g, '')

    if (path) {
      return `${parsed.hostname}/${path}`
    }
    return parsed.hostname
  } catch {
    return ''
  }
}

/**
 * Infer HTTP method from URL path
 * Health check endpoints typically use GET
 */
export function inferMethod(url: string): MonitorMethod {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname.toLowerCase()

    const getPatterns = [
      '/health',
      '/healthz',
      '/healthcheck',
      '/ping',
      '/status',
      '/ready',
      '/readiness',
      '/live',
      '/liveness',
      '/alive',
      '/api/health',
      '/api/status',
      '/api/ping',
    ]

    for (const pattern of getPatterns) {
      if (path.includes(pattern)) {
        return 'GET'
      }
    }

    return 'GET'
  } catch {
    return 'GET'
  }
}

/**
 * Extract base domain from hostname
 * e.g., "api.example.com" → "example.com"
 */
export function getBaseDomain(hostname: string): string {
  const parts = hostname.split('.')
  if (parts.length >= 2) {
    return parts.slice(-2).join('.')
  }
  return hostname
}

export interface MatchingAuthProfile {
  id: string
  name: string
  match_reason: string
}

/**
 * Find auth profiles that might match the monitor URL based on domain
 */
export function findMatchingAuthProfiles(
  monitorUrl: string,
  authProfiles: AuthProfile[]
): MatchingAuthProfile[] {
  try {
    const monitorParsed = new URL(monitorUrl)
    const monitorBaseDomain = getBaseDomain(monitorParsed.hostname)
    const matches: MatchingAuthProfile[] = []

    for (const profile of authProfiles) {
      try {
        const loginParsed = new URL(profile.login_url)
        const loginBaseDomain = getBaseDomain(loginParsed.hostname)

        if (monitorParsed.hostname === loginParsed.hostname) {
          matches.push({
            id: profile.id,
            name: profile.name,
            match_reason: 'Same hostname',
          })
        } else if (monitorBaseDomain === loginBaseDomain) {
          matches.push({
            id: profile.id,
            name: profile.name,
            match_reason: 'Same domain',
          })
        }
      } catch {
        continue
      }
    }

    return matches
  } catch {
    return []
  }
}

export interface SmartDefaults {
  suggested_name: string
  suggested_method: MonitorMethod
  matching_auth_profiles: MatchingAuthProfile[]
}

/**
 * Generate smart defaults for a monitor based on URL
 */
export function generateSmartDefaults(
  url: string,
  authProfiles: AuthProfile[]
): SmartDefaults {
  return {
    suggested_name: extractNameFromUrl(url),
    suggested_method: inferMethod(url),
    matching_auth_profiles: findMatchingAuthProfiles(url, authProfiles),
  }
}
