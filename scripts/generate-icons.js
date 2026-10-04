import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

// Minimal standard PNG generator in pure Node.js (no external deps)
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcTarget = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(crcTarget), 8 + len);
  return chunk;
}

function generatePNG(width, height, isMaskable = false) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const ihdrChunk = createChunk('IHDR', ihdr);

  // Raw pixel data: 1 byte filter per scanline + 4 bytes per pixel
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  // Primary colors: Emerald (#059669 = [5, 150, 105]), Amber (#F59E0B = [245, 158, 11]), White (#FFFFFF)
  const cx = width / 2;
  const cy = height / 2;
  const maxR = width / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: Emerald green (#059669)
      let r = 5;
      let g = 150;
      let b = 105;
      let a = 255;

      if (!isMaskable) {
        // Rounded corner squircle
        const cornerR = width * 0.22;
        const inCornerX = Math.abs(x - cx) > (cx - cornerR);
        const inCornerY = Math.abs(y - cy) > (cy - cornerR);
        if (inCornerX && inCornerY) {
          const cornerDist = Math.hypot(
            Math.abs(x - cx) - (cx - cornerR),
            Math.abs(y - cy) - (cy - cornerR)
          );
          if (cornerDist > cornerR) {
            a = 0;
          }
        }
      }

      if (a > 0) {
        // Draw storefront awning & shopping basket symbol
        // Store roof / top bar
        const roofTop = height * 0.22;
        const roofBottom = height * 0.40;
        const bodyBottom = height * 0.76;
        const bodyLeft = width * 0.22;
        const bodyRight = width * 0.78;

        if (y >= roofTop && y <= roofBottom && x >= bodyLeft && x <= bodyRight) {
          // Alternating red and white stripes for warung awning
          const stripe = Math.floor((x - bodyLeft) / ((bodyRight - bodyLeft) / 6));
          if (stripe % 2 === 0) {
            r = 239; g = 68; b = 68; // Red
          } else {
            r = 255; g = 255; b = 255; // White
          }
        } else if (y > roofBottom && y <= bodyBottom && x >= bodyLeft + 10 && x <= bodyRight - 10) {
          // Warung shop body
          if (y < roofBottom + (height * 0.12)) {
            // Gold banner
            r = 245; g = 158; b = 11;
          } else {
            // Crisp white storefront interior
            r = 248; g = 250; b = 252;
            // Draw cash register / cart center icon
            const cartCx = cx;
            const cartCy = cy + (height * 0.1);
            if (Math.hypot(x - cartCx, y - cartCy) < width * 0.1) {
              r = 16; g = 185; b = 129; // Accent emerald center
            }
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, 180, false));

console.log('Successfully generated PWA icon PNGs.');
