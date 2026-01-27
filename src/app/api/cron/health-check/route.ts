import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { performHealthCheck, shouldRunHealthCheck } from '@/lib/health-check/checker'
import type { Monitor } from '@/types/database'

type SupabaseAdminClient = SupabaseClient

// This endpoint is called by Vercel Cron
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/health-check", "schedule": "* * * * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use service role client for cron job
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch all monitors
    const { data: monitors, error: monitorsError } = await supabase
      .from('monitors')
      .select('*')

    if (monitorsError) {
      return NextResponse.json({ error: monitorsError.message }, { status: 500 })
    }

    if (!monitors || monitors.length === 0) {
      return NextResponse.json({ message: 'No monitors to check', checked: 0 })
    }

    // Filter monitors that need to be checked
    const now = new Date()
    const monitorsToCheck = monitors.filter((m: Monitor) => shouldRunHealthCheck(m, now))

    if (monitorsToCheck.length === 0) {
      return NextResponse.json({ message: 'No monitors due for check', checked: 0 })
    }

    // Perform health checks in parallel
    const results = await Promise.allSettled(
      monitorsToCheck.map(async (monitor: Monitor) => {
        const result = await performHealthCheck(monitor)

        // Insert health check record
        await supabase.from('health_checks').insert({
          monitor_id: monitor.id,
          status: result.status,
          response_time_ms: result.response_time_ms,
          status_code: result.status_code,
          error_message: result.error_message,
          checked_at: now.toISOString(),
        })

        // Update monitor status
        const statusChanged = monitor.current_status !== result.status

        await supabase
          .from('monitors')
          .update({
            current_status: result.status,
            last_checked_at: now.toISOString(),
          })
          .eq('id', monitor.id)

        // If status changed, trigger alerts
        if (statusChanged && result.status === 'down') {
          await triggerAlerts(supabase, monitor, result)
        } else if (statusChanged && result.status === 'up' && monitor.current_status === 'down') {
          await triggerRecoveryAlerts(supabase, monitor)
        }

        return { monitor_id: monitor.id, ...result }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      message: 'Health check completed',
      checked: monitorsToCheck.length,
      successful,
      failed,
    })
  } catch (error) {
    console.error('Cron health check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function triggerAlerts(
  supabase: SupabaseAdminClient,
  monitor: Monitor,
  result: { error_message: string | null }
) {
  // Get alert rules for this monitor
  const { data: alertRules } = await supabase
    .from('alert_rules')
    .select('*, notification_channels(*)')
    .eq('monitor_id', monitor.id)

  if (!alertRules || alertRules.length === 0) return

  for (const rule of alertRules) {
    // Check if we should trigger (based on consecutive failures)
    const { count } = await supabase
      .from('health_checks')
      .select('*', { count: 'exact', head: true })
      .eq('monitor_id', monitor.id)
      .eq('status', 'down')
      .order('checked_at', { ascending: false })
      .limit(rule.trigger_after_failures)

    if (count && count >= rule.trigger_after_failures) {
      // Send notification via the notification system (Phase 3)
      await supabase.from('alert_logs').insert({
        monitor_id: monitor.id,
        channel_id: rule.channel_id,
        status: 'sent',
        message: `Monitor "${monitor.name}" is DOWN: ${result.error_message ?? 'Unknown error'}`,
      })
    }
  }
}

async function triggerRecoveryAlerts(
  supabase: SupabaseAdminClient,
  monitor: Monitor
) {
  // Get alert rules that have notify_on_recovery enabled
  const { data: alertRules } = await supabase
    .from('alert_rules')
    .select('*, notification_channels(*)')
    .eq('monitor_id', monitor.id)
    .eq('notify_on_recovery', true)

  if (!alertRules || alertRules.length === 0) return

  for (const rule of alertRules) {
    await supabase.from('alert_logs').insert({
      monitor_id: monitor.id,
      channel_id: rule.channel_id,
      status: 'sent',
      message: `Monitor "${monitor.name}" is now UP and running`,
    })
  }
}
