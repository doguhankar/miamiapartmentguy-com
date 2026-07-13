# Image Upload & Supabase Integration - Complete Implementation

## Overview

This implementation adds permanent image storage for building listings using:
- **Vercel Blob** - Stores images as public files
- **Supabase** - Stores image URLs in buildings table
- **Node.js Script** - Batch uploads from local folders
- **API Route** - Handles browser-based uploads
- **React Components** - Fetch and display images from Supabase

## Files Added

### 1. Upload Script
**File:** `scripts/upload-images.js`

**Purpose:** Batch upload images from a local folder to Vercel Blob and save URLs to Supabase

**Usage:**
```bash
node scripts/upload-images.js ./images/flow-brickell flow-brickell
```

**What it does:**
- Reads all images from folder
- Uploads each to Vercel Blob
- Updates Supabase `buildings` table with image URLs

---

### 2. API Route for Uploads
**File:** `app/api/buildings/[id]/upload-images/route.ts`

**Purpose:** Server endpoint to handle image uploads from the browser

**Usage:**
```typescript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const response = await fetch(`/api/buildings/flow-brickell/upload-images`, {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.imageUrls);  // Array of blob URLs
```

**What it does:**
- Accepts multiple files via FormData
- Uploads to Vercel Blob
- Updates Supabase with URLs

---

### 3. Image Fetching Utilities
**File:** `lib/supabase-images.ts`

**Functions:**

#### `getBuildingImages(buildingId, fallbackImages?)`
Fetch images for a single building from Supabase
```typescript
import { getBuildingImages } from '@/lib/supabase-images'

const images = await getBuildingImages('flow-brickell', fallbackImages)
// Returns: string[] of blob URLs
```

#### `getAllBuildingImages()`
Fetch images for all buildings
```typescript
const imageMap = await getAllBuildingImages()
// Returns: Map<buildingId, urls[]>
```

---

### 4. Updated Image Carousel Component
**File:** `components/image-carousel-supabase.tsx`

**Purpose:** Carousel that fetches images from Supabase with fallback support

**Usage:**
```typescript
import { ImageCarouselSupabase } from '@/components/image-carousel-supabase'

<ImageCarouselSupabase 
  buildingId="flow-brickell"
  fallbackImages={building.images}  // Fallback if Supabase fails
/>
```

**Features:**
- Fetches from Supabase on component mount
- Shows loading state while fetching
- Falls back to hardcoded images if needed
- Works with existing `<img>` tags and Blob URLs

---

### 5. Image Fetching Hook
**File:** `hooks/use-building-images.ts`

**Purpose:** React hook for fetching building images in components

**Usage:**
```typescript
import { useBuildingImages } from '@/hooks/use-building-images'

const { images, loading, error } = useBuildingImages({
  buildingId: 'flow-brickell',
  fallbackImages: building.images
})
```

**Returns:**
- `images` - Array of image URLs
- `loading` - Boolean indicating fetch in progress
- `error` - Error object if fetch failed

---

### 6. Documentation Files
- `docs/IMAGES_SETUP.md` - Complete setup guide
- `docs/INTEGRATION_EXAMPLE.md` - How to integrate with existing components
- `scripts/README.md` - Script documentation

---

## Quick Start

### 1. Upload Images
```bash
# Set environment variables (optional if already set)
export BLOB_READ_WRITE_TOKEN="your_token"
export SUPABASE_SERVICE_ROLE_KEY="your_key"

# Run upload script
node scripts/upload-images.js ./images/flow-brickell flow-brickell
```

### 2. Update Component
```typescript
// Old
import { ImageCarousel } from '@/components/image-carousel'
<ImageCarousel images={building.images} />

// New
import { ImageCarouselSupabase } from '@/components/image-carousel-supabase'
<ImageCarouselSupabase buildingId={building.id} fallbackImages={building.images} />
```

### 3. Deploy
```bash
npm run build
git add -A
git commit -m "chore: add Vercel Blob + Supabase image integration"
git push
```

---

## Database Schema

Required `buildings` table columns:

