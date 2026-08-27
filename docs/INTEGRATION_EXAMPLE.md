# Integration Example: Using Supabase Images in BuildingDetailView

This example shows how to update your existing `BuildingDetailView` component to fetch images from Supabase instead of hardcoded URLs.

## Current State (Hardcoded)

```typescript
// components/building-detail-view.tsx (current)
import { ImageCarousel } from '@/components/image-carousel'

export function BuildingDetailView({ building }: { building: Building }) {
  return (
    <div>
      {/* Images are hardcoded from lib/buildings.ts */}
      <ImageCarousel images={building.images} />
      
      <h1>{building.name}</h1>
      {/* ... rest of component */}
    </div>
  )
}
```

## Updated (Supabase-backed)

### Option A: Simple Replacement (Recommended)

```typescript
// components/building-detail-view.tsx (updated)
import { ImageCarouselSupabase } from '@/components/image-carousel-supabase'

export function BuildingDetailView({ building }: { building: Building }) {
  return (
    <div>
      {/* Fetch from Supabase with fallback to hardcoded */}
      <ImageCarouselSupabase 
        buildingId={building.id}
        fallbackImages={building.images}  // Fallback if Supabase fails
      />
      
      <h1>{building.name}</h1>
      {/* ... rest of component */}
    </div>
  )
}
```

**Benefits:**
- One-line change
- Automatic fallback to hardcoded images
- No breaking changes
- Works with existing code

---

### Option B: Custom Hook (For More Control)

```typescript
// components/building-detail-view.tsx (custom hook)
'use client'

import { useBuildingImages } from '@/hooks/use-building-images'
import { ImageCarousel } from '@/components/image-carousel'

export function BuildingDetailView({ building }: { building: Building }) {
  const { images, loading, error } = useBuildingImages({
    buildingId: building.id,
    fallbackImages: building.images
  })

  return (
    <div>
      {loading && <div>Loading images...</div>}
      {error && <div>Error loading images, showing fallback</div>}
      
      <ImageCarousel images={images} />
      
      <h1>{building.name}</h1>
      {/* ... rest of component */}
    </div>
  )
}
```

**Benefits:**
- Control over loading/error states
- Show custom UI during load
- Log errors for debugging
- Flexible fallback handling

---

### Option C: Full Custom Implementation

```typescript
// components/building-detail-view.tsx (full custom)
'use client'

import { useEffect, useState } from 'react'
import { getBuildingImages } from '@/lib/supabase-images'
import { ImageCarousel } from '@/components/image-carousel'

export function BuildingDetailView({ building }: { building: Building }) {
  const [images, setImages] = useState<string[]>(building.images)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadImages = async () => {
      try {
        // Try to fetch from Supabase
        const supabaseImages = await getBuildingImages(building.id)
        
        // Use Supabase images if available, otherwise keep hardcoded
        if (supabaseImages.length > 0) {
          setImages(supabaseImages)
          console.log(`[v0] Loaded ${supabaseImages.length} images from Supabase for ${building.id}`)
        } else {
          console.log(`[v0] No Supabase images found, using hardcoded`)
          setImages(building.images)
        }
      } catch (error) {
        console.error('[v0] Error loading images:', error)
        setImages(building.images)  // Fallback
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [building.id, building.images])

  return (
    <div>
      {loading ? (
        <div className="animate-pulse h-64 bg-gray-200 rounded" />
      ) : (
        <ImageCarousel images={images} />
      )}
      
      <h1>{building.name}</h1>
      {/* ... rest of component */}
    </div>
  )
}
```

**Benefits:**
- Full control over logic
- Custom loading states
- Detailed debugging
- Can implement caching if needed

---

## Step-by-Step Migration

### Step 1: Add Images to Supabase

```bash
# Upload images using the batch script
node scripts/upload-images.js ./images/flow-brickell flow-brickell
node scripts/upload-images.js ./images/modera-riverside modera-riverside
# ... repeat for all buildings
```

Verify in Supabase dashboard that `image_urls` column is populated.

### Step 2: Update BuildingDetailView (Simple)

Replace:
```typescript
<ImageCarousel images={building.images} />
```

With:
```typescript
<ImageCarouselSupabase 
  buildingId={building.id}
  fallbackImages={building.images}
/>
```

### Step 3: Import the New Component

Add to top of file:
```typescript
import { ImageCarouselSupabase } from '@/components/image-carousel-supabase'
```

### Step 4: Test

1. Build the app: `npm run build`
2. Open a building detail page
3. Check browser console for debug logs:
   ```
   [v0] Error fetching images from Supabase, using fallback  (if not yet uploaded)
   ```
4. Verify images load correctly

### Step 5: Monitor

- Check that Supabase images are loaded (use browser DevTools Network tab)
- Verify blob URLs are accessible
- Monitor error logs for any issues

---

## Deployment

After migration:

1. **Deploy to production** with fallback (no breaking changes)
2. **Run upload script** for all buildings (during off-peak hours)
3. **Verify in production** that images load from Supabase
4. **Optional:** Remove hardcoded images from `lib/buildings.ts` after confirming

---

## Troubleshooting

### Images not loading from Supabase

**Check:**
1. Supabase `image_urls` column is populated
   ```sql
   SELECT id, array_length(image_urls, 1) as count FROM buildings;
   ```

2. URLs are accessible
   ```bash
   curl -I "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/..."
   ```

3. Check browser console for errors
   - Open DevTools → Console
   - Look for `[v0]` logs

### Fallback not working

**Check:**
1. `fallbackImages={building.images}` is passed correctly
2. `building.images` array is not empty
3. Images in `building.images` are valid URLs

### Performance issues

**Solutions:**
1. Use `fallbackImages` to show cached images immediately
2. Add loading skeleton while fetching
3. Implement image lazy-loading with `loading="lazy"`
4. Consider caching with SWR or React Query

---

## Advanced: Batch Update All Buildings

After uploading all images, create a migration if needed:

```typescript
// scripts/verify-all-images.js
import { getAllBuildingImages } from '@/lib/supabase-images'

const allImages = await getAllBuildingImages()
console.log(`Total buildings with images: ${allImages.size}`)

for (const [buildingId, urls] of allImages) {
  console.log(`${buildingId}: ${urls.length} images`)
}
```

---

## Summary

| Method | Complexity | When to Use |
|--------|-----------|-----------|
| Option A | Low | Most cases - simple and reliable |
| Option B | Medium | Need custom loading/error UI |
| Option C | High | Complex requirements or caching |

**Recommended:** Start with Option A, upgrade to Option B if needed.
