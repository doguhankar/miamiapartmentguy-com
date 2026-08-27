# Vercel Blob + Supabase Image Integration - Master Reference

**Quick Links:**
- 🚀 **Quick Start:** `docs/QUICK_INSTALL.md` (5 min setup)
- 📖 **Full Guide:** `docs/IMAGES_SETUP.md` (comprehensive)
- 💻 **Integration:** `docs/INTEGRATION_EXAMPLE.md` (how to use)
- 📋 **Complete Summary:** `docs/IMAGES_IMPLEMENTATION_SUMMARY.md` (overview)

---

## What You Get

### 6 New Files

1. **`scripts/upload-images.js`** (3.4 KB)
   - Node.js batch upload script
   - Upload images from local folder to Vercel Blob
   - Automatically update Supabase with image URLs

2. **`app/api/buildings/[id]/upload-images/route.ts`** (1.7 KB)
   - Server endpoint for browser-based uploads
   - Handles FormData with multiple files
   - Returns blob URLs and updates Supabase

3. **`lib/supabase-images.ts`** (1.9 KB)
   - `getBuildingImages(buildingId, fallback?)` - Fetch one building's images
   - `getAllBuildingImages()` - Fetch all buildings' images
   - Automatic fallback to hardcoded images if needed

4. **`components/image-carousel-supabase.tsx`** (2.9 KB)
   - Updated carousel component
   - Fetches images from Supabase on mount
   - Shows loading state and falls back to hardcoded images
   - Drop-in replacement for existing `ImageCarousel`

5. **`hooks/use-building-images.ts`** (1.2 KB)
   - React hook for image fetching
   - Returns: `{ images, loading, error }`
   - Use in any component needing building images

6. **`docs/` (4 files, 25.8 KB)**
   - `QUICK_INSTALL.md` - 5-minute setup guide
   - `IMAGES_SETUP.md` - Comprehensive documentation
   - `INTEGRATION_EXAMPLE.md` - Integration patterns
   - `IMAGES_IMPLEMENTATION_SUMMARY.md` - Complete overview

---

## 30-Second Overview

```typescript
// BEFORE: Hardcoded images
import { ImageCarousel } from '@/components/image-carousel'
<ImageCarousel images={building.images} />  // From lib/buildings.ts

// AFTER: Supabase-backed with fallback
import { ImageCarouselSupabase } from '@/components/image-carousel-supabase'
<ImageCarouselSupabase buildingId={building.id} fallbackImages={building.images} />
```

```bash
# UPLOAD: Simple one-line command
node scripts/upload-images.js ./images/flow-brickell flow-brickell
```

**Result:**
- ✅ Images stored permanently in Vercel Blob (survive redeploys)
- ✅ URLs saved to Supabase `buildings.image_urls` column
- ✅ Components fetch from Supabase with automatic fallback
- ✅ No breaking changes - works with existing code

---

## File-by-File Reference

### `scripts/upload-images.js`

**Purpose:** Batch upload images to Blob + Supabase

**Usage:**
```bash
node scripts/upload-images.js <folderPath> <buildingId>
```

**Example:**
```bash
node scripts/upload-images.js ./images/flow-brickell flow-brickell
```

**What it does:**
1. Reads all `.jpg`, `.png`, `.webp`, `.gif` files from folder
2. Uploads each to Vercel Blob as public file
3. Collects all resulting blob URLs
4. Updates Supabase `buildings` table: `image_urls = [urls...]`

**Output:**
```
📁 Found 8 images in ./images/flow-brickell
🏢 Building ID: flow-brickell
⬆️  Uploading 1/8: image1.jpg...
✅ Uploaded: https://...blob.vercel-storage.com/flow-1-timestamp-image1.jpg
... (more uploads)
✅ Supabase updated! 8 image URLs stored
📋 Image URLs:
   1. https://...
   2. https://...
```

---

### `app/api/buildings/[id]/upload-images/route.ts`

**Purpose:** Browser-based image upload endpoint

**API:**
```
POST /api/buildings/[buildingId]/upload-images
Content-Type: multipart/form-data

Form fields: files (multiple)
```

**Usage from client:**
```typescript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const res = await fetch(`/api/buildings/flow-brickell/upload-images`, {
  method: 'POST',
  body: formData
});

const data = await res.json();
console.log(data.imageUrls);  // Array of blob URLs
```

**Returns:**
```json
{
  "success": true,
  "imageUrls": [
    "https://...blob.vercel-storage.com/...",
    "https://...blob.vercel-storage.com/..."
  ],
  "building": { /* updated building from Supabase */ }
}
```

---

### `lib/supabase-images.ts`

**Purpose:** Utility functions for fetching images from Supabase

**Functions:**

#### `getBuildingImages(buildingId, fallbackImages?)`
Fetch images for a single building
```typescript
import { getBuildingImages } from '@/lib/supabase-images'

const images = await getBuildingImages('flow-brickell', fallbackImages)
// Returns: string[]
```

#### `getAllBuildingImages()`
Fetch images for all buildings
```typescript
import { getAllBuildingImages } from '@/lib/supabase-images'

const imageMap = await getAllBuildingImages()
// Returns: Map<buildingId, urls[]>

for (const [buildingId, urls] of imageMap) {
  console.log(`${buildingId}: ${urls.length} images`)
}
```

---

### `components/image-carousel-supabase.tsx`

