# Scripts

Utility scripts for the Miami Apartment Guy application.

## upload-images.js

Batch upload images to Vercel Blob and store URLs in Supabase.

### Usage

```bash
node scripts/upload-images.js <folderPath> <buildingId>
```

### Parameters

- `folderPath` - Local folder containing images (jpg, jpeg, png, webp, gif)
- `buildingId` - Building ID from Supabase (e.g., "flow-brickell")

### Examples

```bash
# Upload Flow Brickell images
node scripts/upload-images.js ./images/flow-brickell flow-brickell

# Upload Modera Riverside images  
node scripts/upload-images.js ./images/modera-riverside modera-riverside

# Upload from nested folder
node scripts/upload-images.js ./public/building-photos/brickell brickell
```

### Prerequisites

Environment variables must be set:
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### What It Does

1. Reads all image files from the folder
2. Uploads each image to Vercel Blob with public access
3. Collects all resulting blob URLs
4. Updates the Supabase `buildings` table with the `image_urls` array
5. Prints confirmation and all uploaded URLs

### Example Output

```
📁 Found 8 images in ./images/flow-brickell
🏢 Building ID: flow-brickell

⬆️  Uploading 1/8: bedroom1.jpg...
✅ Uploaded: https://hebbkx1anhila5yf.public.blob.vercel-storage.com/flow-1-12345-bedroom1-abc123.jpg

⬆️  Uploading 2/8: bedroom2.jpg...
✅ Uploaded: https://hebbkx1anhila5yf.public.blob.vercel-storage.com/flow-2-12345-bedroom2-def456.jpg

... (more uploads)

🔄 Updating Supabase for building: flow-brickell...
✅ Supabase updated! 8 image URLs stored

📋 Image URLs:
   1. https://hebbkx1anhila5yf.public.blob.vercel-storage.com/flow-1-12345-bedroom1-abc123.jpg
   2. https://hebbkx1anhila5yf.public.blob.vercel-storage.com/flow-2-12345-bedroom2-def456.jpg
   ... (all URLs)
```

### Error Handling

The script will exit with an error if:
- Environment variables are missing
- Folder doesn't exist
- No image files found in folder
- Upload to Blob fails
- Building ID not found in Supabase
- Supabase update fails

Each step prints clear error messages to help troubleshooting.

### Tips

- Images are uploaded in alphabetical order
- Filenames are preserved in the blob URL
- Each upload uses current timestamp to ensure uniqueness
- Images are public and accessible via HTTPS
- No local files are modified
