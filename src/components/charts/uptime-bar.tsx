'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { HealthCheck } from '@/types/database'

interface UptimeBarProps {
  healthChecks: HealthCheck[]
  days?: number
}

export function UptimeBar({ healthChecks, days = 30 }: UptimeBarProps) {
  const dailyStats = useMemo(() => {
    const stats: { date: string; uptime: number; checks: number }[] = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayChecks = healthChecks.filter((check) => {
        const checkDate = new Date(check.checked_at).toISOString().split('T')[0]
        return checkDate === dateStr
      })

      const upChecks = dayChecks.filter((c) => c.status === 'up').length
      const uptime = dayChecks.length > 0 ? (upChecks / dayChecks.length) * 100 : -1

      stats.push({
        date: dateStr,
        uptime,
        checks: dayChecks.length,
      })
    }

    return stats
  }, [healthChecks, days])

  const overallUptime = useMemo(() => {
    const validDays = dailyStats.filter((s) => s.checks > 0)
    if (validDays.length === 0) return 0
    const totalUptime = validDays.reduce((acc, s) => acc + s.uptime, 0)
    return (totalUptime / validDays.length).toFixed(2)
  }, [dailyStats])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Uptime</span>
          <span className="text-green-600">{overallUptime}%</span>
        </CardTitle>
        <CardDescription>Last {days} days</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex gap-0.5">
            {dailyStats.map((stat) => (
              <Tooltip key={stat.date}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'flex-1 h-8 rounded-sm cursor-pointer transition-opacity hover:opacity-80',
                      stat.checks === 0 && 'bg-gray-200',
                      stat.uptime === 100 && 'bg-green-500',
                      stat.uptime >= 99 && stat.uptime < 100 && 'bg-green-400',
                      stat.uptime >= 95 && stat.uptime < 99 && 'bg-yellow-400',
                      stat.uptime >= 0 && stat.uptime < 95 && 'bg-red-500'
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <p className="font-medium">{stat.date}</p>
                    {stat.checks > 0 ? (
                      <>
                        <p>Uptime: {stat.uptime.toFixed(1)}%</p>
                        <p className="text-muted-foreground">
                          {stat.checks} checks
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No data</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
