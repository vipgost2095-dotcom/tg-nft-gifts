// Minimal from-scratch animated GIF89a encoder.
// No external deps — encodes RGBA canvas frames into a looping GIF.
// Uses a fixed 6x7x6 color cube (252 colors) instead of a full quantizer:
// simpler & fully deterministic, and plenty for flat/gradient vector art.

const R_LEVELS = 6, G_LEVELS = 7, B_LEVELS = 6;
const PALETTE_SIZE = R_LEVELS * G_LEVELS * B_LEVELS; // 252

function buildPalette(): Uint8Array {
  const pal = new Uint8Array(PALETTE_SIZE * 3);
  let i = 0;
  for (let r = 0; r < R_LEVELS; r++) {
    for (let g = 0; g < G_LEVELS; g++) {
      for (let b = 0; b < B_LEVELS; b++) {
        pal[i++] = Math.round((r * 255) / (R_LEVELS - 1));
        pal[i++] = Math.round((g * 255) / (G_LEVELS - 1));
        pal[i++] = Math.round((b * 255) / (B_LEVELS - 1));
      }
    }
  }
  return pal;
}

function colorIndex(r: number, g: number, b: number): number {
  const ri = Math.round((r / 255) * (R_LEVELS - 1));
  const gi = Math.round((g / 255) * (G_LEVELS - 1));
  const bi = Math.round((b / 255) * (B_LEVELS - 1));
  return ri * G_LEVELS * B_LEVELS + gi * B_LEVELS + bi;
}

class BitWriter {
  bytes: number[] = [];
  private cur = 0;
  private bits = 0;

  writeCode(code: number, codeSize: number) {
    this.cur |= code << this.bits;
    this.bits += codeSize;
    while (this.bits >= 8) {
      this.bytes.push(this.cur & 0xff);
      this.cur >>= 8;
      this.bits -= 8;
    }
  }
  flush() {
    if (this.bits > 0) {
      this.bytes.push(this.cur & 0xff);
      this.cur = 0;
      this.bits = 0;
    }
  }
}

// Standard GIF LZW encoder over palette indices.
function lzwEncode(indices: Uint8Array, minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let nextCode = eoiCode + 1;
  let codeSize = minCodeSize + 1;

  const writer = new BitWriter();
  writer.writeCode(clearCode, codeSize);

  let table = new Map<string, number>();
  const resetTable = () => {
    table = new Map();
    for (let i = 0; i < clearCode; i++) table.set(String(i), i);
    nextCode = eoiCode + 1;
    codeSize = minCodeSize + 1;
  };
  resetTable();

  let w = String(indices[0]);
  for (let i = 1; i < indices.length; i++) {
    const k = String(indices[i]);
    const wk = w + ',' + k;
    if (table.has(wk)) {
      w = wk;
    } else {
      writer.writeCode(table.get(w)!, codeSize);
      if (nextCode < 4096) {
        table.set(wk, nextCode);
        nextCode++;
        if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
      } else {
        writer.writeCode(clearCode, codeSize);
        resetTable();
      }
      w = k;
    }
  }
  writer.writeCode(table.get(w)!, codeSize);
  writer.writeCode(eoiCode, codeSize);
  writer.flush();
  return writer.bytes;
}

function packSubBlocks(data: number[]): number[] {
  const out: number[] = [];
  let i = 0;
  while (i < data.length) {
    const chunk = data.slice(i, i + 255);
    out.push(chunk.length, ...chunk);
    i += 255;
  }
  out.push(0);
  return out;
}

export interface GifFrame {
  imageData: ImageData;
  delayCs: number; // delay in centiseconds (1/100s)
}

export function encodeGif(width: number, height: number, frames: GifFrame[]): Uint8Array {
  const palette = buildPalette();
  const out: number[] = [];

  // Header
  out.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61); // "GIF89a"
  // Logical screen descriptor
  out.push(width & 0xff, (width >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff);
  const gctSizeBits = Math.ceil(Math.log2(PALETTE_SIZE));
  out.push(0x80 | 0x70 | (gctSizeBits - 1)); // GCT present, color res, sorted=0, size
  out.push(0, 0); // bg color index, pixel aspect ratio

  // Global color table (pad to power of two)
  const gctEntries = 1 << gctSizeBits;
  for (let i = 0; i < gctEntries; i++) {
    if (i < PALETTE_SIZE) {
      out.push(palette[i * 3], palette[i * 3 + 1], palette[i * 3 + 2]);
    } else {
      out.push(0, 0, 0);
    }
  }

  // Netscape extension for looping forever
  out.push(0x21, 0xff, 0x0b);
  out.push(...'NETSCAPE2.0'.split('').map((c) => c.charCodeAt(0)));
  out.push(0x03, 0x01, 0x00, 0x00, 0x00);

  const minCodeSize = Math.max(2, gctSizeBits);

  for (const frame of frames) {
    const { data } = frame.imageData;
    const indices = new Uint8Array(width * height);
    for (let p = 0; p < width * height; p++) {
      indices[p] = colorIndex(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]);
    }

    // Graphic control extension
    out.push(0x21, 0xf9, 0x04);
    out.push(0x04); // no transparency, dispose = do not dispose
    out.push(frame.delayCs & 0xff, (frame.delayCs >> 8) & 0xff);
    out.push(0, 0); // transparent color index, terminator

    // Image descriptor
    out.push(0x2c);
    out.push(0, 0, 0, 0); // left, top
    out.push(width & 0xff, (width >> 8) & 0xff, height & 0xff, (height >> 8) & 0xff);
    out.push(0x00); // no local color table

    out.push(minCodeSize);
    const lzwBytes = lzwEncode(indices, minCodeSize);
    out.push(...packSubBlocks(lzwBytes));
  }

  out.push(0x3b); // trailer
  return new Uint8Array(out);
}

export function gifToDataUrl(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:image/gif;base64,${btoa(binary)}`;
}