```sql
ALTER TABLE buildings
ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Or JSONB type:
ALTER TABLE buildings  
ADD COLUMN image_urls JSONB DEFAULT '[]';
```

The script handles both array and JSONB formats automatically.

---

## Environment Variables Required

```env
# Vercel Blob
BLOB_READ_WRITE_TOKEN=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

All must be set before running upload script or API.

---

## Code Examples

### Example 1: Simple Component Update
```typescript
// Before
<ImageCarousel images={building.images} />

// After (one-line change)
<ImageCarouselSupabase buildingId={building.id} fallbackImages={building.images} />
```

### Example 2: Custom Hook Usage
```typescript
'use client'
import { useBuildingImages } from '@/hooks/use-building-images'

export function MyComponent({ buildingId }) {
  const { images, loading } = useBuildingImages({
    buildingId,
    fallbackImages: []
  })

  return (
    <div>
      {loading ? <Skeleton /> : <ImageCarousel images={images} />}
    </div>
  )
}
```

### Example 3: Upload Images from API
```typescript
async function uploadBuildingImages(buildingId: string, files: File[]) {
  const formData = new FormData()
  files.forEach(f => formData.append('files', f))

  const res = await fetch(`/api/buildings/${buildingId}/upload-images`, {
    method: 'POST',
    body: formData
  })

  const data = await res.json()
  return data.imageUrls  // Array of blob URLs
}
```

### Example 4: Batch Upload Script
```bash
# Upload all buildings at once
for dir in ./images/*/; do
  building=$(basename "$dir")
  echo "Uploading $building..."
  node scripts/upload-images.js "$dir" "$building"
done
```

---

## Features

✅ **Permanent Storage** - Images survive redeploys
✅ **Centralized Management** - All URLs in Supabase
✅ **Batch Upload** - Upload multiple images with one command
✅ **Automatic Fallback** - Works with existing hardcoded images
✅ **Browser Upload** - Upload via API from admin panel
✅ **No Breaking Changes** - Old and new systems work together
✅ **CDN Delivery** - Vercel Blob provides global CDN
✅ **Easy Migration** - Can be added incrementally

---

## Support & Troubleshooting

See `docs/IMAGES_SETUP.md` for troubleshooting guide.

### Common Issues

**Images not loading:**
- Check `image_urls` column is populated in Supabase
- Verify blob URLs are publicly accessible
- Check browser console for `[v0]` debug logs

**Upload script fails:**
- Verify environment variables are set
- Check folder path exists and has read permissions
- Verify building ID matches database

**Component not rendering images:**
- Confirm fallback images are provided
- Check network tab for failed blob requests
- Look for error messages in console

---

## Next Steps

1. **Upload existing images** - Run batch upload script
2. **Update components** - Replace hardcoded image imports
3. **Test in staging** - Verify images load correctly
4. **Deploy to production** - With automatic fallback
5. **Monitor** - Track Blob storage usage and costs
6. **Optional cleanup** - Remove hardcoded images after migration is complete

---

## Files Structure

```
├── scripts/
│   ├── upload-images.js              # Main upload script
│   └── README.md                     # Script documentation
│
├── app/api/buildings/
│   └── [id]/upload-images/
│       └── route.ts                  # Upload API endpoint
│
├── lib/
│   └── supabase-images.ts            # Fetching utilities
│
├── components/
│   └── image-carousel-supabase.tsx   # Updated carousel
│
├── hooks/
│   └── use-building-images.ts        # Image fetching hook
│
└── docs/
    ├── IMAGES_SETUP.md               # Setup guide
    ├── INTEGRATION_EXAMPLE.md        # Integration patterns
    └── IMAGES_IMPLEMENTATION_SUMMARY.md  # This file
```

---

## Performance Notes

- Images are fetched on component mount (client-side)
- Results are cached via React component state
- Use `fallbackImages` for instant display
- Blob CDN provides global delivery
- Consider implementing SWR/React Query for advanced caching

---

## Security

- Vercel Blob URLs use `access: 'public'` for CDN delivery
- Supabase `buildings` table is read-only for anon users
- Service role key only used in Node.js scripts (server-side)
- No sensitive data in URLs - only image file references

---

Generated: $(date)
