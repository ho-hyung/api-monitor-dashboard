import https from 'https'
import http from 'http'
import type { AuthProfile } from '@/types/database'

interface TokenResult {
  success: boolean
  token?: string
  error?: string
}

const TIMEOUT_MS = 30000

/**
 * Extract value from nested object using dot notation path
 * e.g., "data.accessToken" from { data: { accessToken: "xxx" } }
 */
function getValueByPath(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }

  return typeof current === 'string' ? current : undefined
}

/**
 * Make HTTPS request with SSL skip option
 */
function httpsRequest(
  url: string,
  options: {
    method: string
    headers: Record<string, string>
    body?: string
    skipSSLVerify?: boolean
  }
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const isHttps = parsedUrl.protocol === 'https:'

    const requestOptions: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method,
      headers: options.headers,
      timeout: TIMEOUT_MS,
      rejectUnauthorized: !options.skipSSLVerify,
    }

    const req = (isHttps ? https : http).request(requestOptions, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          body,
        })
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Request timeout after ${TIMEOUT_MS}ms`))
    })

    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}

/**
 * Fetch authentication token using the auth profile configuration
 */
export async function fetchToken(profile: AuthProfile): Promise<TokenResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    let body: string | undefined
    if (profile.login_method === 'POST' && Object.keys(profile.login_body).length > 0) {
      body = JSON.stringify(profile.login_body)
    }

    const response = await httpsRequest(profile.login_url, {
      method: profile.login_method,
      headers,
      body,
      skipSSLVerify: profile.skip_ssl_verify,
    })

    if (response.status < 200 || response.status >= 400) {
      return {
        success: false,
        error: `Login failed with status ${response.status}: ${response.body.substring(0, 200)}`,
      }
    }

    const data = JSON.parse(response.body)
    const token = getValueByPath(data, profile.token_path)

    if (!token) {
      return {
        success: false,
        error: `Token not found at path "${profile.token_path}". Response keys: ${Object.keys(data).join(', ')}`,
      }
    }

    return {
      success: true,
      token,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during token fetch',
    }
  }
}

/**
 * Build authorization header based on token type
 */
export function buildAuthHeader(
  profile: AuthProfile,
  token: string
): { name: string; value: string } {
  let value: string

  switch (profile.token_type) {
    case 'Bearer':
      value = `Bearer ${token}`
      break
    case 'Basic':
      value = `Basic ${token}`
      break
    case 'API-Key':
      value = token
      break
    default:
      value = token
  }

  return {
    name: profile.header_name,
    value,
  }
}

// Token cache for the duration of a health check run
const tokenCache = new Map<string, { token: string; expiresAt: number }>()

/**
 * Get token from cache or fetch new one
 */
export async function getTokenForProfile(profile: AuthProfile): Promise<TokenResult> {
  const cached = tokenCache.get(profile.id)
  const now = Date.now()

  // Return cached token if still valid (with 60 second buffer)
  if (cached && cached.expiresAt > now + 60000) {
    return { success: true, token: cached.token }
  }

  // Fetch new token
  const result = await fetchToken(profile)

  if (result.success && result.token) {
    const expiresIn = profile.expires_in_seconds ?? 3600
    tokenCache.set(profile.id, {
      token: result.token,
      expiresAt: now + expiresIn * 1000,
    })
  }

  return result
}

/**
 * Clear the token cache (useful for testing or forced refresh)
 */
export function clearTokenCache() {
  tokenCache.clear()
}
