'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Monitor } from '@/types/database'

interface MonitorCardProps {
  monitor: Monitor
}

export function MonitorCard({ monitor }: MonitorCardProps) {
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  const lastChecked = monitor.last_checked_at
    ? formatDate(monitor.last_checked_at)
    : 'Never'

  return (
    <Link href={`/monitors/${monitor.id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium truncate">
            {monitor.name}
          </CardTitle>
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
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground truncate mb-2">
            {monitor.url}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{monitor.method}</span>
            <span suppressHydrationWarning>Last: {lastChecked}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
