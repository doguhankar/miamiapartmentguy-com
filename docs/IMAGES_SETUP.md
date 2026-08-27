# Building Images - Vercel Blob & Supabase Setup

This guide explains how to set up image storage using Vercel Blob and Supabase.

## Overview

Images are now stored permanently in:
- **Vercel Blob** - Binary storage for image files
- **Supabase** - Reference URLs stored in `buildings.image_urls` (jsonb array)

Benefits:
- ✅ Images survive redeploys
- ✅ Centralized management in Supabase
- ✅ No hardcoded URLs in code
- ✅ Easy batch uploads
- ✅ Automatic CDN delivery via Vercel Blob

## Prerequisites

1. **Vercel Blob** - Connected (BLOB_READ_WRITE_TOKEN in env)
2. **Supabase** - Connected with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `POSTGRES_URL` (for scripts)

## Database Migration

Add `image_urls` column to `buildings` table:

```sql
ALTER TABLE buildings
ADD COLUMN image_urls jsonb DEFAULT '[]';

-- Or create the column if table doesn't exist:
CREATE TABLE buildings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',  -- PostgreSQL array type
  -- ... other columns
);
```

## Upload Images Locally

### Option 1: Batch Upload via Node.js Script

```bash
# Install dependencies
npm install @vercel/blob @supabase/supabase-js

# Upload images from a folder
node scripts/upload-images.js ./images/flow-brickell flow-brickell
node scripts/upload-images.js ./images/modera-riverside modera-riverside

# Expected output:
# 📁 Found 8 images in ./images/flow-brickell
# 🏢 Building ID: flow-brickell
# ⬆️  Uploading 1/8: image1.jpg...
# ✅ Uploaded: https://...blob.vercel-storage.com/...
# ... (more uploads)
# ✅ Supabase updated! 8 image URLs stored
```

### Option 2: Upload via API Route (Browser)

```typescript
async function uploadImages(buildingId: string, files: File[]) {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const response = await fetch(`/api/buildings/${buildingId}/upload-images`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.imageUrls;
}
```

## Using Images in Components

### Original (Hardcoded)
```typescript
import { ImageCarousel } from '@/components/image-carousel'

const building = buildings.find(b => b.id === 'flow-brickell')
<ImageCarousel images={building.images} />  // Hardcoded in buildings.ts
```

### New (Supabase-based)
```typescript
import { ImageCarouselSupabase } from '@/components/image-carousel-supabase'
import { useBuildingImages } from '@/hooks/use-building-images'

// In component:
const { images, loading } = useBuildingImages({
  buildingId: 'flow-brickell',
  fallbackImages: building.images  // Still available as fallback
})

<ImageCarouselSupabase buildingId="flow-brickell" />
```

### BuildingDetailView Update

```typescript
import { ImageCarouselSupabase } from '@/components/image-carousel-supabase'

export function BuildingDetailView({ building }) {
  return (
    <>
      {/* Fetch images from Supabase, fallback to hardcoded */}
      <ImageCarouselSupabase 
        buildingId={building.id}
        fallbackImages={building.images}
      />
      {/* ... rest of component */}
    </>
  )
}
```

## API Routes

### GET /api/buildings/[id]/images
Fetch images for a building (not yet implemented, but you can add):
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const images = await getBuildingImages(params.id)
  return NextResponse.json({ images })
}
```

### POST /api/buildings/[id]/upload-images
Upload images to Blob and save URLs to Supabase:
```bash
curl -X POST \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  http://localhost:3000/api/buildings/flow-brickell/upload-images
```

## Utilities

### `getBuildingImages(buildingId, fallbackImages?)`
Fetch images from Supabase for a single building.

```typescript
import { getBuildingImages } from '@/lib/supabase-images'

const images = await getBuildingImages('flow-brickell', fallbackImages)
```

### `getAllBuildingImages()`
Fetch images for all buildings.

```typescript
import { getAllBuildingImages } from '@/lib/supabase-images'

const allImages = await getAllBuildingImages()  // Returns Map<buildingId, urls[]>
```

### `useBuildingImages(options)`
Hook for fetching images in client components.

```typescript
import { useBuildingImages } from '@/hooks/use-building-images'

const { images, loading, error } = useBuildingImages({
  buildingId: 'flow-brickell',
  fallbackImages: building.images
})
```

## Testing

1. **Upload locally**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_key \
   BLOB_READ_WRITE_TOKEN=your_token \
   NEXT_PUBLIC_SUPABASE_URL=your_url \
   node scripts/upload-images.js ./test-images my-building
   ```

2. **Check Supabase**
   - Go to Supabase dashboard
   - Open `buildings` table
   - Find your building and verify `image_urls` column has array of URLs

3. **Verify in app**
   - Import `ImageCarouselSupabase`
   - Component will fetch from Supabase
   - Check browser console for debug logs

## Troubleshooting

### Images not loading
- Check `BLOB_READ_WRITE_TOKEN` is set
- Verify URLs in Supabase are publicly accessible
- Check browser CORS - Vercel Blob URLs should be public

### Supabase update fails
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check building ID exists in database
- Ensure `image_urls` column exists and is jsonb/array type

### Script fails
- Verify image folder exists: `ls ./images/my-building`
- Check file permissions: `chmod +r ./images/my-building/*`
- Verify building ID matches exactly (case-sensitive)

## Migration Path

1. **Phase 1** - Both systems work (hardcoded + Supabase)
   - Images still in `lib/buildings.ts` as fallback
   - `ImageCarouselSupabase` uses Supabase with fallback

2. **Phase 2** - Remove hardcoded images
   - All images in Supabase via upload script
   - Update `lib/buildings.ts` to remove image arrays
   - Keep fallback for graceful degradation

3. **Phase 3** - Optimize
   - Add image optimization (resize, compression)
   - Implement caching strategy
   - Monitor Blob storage usage

## Files Added

- `scripts/upload-images.js` - Batch upload script
- `app/api/buildings/[id]/upload-images/route.ts` - Upload API
- `lib/supabase-images.ts` - Fetching utilities
- `components/image-carousel-supabase.tsx` - Updated carousel
- `hooks/use-building-images.ts` - Image fetching hook
- `docs/IMAGES_SETUP.md` - This file
