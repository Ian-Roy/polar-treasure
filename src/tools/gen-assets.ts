--- path: tools/gen-assets.ts
/**
 * Procedurally generate:
 *  - icons: assets/icons/icon-192.png, icon-512.png (maskable-friendly simple glyph)
 *  - manifest.json for game assets
 *  - a tiny player sprite (player_dot.png)
 *  - a simple click SFX (click.wav) using PCM WAV writer
 *
 * This keeps the project entirely offline with no external downloads.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PNG } from 'pngjs';

const ASSETS = 'assets';
const ICONS_DIR = join(ASSETS, 'icons');
const IMG_DIR = join(ASSETS, 'img');
const SFX_DIR = join(ASSETS, 'sfx');

function ensure(dir: string) {
  mkdirSync(dir, { recursive: true });
}

// Draw a filled circle onto a PNG buffer
function circlePng(size: number, bg = 0x0b1020ff, fg = 0x2bd4ffff) {
  const png = new PNG({ width: size, height: size });
  // Fill bg
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      set(png, x, y, bg);
    }
  }
  // Draw circle
  const r = size * 0.36;
  const cx = size / 2;
  const cy = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) set(png, x, y, fg);
    }
  }
  return PNG.sync.write(png);
}

function set(png: PNG, x: number, y: number, rgba: number) {
  const idx = (png.width * y + x) << 2;
  png.data[idx + 0] = (rgba >> 24) & 0xff;
  png.data[idx + 1] = (rgba >> 16) & 0xff;
  png.data[idx + 2] = (rgba >> 8) & 0xff;
  png.data[idx + 3] = rgba & 0xff;
}

// Simple dot sprite (16x16)
function playerDotPng() {
  const size = 16;
  const png = new PNG({ width: size, height: size });
  // transparent
  for (let i = 0; i < png.data.length; i += 4) png.data[i + 3] = 0;
  // dot
  const fg = [0x2b, 0xd4, 0xff, 0xff];
  const cx = 8, cy = 8, r = 5;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (Math.hypot(x - cx, y - cy) <= r) {
      const idx = (size * y + x) << 2;
      png.data[idx] = fg[0]; png.data[idx+1] = fg[1]; png.data[idx+2] = fg[2]; png.data[idx+3] = fg[3];
    }
  }
  return PNG.sync.write(png);
}

// Minimal PCM WAV (8-bit unsigned mono) click
function makeClickWav(): Buffer {
  const sampleRate = 22050;
  const durationSec = 0.08;
  const N = Math.floor(sampleRate * durationSec);
  const data = Buffer.alloc(N);
  // Simple decaying noise burst
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const amp = (1 - t) * 0.8;
    const v = (Math.random() * 2 - 1) * amp;
    data[i] = Math.max(0, Math.min(255, Math.round(128 + 127 * v)));
  }
  return encodeWavU8Mono(data, sampleRate);
}

function encodeWavU8Mono(raw: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * 1 * 1;
  const blockAlign = 1;
  const subchunk2Size = raw.length * 1;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + subchunk2Size, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);         // PCM
  header.writeUInt16LE(1, 20);          // audio format = PCM
  header.writeUInt16LE(1, 22);          // channels = 1
  header.writeUInt32LE(sampleRate, 24); // sample rate
  header.writeUInt32LE(byteRate, 28);   // byte rate
  header.writeUInt16LE(blockAlign, 32); // block align
  header.writeUInt16LE(8, 34);          // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(subchunk2Size, 40);

  return Buffer.concat([header, raw]);
}

function write(file: string, buf: Buffer) {
  writeFileSync(file, buf);
  console.log('generated', file);
}

function writeJSON(file: string, obj: any) {
  writeFileSync(file, JSON.stringify(obj, null, 2));
  console.log('generated', file);
}

function main() {
  ensure(ASSETS);
  ensure(ICONS_DIR);
  ensure(IMG_DIR);
  ensure(SFX_DIR);

  write(join(ICONS_DIR, 'icon-192.png'), circlePng(192));
  write(join(ICONS_DIR, 'icon-512.png'), circlePng(512));

  write(join(IMG_DIR, 'player_dot.png'), playerDotPng());

  write(join(SFX_DIR, 'click.wav'), makeClickWav());

  // Asset manifest used by PreloadScene
  writeJSON(join(ASSETS, 'manifest.json'), {
    images: [
      { key: 'player_dot', url: 'assets/img/player_dot.png' }
    ],
    audio: [
      { key: 'click', urls: ['assets/sfx/click.wav'] }
    ]
  });
}

main();
