'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertTriangle, MinusCircle } from 'lucide-react'

interface Monitor {
  id: string
  name: string
  url: string
  current_status: string
  last_checked_at: string | null
}

interface HealthCheck {
  monitor_id: string
  status: string
  checked_at: string
}

interface IncidentUpdate {
  id: string
  status: string
  message: string
  created_at: string
}

interface Incident {
  id: string
  title: string
  status: string
  severity: string
  started_at: string
  resolved_at: string | null
  incident_updates: IncidentUpdate[]
}

interface StatusPageSettings {
  title: string
  description: string | null
  theme_color: string
}

interface StatusPageClientProps {
  statusPage: StatusPageSettings
  monitors: Monitor[]
  healthChecks: HealthCheck[]
  activeIncidents: Incident[]
  recentIncidents: Incident[]
}

export function StatusPageClient({
  statusPage,
  monitors,
  healthChecks,
  activeIncidents,
  recentIncidents,
}: StatusPageClientProps) {
  const overallStatus = useMemo(() => {
    if (monitors.length === 0) return 'unknown'
    const allUp = monitors.every(m => m.current_status === 'up')
    const allDown = monitors.every(m => m.current_status === 'down')
    if (allDown) return 'major_outage'
    if (allUp) return 'operational'
    return 'partial_outage'
  }, [monitors])

  const statusConfig = {
    operational: {
      label: 'All Systems Operational',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    partial_outage: {
      label: 'Partial System Outage',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    major_outage: {
      label: 'Major System Outage',
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    unknown: {
      label: 'Status Unknown',
      icon: MinusCircle,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
    },
  }

  const currentStatus = statusConfig[overallStatus as keyof typeof statusConfig]
  const StatusIcon = currentStatus.icon

  // Calculate uptime for each monitor
  const getMonitorUptime = (monitorId: string) => {
    const checks = healthChecks.filter(c => c.monitor_id === monitorId)
    if (checks.length === 0) return null
    const upChecks = checks.filter(c => c.status === 'up').length
    return ((upChecks / checks.length) * 100).toFixed(2)
  }

  // Get 30-day history for a monitor
  const getMonitorHistory = (monitorId: string) => {
    const checks = healthChecks.filter(c => c.monitor_id === monitorId)
    const days: { date: string; uptime: number }[] = []
    const now = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayChecks = checks.filter(c => {
        const checkDate = new Date(c.checked_at).toISOString().split('T')[0]
        return checkDate === dateStr
      })

      const upChecks = dayChecks.filter(c => c.status === 'up').length
      const uptime = dayChecks.length > 0 ? (upChecks / dayChecks.length) * 100 : -1

      days.push({ date: dateStr, uptime })
    }

    return days
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{statusPage.title}</h1>
          {statusPage.description && (
            <p className="text-muted-foreground">{statusPage.description}</p>
          )}
        </div>

        {/* Overall Status */}
        <Card className={cn('mb-8', currentStatus.bg)}>
          <CardContent className="flex items-center justify-center gap-3 py-6">
            <StatusIcon className={cn('h-8 w-8', currentStatus.color)} />
            <span className={cn('text-xl font-semibold', currentStatus.color)}>
              {currentStatus.label}
            </span>
          </CardContent>
        </Card>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Active Incidents</h2>
            <div className="space-y-4">
              {activeIncidents.map(incident => (
                <Card key={incident.id} className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      <Badge variant="destructive">{incident.status}</Badge>
                    </div>
                    <CardDescription>
                      Started {new Date(incident.started_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  {incident.incident_updates?.length > 0 && (
                    <CardContent>
                      <div className="space-y-3">
                        {incident.incident_updates
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 3)
                          .map(update => (
                            <div key={update.id} className="text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span className="capitalize font-medium">{update.status}</span>
                                <span>•</span>
                                <span>{new Date(update.created_at).toLocaleString()}</span>
                              </div>
                              <p className="mt-1">{update.message}</p>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          {monitors.length > 0 ? (
            <div className="space-y-3">
              {monitors.map(monitor => {
                const uptime = getMonitorUptime(monitor.id)
                const history = getMonitorHistory(monitor.id)
                const statusColor = {
                  up: 'text-green-600',
                  down: 'text-red-600',
                  unknown: 'text-gray-600',
                }[monitor.current_status]

                return (
                  <Card key={monitor.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'h-3 w-3 rounded-full',
                              monitor.current_status === 'up' && 'bg-green-500',
                              monitor.current_status === 'down' && 'bg-red-500',
                              monitor.current_status === 'unknown' && 'bg-gray-500'
                            )}
                          />
                          <span className="font-medium">{monitor.name}</span>
                        </div>
                        <span className={cn('text-sm font-medium', statusColor)}>
                          {monitor.current_status === 'up' ? 'Operational' :
                           monitor.current_status === 'down' ? 'Outage' : 'Unknown'}
                        </span>
                      </div>

                      {/* 30-day uptime bar */}
                      <div className="flex gap-0.5">
                        {history.map((day, i) => (
                          <div
                            key={i}
                            className={cn(
                              'flex-1 h-6 rounded-sm',
                              day.uptime === -1 && 'bg-gray-200',
                              day.uptime === 100 && 'bg-green-500',
                              day.uptime >= 99 && day.uptime < 100 && 'bg-green-400',
                              day.uptime >= 95 && day.uptime < 99 && 'bg-yellow-400',
                              day.uptime >= 0 && day.uptime < 95 && 'bg-red-500'
                            )}
                            title={`${day.date}: ${day.uptime >= 0 ? day.uptime.toFixed(1) + '%' : 'No data'}`}
                          />
                        ))}
                      </div>

                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>30 days ago</span>
                        {uptime && <span>{uptime}% uptime</span>}
                        <span>Today</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No services configured for this status page.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Incidents */}
        {recentIncidents.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Past Incidents</h2>
            <div className="space-y-4">
              {recentIncidents.map(incident => (
                <Card key={incident.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      <Badge variant="secondary">Resolved</Badge>
                    </div>
                    <CardDescription>
                      {new Date(incident.started_at).toLocaleDateString()} - Resolved {new Date(incident.resolved_at!).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-8" />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Powered by API Monitor Dashboard</p>
          <p className="mt-1">Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
