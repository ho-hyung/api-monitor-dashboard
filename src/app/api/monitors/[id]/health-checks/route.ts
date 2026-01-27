import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/monitors/[id]/health-checks - Get health check history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query params for pagination and filtering
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100'), 1000)
    const hours = parseInt(url.searchParams.get('hours') ?? '24')

    const startDate = new Date()
    startDate.setHours(startDate.getHours() - hours)

    const { data, error } = await supabase
      .from('health_checks')
      .select('*')
      .eq('monitor_id', id)
      .gte('checked_at', startDate.toISOString())
      .order('checked_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
