// Génère les icônes PNG de Bro sûr (fond crème, anneau teal).
// Usage : node scripts/gen-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const CREAM = [250, 246, 241]
const TEAL = [138, 59, 77]
const TEAL_DARK = [106, 44, 60]

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// --- CRC32 -----------------------------------------------------------------
const table = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  table[n] = c >>> 0
}
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

// --- PNG -------------------------------------------------------------------
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function png(size, paint) {
  // paint(x, y) -> [r, g, b, a?] ou null (transparent)
  const bpp = 4
  const raw = Buffer.alloc(size * (size * bpp + 1))
  for (let y = 0; y < size; y++) {
    const row = y * (size * bpp + 1)
    raw[row] = 0 // filtre None
    for (let x = 0; x < size; x++) {
      const px = paint(x, y)
      const o = row + 1 + x * bpp
      if (px) { raw[o] = px[0]; raw[o + 1] = px[1]; raw[o + 2] = px[2]; raw[o + 3] = px[3] ?? 255 }
      else raw[o + 3] = 0
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- Dessin -----------------------------------------------------------------
const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r
const inRing = (x, y, cx, cy, rOut, rIn) =>
  inCircle(x, y, cx, cy, rOut) && !inCircle(x, y, cx, cy, rIn)
const rounded = (x, y, s, rad) => {
  const dx = Math.max(rad - x, 0, x - (s - rad))
  const dy = Math.max(rad - y, 0, y - (s - rad))
  return dx * dx + dy * dy <= rad * rad || (x >= rad && x < s - rad) || (y >= rad && y < s - rad)
}

function makeIcon(size, { maskable = false } = {}) {
  const c = size / 2
  // Anneau : rayon externe ~40 % (42 % hors maskable), interne ~26 %.
  const rOut = size * (maskable ? 0.36 : 0.4)
  const rIn = size * (maskable ? 0.22 : 0.26)
  const bg = maskable ? TEAL_DARK : CREAM
  const fg = maskable ? CREAM : TEAL
  const corner = maskable ? 0 : size * 0.18
  return png(size, (x, y) => {
    if (corner && !rounded(x + 0.5, y + 0.5, size, corner)) return null
    if (inRing(x, y, c, c, rOut, rIn)) return fg
    return bg
  })
}

for (const [name, size, opts] of [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { maskable: true }],
]) {
  writeFileSync(join(outDir, name), makeIcon(size, opts))
  console.log('écrit', join(outDir, name))
}
