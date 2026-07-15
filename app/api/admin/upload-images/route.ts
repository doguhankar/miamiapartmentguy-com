import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for large image batches

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const buildingId = formData.get('buildingId') as string | null
  if (!buildingId) {
    return NextResponse.json({ error: 'buildingId is required' }, { status: 400 })
  }

  const files = formData.getAll('images') as File[]
  if (!files.length) {
    return NextResponse.json({ error: 'No images provided' }, { status: 400 })
  }

  // Delete existing images for this building if requested (replace mode)
  const replace = formData.get('replace') === 'true'
  if (replace) {
    // Remove DB records
    await supabase.from('building_images').delete().eq('building_id', buildingId)
    // Remove storage objects
    const { data: storageFiles } = await supabase.storage
      .from('building-images')
      .list(buildingId)
    if (storageFiles?.length) {
      const paths = storageFiles.map((f) => `${buildingId}/${f.name}`)
      await supabase.storage.from('building-images').remove(paths)
    }
  }

  // Get current max sort_order for this building
  const { data: existing } = await supabase
    .from('building_images')
    .select('sort_order')
    .eq('building_id', buildingId)
    .order('sort_order', { ascending: false })
    .limit(1)

  let nextOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

  const results: { fileName: string; url: string; error?: string }[] = []

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${buildingId}/${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: storageError } = await supabase.storage
      .from('building-images')
      .upload(storagePath, buffer, {
        contentType: file.type || `image/${ext}`,
        upsert: true,
      })

    if (storageError) {
      results.push({ fileName: file.name, url: '', error: storageError.message })
      continue
    }

    const { data: { publicUrl } } = supabase.storage
      .from('building-images')
      .getPublicUrl(storagePath)

    const { error: dbError } = await supabase.from('building_images').insert({
      building_id: buildingId,
      image_url: publicUrl,
      file_name: safeName,
      sort_order: nextOrder++,
    })

    if (dbError) {
      results.push({ fileName: file.name, url: publicUrl, error: dbError.message })
    } else {
      results.push({ fileName: file.name, url: publicUrl })
    }
  }

  const failed = results.filter((r) => r.error)
  const succeeded = results.filter((r) => !r.error)

  return NextResponse.json({
    buildingId,
    uploaded: succeeded.length,
    failed: failed.length,
    results,
  })
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
