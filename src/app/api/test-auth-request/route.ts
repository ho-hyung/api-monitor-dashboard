import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import http from 'http'
import { createClient } from '@supabase/supabase-js'
import { fetchToken } from '@/lib/health-check/auth'
import type { AuthProfile } from '@/types/database'

// Test endpoint to verify auth header is being sent correctly
export async function GET(request: NextRequest) {
  const monitorId = request.nextUrl.searchParams.get('monitor_id')

  if (!monitorId) {
    return NextResponse.json({ error: 'monitor_id required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get monitor
  const { data: monitor } = await supabase
    .from('monitors')
    .select('*')
    .eq('id', monitorId)
    .single()

  if (!monitor) {
    return NextResponse.json({ error: 'Monitor not found' }, { status: 404 })
  }

  if (!monitor.auth_profile_id) {
    return NextResponse.json({ error: 'Monitor has no auth profile' }, { status: 400 })
  }

  // Get auth profile
  const { data: authProfile } = await supabase
    .from('auth_profiles')
    .select('*')
    .eq('id', monitor.auth_profile_id)
    .single()

  if (!authProfile) {
    return NextResponse.json({ error: 'Auth profile not found' }, { status: 404 })
  }

  // Fetch token
  const tokenResult = await fetchToken(authProfile as AuthProfile)
  if (!tokenResult.success || !tokenResult.token) {
    return NextResponse.json({
      error: 'Token fetch failed',
      details: tokenResult.error
    }, { status: 400 })
  }

  // Build auth header
  let authHeaderValue = ''
  switch (authProfile.token_type) {
    case 'Bearer':
      authHeaderValue = `Bearer ${tokenResult.token}`
      break
    case 'Basic':
      authHeaderValue = `Basic ${tokenResult.token}`
      break
    default:
      authHeaderValue = tokenResult.token
  }

  const headers: Record<string, string> = {
    'User-Agent': 'API-Monitor/1.0',
    [authProfile.header_name]: authHeaderValue,
  }

  // Make request using https module
  const result = await makeRequest(monitor.url, {
    method: monitor.method,
    headers,
    skipSSL: monitor.skip_ssl_verify,
  })

  return NextResponse.json({
    monitor: {
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
      skip_ssl_verify: monitor.skip_ssl_verify,
    },
    authProfile: {
      id: authProfile.id,
      name: authProfile.name,
      token_type: authProfile.token_type,
      header_name: authProfile.header_name,
    },
    tokenLength: tokenResult.token.length,
    headersSent: {
      ...headers,
      [authProfile.header_name]: `${authHeaderValue.substring(0, 30)}...`,
    },
    result,
  })
}

function makeRequest(
  url: string,
  options: { method: string; headers: Record<string, string>; skipSSL: boolean }
): Promise<{ status: number; statusText: string; error?: string }> {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url)
      const isHttps = parsedUrl.protocol === 'https:'

      const requestOptions: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method,
        headers: options.headers,
        timeout: 30000,
        rejectUnauthorized: !options.skipSSL,
      }

      const req = (isHttps ? https : http).request(requestOptions, (res) => {
        res.on('data', () => {})
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            statusText: res.statusMessage || '',
          })
        })
      })

      req.on('error', (error) => {
        resolve({
          status: 0,
          statusText: '',
          error: error.message,
        })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({
          status: 0,
          statusText: '',
          error: 'Request timeout',
        })
      })

      req.end()
    } catch (error) {
      resolve({
        status: 0,
        statusText: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })
}