**Purpose:** Carousel component that fetches from Supabase

**Usage:**
```typescript
import { ImageCarouselSupabase } from '@/components/image-carousel-supabase'

<ImageCarouselSupabase 
  buildingId="flow-brickell"
  fallbackImages={building.images}
/>
```

**Props:**
- `buildingId: string` - Building ID to fetch images for
- `fallbackImages?: string[]` - Images to show if Supabase fails

**Features:**
- Fetches on component mount
- Shows loading skeleton while fetching
- Falls back to hardcoded images if fetch fails
- Previous/next buttons to cycle through images
- Image counter (1/8, 2/8, etc.)

---

### `hooks/use-building-images.ts`

**Purpose:** React hook for image fetching in components

**Usage:**
```typescript
import { useBuildingImages } from '@/hooks/use-building-images'

const { images, loading, error } = useBuildingImages({
  buildingId: 'flow-brickell',
  fallbackImages: building.images
})

return (
  <>
    {loading && <Skeleton />}
    {error && <Error message={error.message} />}
    <ImageCarousel images={images} />
  </>
)
```

**Returns:**
```typescript
{
  images: string[]        // Array of image URLs
  loading: boolean        // true while fetching
  error: Error | null     // Error object if fetch failed
}
```

---

## Database Schema

Add this column to your Supabase `buildings` table:

```sql
-- Option 1: PostgreSQL Array Type (recommended)
ALTER TABLE buildings
ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Option 2: JSONB Type
ALTER TABLE buildings
ADD COLUMN image_urls JSONB DEFAULT '[]';

-- Initialize existing rows
UPDATE buildings SET image_urls = '{}' WHERE image_urls IS NULL;
```

---

## Environment Variables

Ensure these are set in your project:

```bash
# Vercel Blob
BLOB_READ_WRITE_TOKEN=...

# Supabase (public keys, safe for client)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Supabase (secret keys, server-side only)
SUPABASE_SERVICE_ROLE_KEY=...
POSTGRES_URL=...
```

---

## Quick Examples

### Example 1: Update BuildingDetailView
```typescript
// Before
import { ImageCarousel } from '@/components/image-carousel'
<ImageCarousel images={building.images} />

// After
import { ImageCarouselSupabase } from '@/components/image-carousel-supabase'
<ImageCarouselSupabase buildingId={building.id} fallbackImages={building.images} />
```

### Example 2: Upload Images
```bash
# Single building
node scripts/upload-images.js ./images/flow-brickell flow-brickell

# All buildings (batch)
for dir in images/*/; do
  building=$(basename "$dir")
  node scripts/upload-images.js "$dir" "$building"
done
```

### Example 3: Custom Hook in Component
```typescript
'use client'
import { useBuildingImages } from '@/hooks/use-building-images'

export function BuildingCard({ building }) {
  const { images } = useBuildingImages({
    buildingId: building.id,
    fallbackImages: building.images
  })

  return (
    <div>
      <img src={images[0]} alt={building.name} />
      <h3>{building.name}</h3>
    </div>
  )
}
```

### Example 4: API-based Upload
```typescript
async function uploadBuildingImages(buildingId: string, files: File[]) {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));

  const res = await fetch(`/api/buildings/${buildingId}/upload-images`, {
    method: 'POST',
    body: formData,
  });

  return res.json();  // { imageUrls: [...], building: {...} }
}
```

---

## Troubleshooting

### Upload script fails
**Check:**
- Folder exists: `ls ./images/flow-brickell`
- Environment variables set: `echo $BLOB_READ_WRITE_TOKEN`
- Building ID in database: `SELECT * FROM buildings WHERE id = 'flow-brickell'`

### Images not loading
**Check:**
- Supabase `image_urls` is populated
- Blob URLs are public and accessible
- Browser console for `[v0]` debug logs
- Network tab shows blob URL requests

### Component not rendering
**Check:**
- `fallbackImages` prop is provided
- Building ID matches exactly (case-sensitive)
- `image_urls` column exists in database

---

## Performance Notes

- Images fetch on component mount (client-side)
- Results cached in component state
- Use `fallbackImages` for instant display while fetching
- Vercel Blob provides global CDN delivery
- Consider SWR/React Query for advanced caching

---

## Security

- Blob URLs use `access: 'public'` for CDN delivery
- Supabase buildings table is read-only for anon users
- Service role key only used in Node.js scripts (server-side)
- No API key exposure in component code

---

## Next Steps

1. **Add column** - Add `image_urls` to Supabase
2. **Upload images** - Run `node scripts/upload-images.js`
3. **Update components** - Import `ImageCarouselSupabase`
4. **Test locally** - Verify images load
5. **Deploy** - Push to production with fallback

**Estimated time:** 15-30 minutes total

---

## Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| `QUICK_INSTALL.md` | 5-minute setup guide | 5 min |
| `IMAGES_SETUP.md` | Comprehensive guide | 15 min |
| `INTEGRATION_EXAMPLE.md` | How to use in components | 10 min |
| `IMAGES_IMPLEMENTATION_SUMMARY.md` | Complete overview | 20 min |
| `scripts/README.md` | Script documentation | 5 min |

---

**Status:** ✅ Complete
**Total Size:** ~14 KB code + 27 KB documentation
**Setup Time:** 5-30 minutes
**Deploy Time:** 2 minutes
