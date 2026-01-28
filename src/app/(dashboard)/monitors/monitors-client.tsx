'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Plus, RefreshCw } from 'lucide-react'
import type { Monitor } from '@/types/database'

interface MonitorsClientProps {
  initialMonitors: Monitor[]
}

function formatDateKST(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function MonitorCard({ monitor }: { monitor: Monitor }) {
  const [lastChecked, setLastChecked] = useState<string>('Loading...')

  useEffect(() => {
    if (monitor.last_checked_at) {
      setLastChecked(formatDateKST(monitor.last_checked_at))
    } else {
      setLastChecked('Never')
    }
  }, [monitor.last_checked_at])

  const statusColor = {
    up: 'bg-green-500',
    down: 'bg-red-500',
    unknown: 'bg-gray-500',
  }[monitor.current_status]

  const statusText = {
    up: 'Operational',
    down: 'Down',
    unknown: 'Unknown',
  }[monitor.current_status]

  return (
    <Link href={`/monitors/${monitor.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">
            {monitor.name}
          </CardTitle>
          <Badge
            variant="secondary"
            className={cn(
              'gap-1 shrink-0',
              monitor.current_status === 'up' && 'bg-green-100 text-green-700',
              monitor.current_status === 'down' && 'bg-red-100 text-red-700',
              monitor.current_status === 'unknown' && 'bg-gray-100 text-gray-700'
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', statusColor)} />
            {statusText}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground truncate mb-2">
            {monitor.url}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{monitor.method}</span>
            <span>Last: {lastChecked}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function MonitorsClient({ initialMonitors }: MonitorsClientProps) {
  const [monitors, setMonitors] = useState<Monitor[]>(initialMonitors)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/monitors')
      if (response.ok) {
        const result = await response.json()
        setMonitors(result.data ?? [])
      }
    } catch (error) {
      console.error('Failed to refresh monitors:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitors</h2>
          <p className="text-muted-foreground">
            Manage your API endpoints and health checks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Link href="/monitors/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Monitor
            </Button>
          </Link>
        </div>
      </div>

      {monitors && monitors.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground mb-4">
            No monitors yet. Create your first monitor to start tracking API health.
          </p>
          <Link href="/monitors/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Monitor
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
