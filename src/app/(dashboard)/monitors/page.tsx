import { createClient } from '@/lib/supabase/server'
import { MonitorsClient } from './monitors-client'

export const dynamic = 'force-dynamic'

export default async function MonitorsPage() {
  const supabase = await createClient()

  const { data: monitors } = await supabase
    .from('monitors')
    .select('*')
    .order('created_at', { ascending: false })

  return <MonitorsClient initialMonitors={monitors ?? []} />
}
