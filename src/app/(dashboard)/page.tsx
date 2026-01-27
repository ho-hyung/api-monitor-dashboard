import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch monitors for stats
  const { data: monitors } = await supabase
    .from('monitors')
    .select('*')

  const totalMonitors = monitors?.length ?? 0
  const upMonitors = monitors?.filter(m => m.current_status === 'up').length ?? 0
  const downMonitors = monitors?.filter(m => m.current_status === 'down').length ?? 0

  // Fetch recent incidents
  const { data: incidents } = await supabase
    .from('incidents')
    .select('*')
    .neq('status', 'resolved')
    .order('created_at', { ascending: false })
    .limit(5)

  const activeIncidents = incidents?.length ?? 0

  const stats = [
    {
      title: 'Total Monitors',
      value: totalMonitors,
      icon: Activity,
      description: 'Active monitoring endpoints',
    },
    {
      title: 'Operational',
      value: upMonitors,
      icon: CheckCircle,
      description: 'Services running normally',
      className: 'text-green-600',
    },
    {
      title: 'Down',
      value: downMonitors,
      icon: XCircle,
      description: 'Services experiencing issues',
      className: 'text-red-600',
    },
    {
      title: 'Active Incidents',
      value: activeIncidents,
      icon: AlertTriangle,
      description: 'Unresolved incidents',
      className: activeIncidents > 0 ? 'text-yellow-600' : 'text-muted-foreground',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your API monitoring status
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.className ?? 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.className ?? ''}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalMonitors === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create your first monitor to start tracking API health
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click the &quot;Monitors&quot; link in the sidebar and add your first API endpoint to monitor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
