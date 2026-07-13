#!/usr/bin/env node

/**
 * Batch upload images to Vercel Blob and update Supabase
 * Usage: node scripts/upload-images.js <folderPath> <buildingId>
 * Example: node scripts/upload-images.js ./images/flow-brickell flow-brickell
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { put } = require('@vercel/blob');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BLOB_TOKEN) {
  console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or BLOB_READ_WRITE_TOKEN');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function uploadImagesToBlob(folderPath, buildingId) {
  if (!fs.existsSync(folderPath)) {
    console.error(`❌ Folder not found: ${folderPath}`);
    process.exit(1);
  }

  const files = fs.readdirSync(folderPath)
    .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
    .sort();

  if (files.length === 0) {
    console.error(`❌ No image files found in ${folderPath}`);
    process.exit(1);
  }

  console.log(`📁 Found ${files.length} images in ${folderPath}`);
  console.log(`🏢 Building ID: ${buildingId}`);
  console.log('');

  const uploadedUrls = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(folderPath, file);
    const fileBuffer = fs.readFileSync(filePath);
    const filename = `${buildingId}-${i + 1}-${Date.now()}-${file}`;

    try {
      console.log(`⬆️  Uploading ${i + 1}/${files.length}: ${file}...`);
      const blob = await put(filename, fileBuffer, {
        access: 'public',
        contentType: `image/${path.extname(file).slice(1)}`,
      });

      uploadedUrls.push(blob.url);
      console.log(`✅ Uploaded: ${blob.url}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error.message);
      process.exit(1);
    }
  }

  console.log('');
  console.log(`🔄 Updating Supabase for building: ${buildingId}...`);

  try {
    const { data, error } = await supabase
      .from('buildings')
      .update({ image_urls: uploadedUrls })
      .eq('id', buildingId)
      .select();

    if (error) {
      console.error('❌ Supabase update failed:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.error(`❌ Building not found: ${buildingId}`);
      process.exit(1);
    }

    console.log(`✅ Supabase updated! ${uploadedUrls.length} image URLs stored`);
    console.log('');
    console.log('📋 Image URLs:');
    uploadedUrls.forEach((url, idx) => {
      console.log(`   ${idx + 1}. ${url}`);
    });
  } catch (error) {
    console.error('❌ Error updating Supabase:', error.message);
    process.exit(1);
  }
}

const folderPath = process.argv[2];
const buildingId = process.argv[3];

if (!folderPath || !buildingId) {
  console.error('Usage: node scripts/upload-images.js <folderPath> <buildingId>');
  console.error('Example: node scripts/upload-images.js ./images/flow-brickell flow-brickell');
  process.exit(1);
}

uploadImagesToBlob(folderPath, buildingId);
