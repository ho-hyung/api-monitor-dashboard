import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateSmartDefaults } from '@/lib/monitors/smart-defaults'

// GET /api/monitors/smart-defaults?url=https://... - Get smart defaults for a URL
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = request.nextUrl.searchParams.get('url')
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Fetch user's auth profiles for matching
    const { data: authProfiles, error: profilesError } = await supabase
      .from('auth_profiles')
      .select('*')

    if (profilesError) {
      console.error('Failed to fetch auth profiles:', profilesError)
    }

    const smartDefaults = generateSmartDefaults(url, authProfiles ?? [])

    return NextResponse.json({ data: smartDefaults })
  } catch (error) {
    console.error('Smart defaults error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
