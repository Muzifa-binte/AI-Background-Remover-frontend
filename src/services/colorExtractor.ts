/**
 * Color extraction utility.
 * Samples colors from an image element or URL to create ambient glow gradients
 * and harmonious palette presets for background replacement.
 */

export interface ExtractedPalette {
  dominant: string;
  secondary: string;
  accent: string;
  lightVariant: string;
  darkVariant: string;
  gradientCss: string;
}

const DEFAULT_PALETTE: ExtractedPalette = {
  dominant: '#f59e0b',
  secondary: '#f97316',
  accent: '#ec4899',
  lightVariant: '#fef3c7',
  darkVariant: '#451a03',
  gradientCss: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(249, 115, 22, 0.15) 100%)',
};

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Extracts dominant colors and creates harmonious gradient backdrops from an image.
 */
export async function extractImagePalette(imageUrl: string): Promise<ExtractedPalette> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        // Downscale to 64x64 for lightning-fast analysis
        const sampleSize = 64;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        const colorBuckets: { [key: string]: { r: number; g: number; b: number; count: number; sat: number } } = {};

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or near black/white pixels
          if (a < 128) continue;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          const sat = max === 0 ? 0 : delta / max;

          // Bucket by quantization (step 32)
          const qr = Math.floor(r / 32) * 32;
          const qg = Math.floor(g / 32) * 32;
          const qb = Math.floor(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;

          if (!colorBuckets[key]) {
            colorBuckets[key] = { r, g, b, count: 0, sat };
          }
          colorBuckets[key].count++;
        }

        const sorted = Object.values(colorBuckets)
          .sort((a, b) => (b.count * (1 + b.sat * 2)) - (a.count * (1 + a.sat * 2)));

        if (sorted.length === 0) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        const c1 = sorted[0];
        const c2 = sorted[Math.min(1, sorted.length - 1)];
        const c3 = sorted[Math.min(2, sorted.length - 1)];

        const dominant = rgbToHex(c1.r, c1.g, c1.b);
        const secondary = rgbToHex(c2.r, c2.g, c2.b);
        const accent = rgbToHex(c3.r, c3.g, c3.b);

        const gradientCss = `linear-gradient(135deg, rgba(${c1.r}, ${c1.g}, ${c1.b}, 0.28) 0%, rgba(${c2.r}, ${c2.g}, ${c2.b}, 0.16) 100%)`;

        resolve({
          dominant,
          secondary,
          accent,
          lightVariant: `rgba(${c1.r}, ${c1.g}, ${c1.b}, 0.15)`,
          darkVariant: `rgba(${c1.r}, ${c1.g}, ${c1.b}, 0.85)`,
          gradientCss,
        });
      } catch {
        resolve(DEFAULT_PALETTE);
      }
    };

    img.onerror = () => {
      resolve(DEFAULT_PALETTE);
    };

    img.src = imageUrl;
  });
}
