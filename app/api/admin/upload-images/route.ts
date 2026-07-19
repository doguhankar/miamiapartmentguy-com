import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 300
// Do NOT call request.formData() — that buffers the entire body and hits the
// 4.5 MB Next.js default limit. Instead we receive one file per request as a
// raw binary body (request.body ReadableStream) and pipe it straight to
// Supabase Storage so nothing accumulates in memory.

const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp', gif: 'image/gif',
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const buildingId = searchParams.get('buildingId')
  const fileName   = searchParams.get('fileName')
  const replace    = searchParams.get('replace') === 'true'
  const sortParam  = searchParams.get('sortOrder')

  if (!buildingId) return NextResponse.json({ error: 'buildingId is required' }, { status: 400 })
  if (!fileName)   return NextResponse.json({ error: 'fileName is required' },   { status: 400 })
  if (!request.body) return NextResponse.json({ error: 'No body' }, { status: 400 })

  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (!IMAGE_TYPES[ext]) {
    return NextResponse.json({ error: `Unsupported file type: .${ext}` }, { status: 415 })
  }

  const supabase = createAdminClient()

  // Replace mode: clear existing images for this building (only on first file)
  if (replace) {
    await supabase.from('building_images').delete().eq('building_id', buildingId)
    const { data: storageFiles } = await supabase.storage.from('building-images').list(buildingId)
    if (storageFiles?.length) {
      await supabase.storage
        .from('building-images')
        .remove(storageFiles.map((f) => `${buildingId}/${f.name}`))
    }
  }

  // Determine sort order
  let sortOrder = sortParam != null ? parseInt(sortParam, 10) : NaN
  if (isNaN(sortOrder)) {
    const { data: rows } = await supabase
      .from('building_images')
      .select('sort_order')
      .eq('building_id', buildingId)
      .order('sort_order', { ascending: false })
      .limit(1)
    sortOrder = rows?.[0]?.sort_order != null ? rows[0].sort_order + 1 : 0
  }

  const safeName    = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${buildingId}/${safeName}`
  const contentType = request.headers.get('content-type') || IMAGE_TYPES[ext]

  // Pipe request.body (ReadableStream) directly to Supabase — zero buffering
  const { error: storageError } = await supabase.storage
    .from('building-images')
    .upload(storagePath, request.body as ReadableStream, {
      contentType,
      upsert: true,
      duplex: 'half',
    } as Parameters<typeof supabase.storage.from>['0'] extends never ? never : any)

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('building-images')
    .getPublicUrl(storagePath)

  const { error: dbError } = await supabase.from('building_images').insert({
    building_id: buildingId,
    image_url:   publicUrl,
    file_name:   safeName,
    sort_order:  sortOrder,
  })

  if (dbError) {
    return NextResponse.json({ error: dbError.message, url: publicUrl }, { status: 500 })
  }

  return NextResponse.json({ fileName: safeName, url: publicUrl, sortOrder })
}

// GET: list images for a building
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const buildingId = searchParams.get('buildingId')
  if (!buildingId) {
    return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('building_images')
    .select('*')
    .eq('building_id', buildingId)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ buildingId, images: data })
}

// DELETE: remove all images for a building
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const buildingId = searchParams.get('buildingId')
  if (!buildingId) {
    return NextResponse.json({ error: 'buildingId required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: storageFiles } = await supabase.storage
    .from('building-images')
    .list(buildingId)

  if (storageFiles?.length) {
    const paths = storageFiles.map((f) => `${buildingId}/${f.name}`)
    await supabase.storage.from('building-images').remove(paths)
  }

  const { error } = await supabase
    .from('building_images')
    .delete()
    .eq('building_id', buildingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ buildingId, deleted: true })
}
