# Quick Installation Guide

## 1-2-3 Setup for Vercel Blob + Supabase Images

### Step 1: Prepare Your Images

Create a folder structure with your building images:

```
images/
├── flow-brickell/
│   ├── bedroom1.jpg
│   ├── bedroom2.jpg
│   ├── living-room.jpg
│   └── kitchen.jpg
├── modera-riverside/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
└── ...
```

### Step 2: Add image_urls Column to Supabase

```sql
-- Open Supabase SQL Editor and run:
ALTER TABLE buildings
ADD COLUMN image_urls TEXT[] DEFAULT '{}';

-- Or if using PostgreSQL array type:
UPDATE buildings SET image_urls = '{}' WHERE image_urls IS NULL;
```

### Step 3: Run the Upload Script

```bash
# Ensure you're in the project root
cd /path/to/miamiapartmentguy-com

# Upload Flow Brickell
node scripts/upload-images.js ./images/flow-brickell flow-brickell

# Upload Modera Riverside  
node scripts/upload-images.js ./images/modera-riverside modera-riverside

# Repeat for each building...
```

**Expected Output:**
```
📁 Found 4 images in ./images/flow-brickell
🏢 Building ID: flow-brickell

⬆️  Uploading 1/4: bedroom1.jpg...
✅ Uploaded: https://hebbkx1anhila5yf.public.blob.vercel-storage.com/...

... (more uploads)

✅ Supabase updated! 4 image URLs stored
```

### Step 4: Update Components

In `BuildingDetailView` or anywhere showing building images:

**Before:**
```typescript
import { ImageCarousel } from '@/components/image-carousel'

<ImageCarousel images={building.images} />
```

**After:**
```typescript
import { ImageCarouselSupabase } from '@/components/image-carousel-supabase'

<ImageCarouselSupabase 
  buildingId={building.id}
  fallbackImages={building.images}
/>
```

### Step 5: Deploy

```bash
npm run build
git add -A
git commit -m "feat: integrate Vercel Blob + Supabase image storage"
git push
vercel deploy --prod
```

---

## Verification Checklist

- [ ] Images folder created with subfolders per building
- [ ] `image_urls` column added to Supabase `buildings` table
- [ ] Upload script runs without errors for at least one building
- [ ] Supabase shows image URLs in the `image_urls` column
- [ ] Component updated to use `ImageCarouselSupabase`
- [ ] Local build succeeds: `npm run build`
- [ ] Code committed and pushed
- [ ] Deployed to production

---

## Common Issues & Fixes

### "Missing environment variables"
**Fix:** Ensure these are set:
```bash
export BLOB_READ_WRITE_TOKEN="your_token"
export SUPABASE_SERVICE_ROLE_KEY="your_key"  
export NEXT_PUBLIC_SUPABASE_URL="your_url"
```

### "Building not found in Supabase"
**Fix:** Verify the building ID exists and matches exactly (case-sensitive):
```sql
SELECT id FROM buildings WHERE id = 'flow-brickell';
```

### "No images displayed in component"
**Fix:** 
1. Check browser console for error logs
2. Verify `fallbackImages` prop is passed
3. Confirm blob URLs are publicly accessible:
```bash
curl -I "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/..."
```

### "Images not loading after deploy"
**Fix:** 
1. Check that Supabase `image_urls` is populated
2. Verify component import: `ImageCarouselSupabase`
3. Wait 5 minutes for CDN cache to update

---

## Batch Upload All Buildings (Advanced)

After uploading a few, you can batch upload the rest:

```bash
#!/bin/bash
# upload-all.sh

for dir in images/*/; do
  if [ -d "$dir" ]; then
    building=$(basename "$dir")
    echo "📤 Uploading: $building"
    node scripts/upload-images.js "$dir" "$building"
    echo ""
  fi
done

echo "✅ All buildings uploaded!"
```

Run it:
```bash
chmod +x upload-all.sh
./upload-all.sh
```

---

## Need Help?

- 📖 Full setup guide: `docs/IMAGES_SETUP.md`
- 💻 Integration examples: `docs/INTEGRATION_EXAMPLE.md`
- 🔧 Script docs: `scripts/README.md`
- 📋 Complete summary: `docs/IMAGES_IMPLEMENTATION_SUMMARY.md`

---

## What's Included

- ✅ Upload script for batch image uploads
- ✅ API route for browser-based uploads
- ✅ React component to display Supabase images
- ✅ Custom hook for image fetching
- ✅ Automatic fallback to hardcoded images
- ✅ Comprehensive documentation

---

**Time to complete:** ~15 minutes per building
