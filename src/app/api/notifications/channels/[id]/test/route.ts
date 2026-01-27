import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/notifications/sender'
import type { NotificationChannel, Monitor } from '@/types/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/notifications/channels/[id]/test - Send a test notification
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: channel, error: channelError } = await supabase
      .from('notification_channels')
      .select('*')
      .eq('id', id)
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Create a mock monitor for testing
    const mockMonitor: Monitor = {
      id: 'test-monitor',
      user_id: user.id,
      name: 'Test Monitor',
      url: 'https://example.com',
      method: 'GET',
      interval_seconds: 300,
      current_status: 'up',
      is_public: false,
      last_checked_at: new Date().toISOString(),
      auth_profile_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const result = await sendNotification(
      channel as NotificationChannel,
      mockMonitor,
      'up',
      'This is a test notification from API Monitor Dashboard. If you see this, your notification channel is configured correctly!'
    )

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Test notification sent successfully' })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
