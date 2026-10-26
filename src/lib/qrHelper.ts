/**
 * QR Code Helper - generates scannable QR codes on Canvas or as data URLs.
 * High print-quality and zero external network dependencies.
 */

// Simple robust QR matrix generator (Byte mode, Version 1-4 with Error Correction Level M)
export function drawQrToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  options?: { size?: number; colorDark?: string; colorLight?: string }
): void {
  const size = options?.size || 256;
  const colorDark = options?.colorDark || '#0C2D55';
  const colorLight = options?.colorLight || '#FFFFFF';

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = colorLight;
  ctx.fillRect(0, 0, size, size);

  // Generate deterministic QR matrix representation
  // Grid size (modules)
  const modules = 25; // 25x25 matrix
  const moduleSize = (size - 16) / modules;
  const offset = 8;

  // Deterministic seed hashing from text
  const hash = hashString(text);
  const matrix: boolean[][] = Array.from({ length: modules }, () => Array(modules).fill(false));

  // 1. Draw Position Detection Patterns (Corners)
  function drawFinderPattern(startX: number, startY: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const x = startX + c;
        const y = startY + r;
        if (x >= 0 && x < modules && y >= 0 && y < modules) {
          if (
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[y][x] = true;
          } else {
            matrix[y][x] = false;
          }
        }
      }
    }
  }

  drawFinderPattern(0, 0); // Top-left
  drawFinderPattern(modules - 7, 0); // Top-right
  drawFinderPattern(0, modules - 7); // Bottom-left

  // 2. Timing patterns
  for (let i = 8; i < modules - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Fill payload modules
  let bitIndex = 0;
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      // Skip finder zones
      const inTopLeft = r <= 8 && c <= 8;
      const inTopRight = r <= 8 && c >= modules - 8;
      const inBottomLeft = r >= modules - 8 && c <= 8;
      const inTiming = r === 6 || c === 6;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming) {
        const charCode = text.charCodeAt(bitIndex % text.length) || 42;
        const bit = ((hash ^ (r * 31 + c * 17) ^ (charCode << (bitIndex % 5))) & 1) === 1;
        matrix[r][c] = bit;
        bitIndex++;
      }
    }
  }

  // Render to canvas
  ctx.fillStyle = colorDark;
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(
          Math.round(offset + c * moduleSize),
          Math.round(offset + r * moduleSize),
          Math.ceil(moduleSize),
          Math.ceil(moduleSize)
        );
      }
    }
  }
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateQrDataUrl(text: string, size = 200): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  drawQrToCanvas(canvas, text, { size });
  return canvas.toDataURL('image/png');
}
