import { MonitorForm } from '@/components/monitors/monitor-form'

export default function NewMonitorPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <MonitorForm mode="create" />
    </div>
  )
}
