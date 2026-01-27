import { MonitorForm } from '@/components/monitors/monitor-form'

export const dynamic = 'force-dynamic'

export default function NewMonitorPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <MonitorForm mode="create" />
    </div>
  )
}
