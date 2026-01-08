import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const COVERS_DIR = join(process.cwd(), 'public', 'blog', 'covers');
const BACKUP_DIR = join(process.cwd(), 'public', 'blog', 'covers', 'backup');

// Target images to optimize
const TARGET_IMAGES = [
  '6-week-challenge-blog.png',
  'ai_photo_tracking.png',
  'telehealth_glp1.png',
  'thriving_community.png'
];

async function optimizeImage(inputPath, outputPath) {
  try {
    const stats = await stat(inputPath);
    const originalSize = stats.size;

    console.log(`\nOptimizing: ${inputPath}`);
    console.log(`Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    console.log(`Original dimensions: ${metadata.width}x${metadata.height}`);

    // Use temporary file to avoid same file input/output issue
    const { join } = await import('path');
    const { tmpdir } = await import('os');
    const tempPath = join(tmpdir(), `optimize-${Date.now()}-${Math.random().toString(36).substring(7)}.png`);

    // Target dimensions: max 2400px width (2x for retina displays)
    // Blog covers are displayed at 1200x400px, so 2400px width is safe for retina
    const maxWidth = 2400;
    const maxHeight = 1600;

    let sharpInstance = sharp(inputPath);

    // Resize if image is larger than max dimensions
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
      console.log(`Resizing to max ${maxWidth}x${maxHeight} (maintaining aspect ratio)`);
    }

    // Optimize PNG: compress with aggressive settings for web
    // Using compressionLevel 9 (max) and quality 75 (good balance for web)
    await sharpInstance
      .png({
        compressionLevel: 9,
        quality: 75,
        adaptiveFiltering: true,
        palette: true,
        effort: 10 // Maximum compression effort
      })
      .toFile(tempPath);

    // Replace original with optimized version
    const { rename } = await import('fs/promises');
    await rename(tempPath, outputPath);

    const newStats = await stat(outputPath);
    const newSize = newStats.size;
    const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);

    const newMetadata = await sharp(outputPath).metadata();
    console.log(`New dimensions: ${newMetadata.width}x${newMetadata.height}`);
    console.log(`New size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Reduction: ${reduction}%`);

    return { originalSize, newSize, reduction };
  } catch (error) {
    console.error(`Error optimizing ${inputPath}:`, error);
    throw error;
  }
}

async function createBackup(imageName) {
  const sourcePath = join(COVERS_DIR, imageName);
  const backupPath = join(BACKUP_DIR, imageName);

  if (!existsSync(BACKUP_DIR)) {
    const { mkdir } = await import('fs/promises');
    await mkdir(BACKUP_DIR, { recursive: true });
  }

  if (!existsSync(backupPath)) {
    const { copyFile } = await import('fs/promises');
    await copyFile(sourcePath, backupPath);
    console.log(`Backup created: ${backupPath}`);
  }
}

async function main() {
  console.log('Starting image optimization...');
  console.log(`Covers directory: ${COVERS_DIR}`);

  const results = [];

  for (const imageName of TARGET_IMAGES) {
    const inputPath = join(COVERS_DIR, imageName);

    if (!existsSync(inputPath)) {
      console.warn(`Warning: ${inputPath} not found, skipping...`);
      continue;
    }

    // Create backup first
    await createBackup(imageName);

    // Optimize the image (overwrite original)
    const result = await optimizeImage(inputPath, inputPath);
    results.push({
      image: imageName,
      ...result
    });
  }

  console.log('\n=== Optimization Summary ===');
  let totalOriginal = 0;
  let totalNew = 0;

  results.forEach(({ image, originalSize, newSize, reduction }) => {
    totalOriginal += originalSize;
    totalNew += newSize;
    console.log(`${image}: ${reduction}% reduction`);
  });

  const totalReduction = ((1 - totalNew / totalOriginal) * 100).toFixed(1);
  console.log(`\nTotal original size: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total new size: ${(totalNew / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total reduction: ${totalReduction}%`);
  console.log(`\nBackups saved to: ${BACKUP_DIR}`);
}

main().catch(console.error);

