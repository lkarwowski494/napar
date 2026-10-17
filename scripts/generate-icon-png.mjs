import fs from 'node:fs';
import zlib from 'node:zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);

  return Buffer.concat([len, typeAndData, crc]);
}

const width = 1024;
const height = 1024;

// Raw scanlines: each row has 1 filter byte (0) + width * 3 bytes (RGB)
const rowSize = 1 + width * 3;
const raw = Buffer.alloc(height * rowSize);

for (let y = 0; y < height; y++) {
  const rowOffset = y * rowSize;
  raw[rowOffset] = 0; // Filter None

  for (let x = 0; x < width; x++) {
    const pxOffset = rowOffset + 1 + x * 3;
    
    // Default background #121214
    let r = 18;
    let g = 18;
    let b = 20;

    // Distance from center
    const dx = x - 512;
    const dy = y - 512;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Subtle center glow
    if (dist < 450) {
      const glow = Math.max(0, 1 - dist / 450) * 8;
      r += glow;
      g += glow;
      b += glow;
    }

    // Conical dripper geometry
    // Top rim: y between 280 and 320, width 400
    // Body: y between 320 and 640, narrowing from width 360 to width 100
    // Base: y between 640 and 680, width 220
    if (y >= 280 && y <= 310 && Math.abs(dx) <= 220) {
      // Top rim of dripper - copper #C86A28
      r = 200;
      g = 106;
      b = 40;
    } else if (y > 310 && y <= 620) {
      const halfW = 210 - ((y - 310) / 310) * 160;
      if (Math.abs(dx) <= halfW) {
        // Inner spiral ribbing effect
        const angle = Math.atan2(dy, dx);
        const rib = Math.sin(angle * 6 + (y / 25)) > 0.6;
        if (rib) {
          r = 229;
          g = 169;
          b = 106; // Crema gold #E5A96A
        } else {
          r = 200;
          g = 106;
          b = 40; // Copper #C86A28
        }
      }
    } else if (y > 620 && y <= 660 && Math.abs(dx) <= 140) {
      // Base plate
      r = 200;
      g = 106;
      b = 40;
    } else if (y > 690 && y <= 770) {
      // Golden droplet
      const dropDy = y - 730;
      const dropR = Math.sqrt(dx * dx + dropDy * dropDy);
      if (dropR <= 28 || (y < 730 && Math.abs(dx) <= (730 - y) * 0.4 && y >= 700)) {
        r = 229;
        g = 169;
        b = 106; // Gold #E5A96A
      }
    }

    raw[pxOffset] = Math.min(255, Math.floor(r));
    raw[pxOffset + 1] = Math.min(255, Math.floor(g));
    raw[pxOffset + 2] = Math.min(255, Math.floor(b));
  }
}

// 1. Signature
const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

// 2. IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; // 8-bit depth
ihdr[9] = 2; // ColorType 2 = RGB (No Alpha!)
ihdr[10] = 0; // Compression
ihdr[11] = 0; // Filter
ihdr[12] = 0; // Interlace
const ihdrChunk = makeChunk('IHDR', ihdr);

// 3. IDAT
const compressed = zlib.deflateSync(raw, { level: 9 });
const idatChunk = makeChunk('IDAT', compressed);

// 4. IEND
const iendChunk = makeChunk('IEND', Buffer.alloc(0));

const png = Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
fs.writeFileSync('assets/icon.png', png);
console.log(`Generated assets/icon.png: ${png.length} bytes (1024x1024 RGB colorType 2)`);
