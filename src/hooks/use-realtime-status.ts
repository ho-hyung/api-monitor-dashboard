'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Monitor } from '@/types/database'

export function useRealtimeMonitor(monitorId: string, initialData: Monitor) {
  const [monitor, setMonitor] = useState<Monitor>(initialData)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`monitor-${monitorId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'monitors',
          filter: `id=eq.${monitorId}`,
        },
        (payload) => {
          setMonitor(payload.new as Monitor)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [monitorId])

  return monitor
}

export function useRealtimeMonitors(initialData: Monitor[]) {
  const [monitors, setMonitors] = useState<Monitor[]>(initialData)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('monitors-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monitors',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMonitors((prev) => [payload.new as Monitor, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setMonitors((prev) =>
              prev.map((m) =>
                m.id === (payload.new as Monitor).id ? (payload.new as Monitor) : m
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setMonitors((prev) =>
              prev.filter((m) => m.id !== (payload.old as Monitor).id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return monitors
}
