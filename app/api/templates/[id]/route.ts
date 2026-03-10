import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params
  const isAdmin = await getAdminSession()

  const supabase = isAdmin ? createAdminClient() : createClient()

  const query = supabase.from('templates').select('*').eq('id', id)

  // Public users can only see published templates
  if (!isAdmin) {
    query.eq('is_published', true)
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params
  const isAdmin = await getAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase.from('templates').update(body).eq('id', id).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const isAdmin = await getAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase.from('templates').update(body).eq('id', id).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const isAdmin = await getAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('templates').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
