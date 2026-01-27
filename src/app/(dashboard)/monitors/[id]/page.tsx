import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponseTimeChart } from '@/components/charts/response-time-chart'
import { UptimeBar } from '@/components/charts/uptime-bar'
import { MonitorActions } from '@/components/monitors/monitor-actions'
import { cn } from '@/lib/utils'
import { Edit, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MonitorDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: monitor, error } = await supabase
    .from('monitors')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !monitor) {
    notFound()
  }

  // Fetch health checks for last 24 hours
  const oneDayAgo = new Date()
  oneDayAgo.setHours(oneDayAgo.getHours() - 24)

  const { data: recentChecks } = await supabase
    .from('health_checks')
    .select('*')
    .eq('monitor_id', id)
    .gte('checked_at', oneDayAgo.toISOString())
    .order('checked_at', { ascending: false })

  // Fetch health checks for last 30 days (for uptime bar)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: monthlyChecks } = await supabase
    .from('health_checks')
    .select('*')
    .eq('monitor_id', id)
    .gte('checked_at', thirtyDaysAgo.toISOString())
    .order('checked_at', { ascending: false })

  const statusColorMap: Record<string, string> = {
    up: 'bg-green-500',
    down: 'bg-red-500',
    unknown: 'bg-gray-500',
  }
  const statusColor = statusColorMap[monitor.current_status] ?? 'bg-gray-500'

  const statusTextMap: Record<string, string> = {
    up: 'Operational',
    down: 'Down',
    unknown: 'Unknown',
  }
  const statusText = statusTextMap[monitor.current_status] ?? 'Unknown'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold tracking-tight">{monitor.name}</h2>
            <Badge
              variant="secondary"
              className={cn(
                'gap-1',
                monitor.current_status === 'up' && 'bg-green-100 text-green-700',
                monitor.current_status === 'down' && 'bg-red-100 text-red-700',
                monitor.current_status === 'unknown' && 'bg-gray-100 text-gray-700'
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', statusColor)} />
              {statusText}
            </Badge>
          </div>
          <a
            href={monitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {monitor.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/monitors/${monitor.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <MonitorActions monitor={monitor} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monitor.method}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Check Interval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monitor.interval_seconds >= 60
                ? `${Math.floor(monitor.interval_seconds / 60)}m`
                : `${monitor.interval_seconds}s`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Checked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {monitor.last_checked_at
                ? new Date(monitor.last_checked_at).toLocaleString()
                : 'Never'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Visibility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monitor.is_public ? 'Public' : 'Private'}
            </div>
          </CardContent>
        </Card>
      </div>

      <UptimeBar healthChecks={monthlyChecks ?? []} days={30} />

      <ResponseTimeChart healthChecks={recentChecks ?? []} />
    </div>
  )
}
