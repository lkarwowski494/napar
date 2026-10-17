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

function createPngBuffer(width, height, pixelShader) {
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      const [r, g, b] = pixelShader(x, y, width, height);
      raw[pxOffset] = Math.min(255, Math.max(0, Math.floor(r)));
      raw[pxOffset + 1] = Math.min(255, Math.max(0, Math.floor(g)));
      raw[pxOffset + 2] = Math.min(255, Math.max(0, Math.floor(b)));
    }
  }

  // 1. Signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // 2. IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 2; // ColorType 2 = RGB (No Alpha)
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // 3. IDAT
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // 4. IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Shader for icon & adaptive-icon (1024x1024)
function iconShader(x, y, width, height) {
  let r = 18;
  let g = 18;
  let b = 20;

  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 450) {
    const glow = Math.max(0, 1 - dist / 450) * 8;
    r += glow;
    g += glow;
    b += glow;
  }

  // Conical dripper geometry scaled to 1024
  const scale = width / 1024;
  const relY = y / scale;
  const relDx = dx / scale;

  if (relY >= 280 && relY <= 310 && Math.abs(relDx) <= 220) {
    // Top rim of dripper - copper #C86A28
    r = 200;
    g = 106;
    b = 40;
  } else if (relY > 310 && relY <= 620) {
    const halfW = 210 - ((relY - 310) / 310) * 160;
    if (Math.abs(relDx) <= halfW) {
      const angle = Math.atan2(relY - 512, relDx);
      const rib = Math.sin(angle * 6 + (relY / 25)) > 0.6;
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
  } else if (relY > 620 && relY <= 660 && Math.abs(relDx) <= 140) {
    // Base plate
    r = 200;
    g = 106;
    b = 40;
  } else if (relY > 690 && relY <= 770) {
    // Golden droplet
    const dropDy = relY - 730;
    const dropR = Math.sqrt(relDx * relDx + dropDy * dropDy);
    if (dropR <= 28 || (relY < 730 && Math.abs(relDx) <= (730 - relY) * 0.4 && relY >= 700)) {
      r = 229;
      g = 169;
      b = 106; // Gold #E5A96A
    }
  }

  return [r, g, b];
}

// Shader for splash screen (1284x2778)
function splashShader(x, y, width, height) {
  let r = 18;
  let g = 18;
  let b = 20;

  const cx = width / 2;
  const cy = height / 2; // centered
  const dx = x - cx;
  const dy = y - cy;

  // Scale emblem to fit nicely in splash (size ~ 320px)
  const scale = 320 / 1024;
  const relY = dy / scale + 512;
  const relDx = dx / scale;

  if (relY >= 240 && relY <= 800 && Math.abs(relDx) <= 300) {
    return iconShader(relDx + 512, relY, 1024, 1024);
  }

  return [r, g, b];
}

// 1. Generate icon.png (1024x1024)
const iconPng = createPngBuffer(1024, 1024, iconShader);
fs.writeFileSync('assets/icon.png', iconPng);
console.log(`assets/icon.png: ${iconPng.length} bytes (1024x1024 PNG)`);

// 2. Generate adaptive-icon.png (1024x1024)
const adaptiveIconPng = createPngBuffer(1024, 1024, iconShader);
fs.writeFileSync('assets/adaptive-icon.png', adaptiveIconPng);
console.log(`assets/adaptive-icon.png: ${adaptiveIconPng.length} bytes (1024x1024 PNG)`);

// 3. Generate favicon.png (192x192)
const faviconPng = createPngBuffer(192, 192, iconShader);
fs.writeFileSync('assets/favicon.png', faviconPng);
console.log(`assets/favicon.png: ${faviconPng.length} bytes (192x192 PNG)`);

// 4. Generate splash.png (1284x2778)
const splashPng = createPngBuffer(1284, 2778, splashShader);
fs.writeFileSync('assets/splash.png', splashPng);
console.log(`assets/splash.png: ${splashPng.length} bytes (1284x2778 PNG)`);
