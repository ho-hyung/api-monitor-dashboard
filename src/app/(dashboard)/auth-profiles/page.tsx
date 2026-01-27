import { createClient } from '@/lib/supabase/server'
import { AuthProfilesClient } from './auth-profiles-client'

export const dynamic = 'force-dynamic'

export default async function AuthProfilesPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('auth_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return <AuthProfilesClient initialProfiles={profiles ?? []} />
}
