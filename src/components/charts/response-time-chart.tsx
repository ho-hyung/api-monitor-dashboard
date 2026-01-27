'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { HealthCheck } from '@/types/database'

interface ResponseTimeChartProps {
  healthChecks: HealthCheck[]
}

export function ResponseTimeChart({ healthChecks }: ResponseTimeChartProps) {
  const chartData = useMemo(() => {
    // Reverse to show oldest first
    return [...healthChecks].reverse().map((check) => ({
      time: new Date(check.checked_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      responseTime: check.response_time_ms ?? 0,
      status: check.status,
    }))
  }, [healthChecks])

  const avgResponseTime = useMemo(() => {
    const validChecks = healthChecks.filter((c) => c.response_time_ms !== null)
    if (validChecks.length === 0) return 0
    const sum = validChecks.reduce((acc, c) => acc + (c.response_time_ms ?? 0), 0)
    return Math.round(sum / validChecks.length)
  }, [healthChecks])

  const maxResponseTime = useMemo(() => {
    return Math.max(...healthChecks.map((c) => c.response_time_ms ?? 0), 0)
  }, [healthChecks])

  if (healthChecks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Time</CardTitle>
          <CardDescription>No data available yet</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Waiting for health check data...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time</CardTitle>
        <CardDescription>
          Average: {avgResponseTime}ms | Max: {maxResponseTime}ms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}ms`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-1">
                        <span className="text-sm text-muted-foreground">
                          {data.time}
                        </span>
                        <span className="font-bold">
                          {data.responseTime}ms
                        </span>
                        <span className={`text-xs ${data.status === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {data.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="responseTime"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
