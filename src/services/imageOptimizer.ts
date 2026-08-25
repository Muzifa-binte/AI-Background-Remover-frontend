/**
 * Client-side image optimization & compression utility.
 * Compresses images before uploading to save bandwidth and improve processing speed.
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number; // 0.1 to 1.0
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
  enabled?: boolean;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
  previewUrl: string;
  width: number;
  height: number;
}

/**
 * Optimizes an image File using an offscreen HTML Canvas.
 * Automatically maintains transparency when converting to PNG or WebP.
 */
export async function optimizeImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxDimension = 2500,
    quality = 0.92,
    mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg',
    enabled = true,
  } = options;

  const originalSize = file.size;

  // If optimization is disabled or file is already SVG or very small (< 150KB), return original
  if (!enabled || file.type === 'image/svg+xml' || originalSize < 150 * 1024) {
    const previewUrl = URL.createObjectURL(file);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
      previewUrl,
      width: 0,
      height: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Scale down if width or height exceeds maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        // Fallback to original file if canvas context is unavailable
        resolve({
          file,
          originalSize,
          compressedSize: originalSize,
          savedPercent: 0,
          previewUrl: URL.createObjectURL(file),
          width,
          height,
        });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              file,
              originalSize,
              compressedSize: originalSize,
              savedPercent: 0,
              previewUrl: URL.createObjectURL(file),
              width,
              height,
            });
            return;
          }

          // If compression made it larger (can happen on small images), keep original
          if (blob.size >= originalSize && width === img.naturalWidth && height === img.naturalHeight) {
            resolve({
              file,
              originalSize,
              compressedSize: originalSize,
              savedPercent: 0,
              previewUrl: URL.createObjectURL(file),
              width,
              height,
            });
            return;
          }

          const extension = mimeType === 'image/webp' ? '.webp' : mimeType === 'image/png' ? '.png' : '.jpg';
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          const optimizedFile = new File([blob], `${nameWithoutExt}-optimized${extension}`, {
            type: mimeType,
            lastModified: Date.now(),
          });

          const compressedSize = blob.size;
          const savedPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));
          const previewUrl = URL.createObjectURL(blob);

          resolve({
            file: optimizedFile,
            originalSize,
            compressedSize,
            savedPercent,
            previewUrl,
            width,
            height,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for client-side optimization'));
    };

    img.src = objectUrl;
  });
}
