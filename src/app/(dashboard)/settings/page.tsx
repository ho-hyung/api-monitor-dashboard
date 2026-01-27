import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './settings-client'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: statusPage } = await supabase
    .from('status_page_settings')
    .select('*')
    .maybeSingle()

  return (
    <SettingsClient
      user={user}
      initialStatusPage={statusPage}
    />
  )
}
