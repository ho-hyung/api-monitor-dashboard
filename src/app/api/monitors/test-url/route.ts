import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { performHealthCheck } from '@/lib/health-check/checker'
import { checkSslCertificate, isSslError } from '@/lib/health-check/ssl'
import { getTokenForProfile, buildAuthHeader } from '@/lib/health-check/auth'
import type { UrlTestResult, MonitorMethod, AuthProfile } from '@/types/database'

const testUrlSchema = z.object({
  url: z.string().url('Invalid URL format'),
  method: z.enum(['GET', 'POST', 'HEAD']).optional().default('GET'),
  skip_ssl_verify: z.boolean().optional().default(false),
  auth_profile_id: z.string().uuid().nullable().optional(),
})

// POST /api/monitors/test-url - Test a URL before creating a monitor
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = testUrlSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { url, method, skip_ssl_verify, auth_profile_id } = validationResult.data

    // Fetch auth profile if specified
    let authProfile: AuthProfile | null = null
    let authToken: string | null = null

    if (auth_profile_id) {
      const { data: profile, error: profileError } = await supabase
        .from('auth_profiles')
        .select('*')
        .eq('id', auth_profile_id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Auth profile not found' },
          { status: 404 }
        )
      }

      authProfile = profile

      // Get auth token
      const tokenResult = await getTokenForProfile(profile)
      if (!tokenResult.success || !tokenResult.token) {
        return NextResponse.json({
          data: {
            success: false,
            status_code: null,
            response_time_ms: 0,
            ssl_info: null,
            error_message: `Auth failed: ${tokenResult.error ?? 'Unknown error'}`,
            suggested_settings: {},
          } satisfies UrlTestResult,
        })
      }
      authToken = tokenResult.token
    }

    // Create a mock monitor for the health check
    const mockMonitor = {
      id: 'test',
      user_id: user.id,
      name: 'Test',
      url,
      method: method as MonitorMethod,
      interval_seconds: 1800,
      current_status: 'unknown' as const,
      is_public: false,
      last_checked_at: null,
      auth_profile_id: auth_profile_id ?? null,
      skip_ssl_verify,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Perform health check
    const healthCheckResult = await performHealthCheck(mockMonitor, {
      authToken: authToken ?? undefined,
      authProfile: authProfile ?? undefined,
    })

    // Check SSL certificate for HTTPS URLs
    let sslInfo = null
    if (url.startsWith('https://')) {
      sslInfo = await checkSslCertificate(url)
    }

    // Determine suggested settings
    const suggestedSettings: UrlTestResult['suggested_settings'] = {}

    // If there's an SSL error and skip_ssl_verify is false, suggest enabling it
    if (
      !skip_ssl_verify &&
      healthCheckResult.error_message &&
      isSslError(healthCheckResult.error_message)
    ) {
      suggestedSettings.skip_ssl_verify = true
    }

    const result: UrlTestResult = {
      success: healthCheckResult.status === 'up',
      status_code: healthCheckResult.status_code,
      response_time_ms: healthCheckResult.response_time_ms ?? 0,
      ssl_info: sslInfo,
      error_message: healthCheckResult.error_message ?? undefined,
      suggested_settings: suggestedSettings,
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Test URL error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
