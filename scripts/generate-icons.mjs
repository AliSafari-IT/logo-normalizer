// Renders app/icon.svg into the raster icon files Next.js App Router
// picks up automatically. Run after changing the SVG:
//   node scripts/generate-icons.mjs
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const out = (name) => fileURLToPath(new URL(`../app/${name}`, import.meta.url))
const svg = await readFile(new URL('../app/icon.svg', import.meta.url))

// Favicon fallback for browsers without SVG icon support (e.g. older
// Safari). Named icon1.png so Next.js emits BOTH icon.svg and this file —
// same-basename icon.svg + icon.png would collapse to a single link.
await sharp(svg, { density: 384 })
  .resize(32, 32)
  .png()
  .toFile(out('icon1.png'))

// Apple touch icon: full-bleed square (iOS applies its own mask), so the
// rounded tile becomes a solid background instead of transparent corners.
const flatSvg = svg.toString().replace('rx="15"', 'rx="0"')
await sharp(Buffer.from(flatSvg), { density: 384 })
  .resize(180, 180)
  .png()
  .toFile(out('apple-icon.png'))

console.log('Generated app/icon1.png (32x32) and app/apple-icon.png (180x180)')
