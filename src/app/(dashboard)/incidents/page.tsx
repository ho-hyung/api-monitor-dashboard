import { createClient } from '@/lib/supabase/server'
import { IncidentsClient } from './incidents-client'

export const dynamic = 'force-dynamic'

export default async function IncidentsPage() {
  const supabase = await createClient()

  const { data: incidents } = await supabase
    .from('incidents')
    .select('*, monitors(name), incident_updates(*)')
    .order('created_at', { ascending: false })

  const { data: monitors } = await supabase
    .from('monitors')
    .select('id, name')
    .order('name')

  return (
    <IncidentsClient
      initialIncidents={incidents ?? []}
      monitors={monitors ?? []}
    />
  )
}
