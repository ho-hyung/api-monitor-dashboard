import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const authProfileSchema = z.object({
  name: z.string().min(1).max(255),
  login_url: z.string().url(),
  login_method: z.enum(['GET', 'POST']).default('POST'),
  login_body: z.record(z.string(), z.string()).default({}),
  token_path: z.string().min(1).default('access_token'),
  token_type: z.enum(['Bearer', 'Basic', 'API-Key']).default('Bearer'),
  header_name: z.string().min(1).default('Authorization'),
  expires_in_seconds: z.number().int().positive().nullable().default(3600),
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('auth_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validated = authProfileSchema.parse(body)

    const { data, error } = await supabase
      .from('auth_profiles')
      .insert({
        user_id: user.id,
        ...validated,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
