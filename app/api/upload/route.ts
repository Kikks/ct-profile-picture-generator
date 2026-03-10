import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { getAdminSession } from '@/lib/auth'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Please upload a PNG, JPEG, WebP, or GIF.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'png'
  const filename = `overlays/${crypto.randomUUID()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const supabase = createAdminClient()
  const { error } = await supabase.storage.from('overlays').upload(filename, arrayBuffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    console.error('Supabase upload error:', error.message)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('overlays').getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
