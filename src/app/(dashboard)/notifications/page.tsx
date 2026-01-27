import { createClient } from '@/lib/supabase/server'
import { NotificationsClient } from './notifications-client'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: channels } = await supabase
    .from('notification_channels')
    .select('*')
    .order('created_at', { ascending: false })

  return <NotificationsClient initialChannels={channels ?? []} />
}
