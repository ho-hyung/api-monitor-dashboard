import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MonitorForm } from '@/components/monitors/monitor-form'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditMonitorPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: monitor, error } = await supabase
    .from('monitors')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !monitor) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <MonitorForm monitor={monitor} mode="edit" />
    </div>
  )
}
