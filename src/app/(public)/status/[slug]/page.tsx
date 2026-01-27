import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { StatusPageClient } from './status-page-client'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicStatusPage({ params }: PageProps) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get status page settings
  const { data: statusPage, error } = await supabase
    .from('status_page_settings')
    .select('*')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (error || !statusPage) {
    notFound()
  }

  // Get public monitors for this user
  const { data: monitors } = await supabase
    .from('monitors')
    .select('id, name, url, current_status, last_checked_at')
    .eq('user_id', statusPage.user_id)
    .eq('is_public', true)
    .order('name')

  // Get health checks for the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const monitorIds = monitors?.map(m => m.id) ?? []

  const { data: healthChecks } = await supabase
    .from('health_checks')
    .select('monitor_id, status, checked_at')
    .in('monitor_id', monitorIds.length > 0 ? monitorIds : ['none'])
    .gte('checked_at', thirtyDaysAgo.toISOString())
    .order('checked_at', { ascending: false })

  // Get active incidents
  const { data: activeIncidents } = await supabase
    .from('incidents')
    .select('*, incident_updates(*)')
    .eq('user_id', statusPage.user_id)
    .neq('status', 'resolved')
    .order('started_at', { ascending: false })

  // Get recent resolved incidents (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentIncidents } = await supabase
    .from('incidents')
    .select('*, incident_updates(*)')
    .eq('user_id', statusPage.user_id)
    .eq('status', 'resolved')
    .gte('resolved_at', sevenDaysAgo.toISOString())
    .order('resolved_at', { ascending: false })
    .limit(5)

  return (
    <StatusPageClient
      statusPage={statusPage}
      monitors={monitors ?? []}
      healthChecks={healthChecks ?? []}
      activeIncidents={activeIncidents ?? []}
      recentIncidents={recentIncidents ?? []}
    />
  )
}
