import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

export interface CompressionResult {
  success: boolean;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  outputPath?: string;
  error?: string;
}

/**
 * Compress image files using Sharp
 */
export async function compressImage(
  inputPath: string, 
  outputPath: string, 
  options: {
    quality?: number;
    width?: number;
    height?: number;
    maxSizeMB?: number;
  } = {}
): Promise<CompressionResult> {
  try {
    const { quality = 80, width = 1920, height = 1080, maxSizeMB = 5 } = options;
    
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // If file is already small, skip compression
    if (originalSize <= maxSizeBytes) {
      return {
        success: true,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        outputPath: inputPath
      };
    }

    let pipeline = sharp(inputPath)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality, progressive: true });

    // Get compressed buffer
    const compressedBuffer = await pipeline.toBuffer();
    const compressedSize = compressedBuffer.length;

    // If still too large, reduce quality further
    let finalBuffer = compressedBuffer;
    let finalQuality = quality;

    if (compressedSize > maxSizeBytes) {
      // Try with lower quality
      for (let q = quality - 20; q >= 30; q -= 10) {
        finalBuffer = await sharp(inputPath)
          .resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: q, progressive: true })
          .toBuffer();
        
        if (finalBuffer.length <= maxSizeBytes) {
          finalQuality = q;
          break;
        }
      }
    }

    // Write compressed file
    fs.writeFileSync(outputPath, finalBuffer);
    
    const finalSize = finalBuffer.length;
    const compressionRatio = originalSize > 0 ? finalSize / originalSize : 1;

    return {
      success: true,
      originalSize,
      compressedSize: finalSize,
      compressionRatio,
      outputPath
    };

  } catch (error) {
    return {
      success: false,
      originalSize: fs.existsSync(inputPath) ? fs.statSync(inputPath).size : 0,
      error: error instanceof Error ? error.message : 'Unknown compression error'
    };
  }
}

/**
 * Compress multiple files into a ZIP archive
 */
export async function compressToZip(
  files: { path: string; name: string }[],
  outputPath: string
): Promise<CompressionResult> {
  try {
    const output = fs.createWriteStream(outputPath);
    const archive = new (archiver as any)('zip', { zlib: { level: 9 } });

    return new Promise((resolve) => {
      archive.on('error', (err: any) => {
        resolve({
          success: false,
          originalSize: files.reduce((sum, f) => sum + (fs.existsSync(f.path) ? fs.statSync(f.path).size : 0), 0),
          error: err.message
        });
      });

      archive.on('end', () => {
        const compressedSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
        const originalSize = files.reduce((sum, f) => sum + (fs.existsSync(f.path) ? fs.statSync(f.path).size : 0), 0);
        
        resolve({
          success: true,
          originalSize,
          compressedSize,
          compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1,
          outputPath
        });
      });

      archive.pipe(output);

      // Add files to archive
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          archive.file(file.path, { name: file.name });
        }
      });

      archive.finalize();
    });

  } catch (error) {
    return {
      success: false,
      originalSize: files.reduce((sum, f) => sum + (fs.existsSync(f.path) ? fs.statSync(f.path).size : 0), 0),
      error: error instanceof Error ? error.message : 'Unknown ZIP compression error'
    };
  }
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file type supports compression
 */
export function isCompressionSupported(mimetype: string): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];
  
  return supportedTypes.includes(mimetype);
}

/**
 * Check if file should be compressed based on size and type
 */
export function shouldCompressFile(mimetype: string, size: number): boolean {
  // Compress images larger than 1MB
  if (isCompressionSupported(mimetype) && size > 1024 * 1024) {
    return true;
  }
  
  // Compress non-image files larger than 5MB into ZIP
  if (!isCompressionSupported(mimetype) && size > 5 * 1024 * 1024) {
    return true;
  }
  
  return false;
}