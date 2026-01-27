import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { MonitorCard } from '@/components/monitors/monitor-card'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MonitorsPage() {
  const supabase = await createClient()

  const { data: monitors } = await supabase
    .from('monitors')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitors</h2>
          <p className="text-muted-foreground">
            Manage your API endpoints and health checks
          </p>
        </div>
        <Link href="/monitors/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Monitor
          </Button>
        </Link>
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
