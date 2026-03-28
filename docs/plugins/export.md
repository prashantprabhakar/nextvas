# ExportPlugin

Export the stage or a specific region to PNG, JPEG, WebP, or PDF — all via Skia's offscreen surface. No browser screenshot APIs, no DOM-to-canvas tricks.

## Install

```ts
import { ExportPlugin } from '@nexvas/plugin-export'

stage.use(ExportPlugin)
```

## Export to PNG / JPEG / WebP

```ts
import type { ExportPluginAPI } from '@nexvas/plugin-export'

const exporter = (stage as ExportPluginAPI).export

// Export the full stage
const blob = await exporter.toBlob({ format: 'png' })

// Export a specific region (world-space coordinates)
const blob = await exporter.toBlob({
  format: 'jpeg',
  quality: 0.9,
  region: { x: 0, y: 0, width: 800, height: 600 },
})

// Export at higher resolution
const blob = await exporter.toBlob({
  format: 'png',
  scale: 2,    // 2× resolution (e.g. for @2x exports)
})

// Trigger a browser download
exporter.download(blob, 'my-design.png')
```

## Export to PDF

```ts
const pdfBytes = await exporter.toPDF({
  width: 595,    // points — A4 width
  height: 842,   // points — A4 height
})

// pdfBytes is a Uint8Array
const blob = new Blob([pdfBytes], { type: 'application/pdf' })
exporter.download(blob, 'my-design.pdf')
```

## Export options

| Option | Type | Default | Description |
|---|---|---|---|
| `format` | `'png' \| 'jpeg' \| 'webp'` | `'png'` | Output format |
| `quality` | `number` | `0.92` | 0–1, for JPEG and WebP |
| `scale` | `number` | `1` | Output resolution multiplier |
| `region` | `{ x, y, width, height }` | full stage | World-space region to export |
| `background` | `ColorRGBA \| null` | `null` (transparent) | Background fill for PNG/WebP |

## DataURL

```ts
const dataUrl = await exporter.toDataURL({ format: 'png' })
img.src = dataUrl
```
