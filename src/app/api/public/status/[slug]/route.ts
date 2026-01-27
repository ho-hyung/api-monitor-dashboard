import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// GET /api/public/status/[slug] - Get public status page data (no auth required)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get status page settings
    const { data: statusPage, error: statusError } = await supabase
      .from('status_page_settings')
      .select('*')
      .eq('slug', slug)
      .eq('is_public', true)
      .single()

    if (statusError || !statusPage) {
      return NextResponse.json({ error: 'Status page not found' }, { status: 404 })
    }

    // Get public monitors for this user
    const { data: monitors } = await supabase
      .from('monitors')
      .select('id, name, url, current_status, last_checked_at')
      .eq('user_id', statusPage.user_id)
      .eq('is_public', true)
      .order('name')

    // Get health checks for the last 30 days for each monitor
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const monitorIds = monitors?.map(m => m.id) ?? []

    const { data: healthChecks } = await supabase
      .from('health_checks')
      .select('monitor_id, status, checked_at')
      .in('monitor_id', monitorIds)
      .gte('checked_at', thirtyDaysAgo.toISOString())
      .order('checked_at', { ascending: false })

    // Get active incidents
    const { data: incidents } = await supabase
      .from('incidents')
      .select('*, incident_updates(*)')
      .eq('user_id', statusPage.user_id)
      .neq('status', 'resolved')
      .order('started_at', { ascending: false })

    // Get recent resolved incidents (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: resolvedIncidents } = await supabase
      .from('incidents')
      .select('*, incident_updates(*)')
      .eq('user_id', statusPage.user_id)
      .eq('status', 'resolved')
      .gte('resolved_at', sevenDaysAgo.toISOString())
      .order('resolved_at', { ascending: false })
      .limit(5)

    // Calculate overall status
    const allUp = monitors?.every(m => m.current_status === 'up') ?? true
    const allDown = monitors?.every(m => m.current_status === 'down') ?? false
    const overallStatus = monitors?.length === 0
      ? 'unknown'
      : allDown
        ? 'major_outage'
        : allUp
          ? 'operational'
          : 'partial_outage'

    return NextResponse.json({
      statusPage: {
        title: statusPage.title,
        description: statusPage.description,
        theme_color: statusPage.theme_color,
      },
      overall_status: overallStatus,
      monitors: monitors ?? [],
      health_checks: healthChecks ?? [],
      active_incidents: incidents ?? [],
      recent_incidents: resolvedIncidents ?? [],
    })
  } catch (error) {
    console.error('Public status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
