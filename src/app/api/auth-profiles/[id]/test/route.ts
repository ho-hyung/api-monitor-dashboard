import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchToken } from '@/lib/health-check/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('auth_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Auth profile not found' }, { status: 404 })
  }

  const result = await fetchToken(profile)

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: 'Token fetched successfully',
      token_preview: result.token?.substring(0, 20) + '...',
    })
  } else {
    return NextResponse.json({
      success: false,
      error: result.error,
    }, { status: 400 })
  }
}
