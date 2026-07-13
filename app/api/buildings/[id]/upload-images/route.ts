import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const buildingId = params.id;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const filename = `${buildingId}-${Date.now()}-${file.name}`;

      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: file.type,
      });

      uploadedUrls.push(blob.url);
    }

    // Update Supabase with the new image URLs
    const { data, error } = await supabase
      .from('buildings')
      .update({ image_urls: uploadedUrls })
      .eq('id', buildingId)
      .select();

    if (error) {
      return NextResponse.json(
        { error: `Failed to update Supabase: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrls: uploadedUrls,
      building: data?.[0],
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}
