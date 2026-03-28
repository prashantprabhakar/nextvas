# NexVas

**GPU-accelerated 2D canvas framework for the web.**
Built on [CanvasKit](https://skia.org/docs/user/modules/canvaskit/) (Skia → WebAssembly → WebGL2) — the same rendering engine powering Chrome and Flutter.

[![CI](https://github.com/your-org/nexvas/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/nexvas/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Why NexVas?

Konva and Fabric.js are built on the browser's Canvas 2D API — a CPU-bound, single-threaded path. NexVas hands all rendering to the GPU via Skia, the same engine that renders Chrome's UI.

| Scenario | Konva | NexVas |
|---|---|---|
| 10,000 static objects | ~20 fps | 60 fps |
| 1,000 objects, interactive drag | ~30 fps | 60 fps |
| Sub-pixel antialiasing | ✗ | ✓ |
| Linear gradient on rotated shape | ✗ | ✓ |
| PDF export via Skia | ✗ | ✓ |

---

## Features

- **Scene graph** — Stage → Layers → Objects, with full z-order control
- **7 built-in object types** — Rect, Circle, Line, Path, Text, Image, Group
- **Viewport** — pan, zoom, fit-to-content, animated transitions
- **Event system** — hit-tested pointer events with screen + world coordinates, tap/doubletap touch support
- **Plugin-first** — core stays lean; everything optional is a plugin
- **Serialization** — versioned JSON scene format with migration support
- **TypeScript** — strict types throughout, zero `any` in public APIs

---

## Packages

| Package | Description |
|---|---|
| `@nexvas/core` | Scene graph, objects, events, viewport, plugin registry |
| `@nexvas/renderer` | CanvasKit loader and WebGL surface management |
| `@nexvas/plugin-selection` | Click, multi-select, marquee, move/resize/rotate handles |
| `@nexvas/plugin-drag` | Draggable objects with optional constraints |
| `@nexvas/plugin-history` | Undo / redo stack (Ctrl+Z / Ctrl+Y) |
| `@nexvas/plugin-grid` | Background grid (lines or dots) with snap-to-grid |
| `@nexvas/plugin-guides` | Smart alignment guides during drag |
| `@nexvas/plugin-export` | Export to PNG, JPEG, WebP, PDF via Skia |

---

## Quick Start

```bash
pnpm add @nexvas/core @nexvas/renderer
```

```ts
import { loadCanvasKit } from '@nexvas/renderer'
import { Stage, Rect, Circle } from '@nexvas/core'

const ck = await loadCanvasKit()
const stage = new Stage({ canvas: document.getElementById('canvas'), canvasKit: ck })

const layer = stage.addLayer()

layer.add(new Rect({
  x: 50, y: 50, width: 300, height: 200,
  cornerRadius: 12,
  fill: { type: 'solid', color: { r: 0.22, g: 0.44, b: 0.9, a: 1 } },
}))

layer.add(new Circle({
  x: 200, y: 150, width: 120, height: 120,
  fill: { type: 'solid', color: { r: 0.9, g: 0.3, b: 0.2, a: 0.85 } },
}))

stage.startLoop()
```

### With plugins

```ts
import { loadCanvasKit } from '@nexvas/renderer'
import { Stage, Rect } from '@nexvas/core'
import { SelectionPlugin } from '@nexvas/plugin-selection'
import { HistoryPlugin } from '@nexvas/plugin-history'
import { GridPlugin } from '@nexvas/plugin-grid'

const ck = await loadCanvasKit()
const stage = new Stage({ canvas, canvasKit: ck })

stage
  .use(new GridPlugin(), { cellSize: 20 })
  .use(new SelectionPlugin())
  .use(new HistoryPlugin())

stage.startLoop()
```

---

## Examples

Clone the repo and run any example locally:

```bash
git clone https://github.com/prashantprabhakar/nexvas.git
cd nexvas
pnpm install
pnpm --filter @nexvas/core run build
```

| Example | Run | Description |
|---|---|---|
| Basic | `pnpm --filter @nexvas-examples/basic dev` | Minimal stage setup with a Rect and Circle |
| Free Drawing | `pnpm --filter @nexvas-examples/free-drawing dev` | Freehand drawing with color picker and undo |

Each example has its own `README.md` with details.

---

## Browser Support

WebAssembly SIMD + WebGL2 required.

| Browser | Minimum version |
|---|---|
| Chrome | 91+ |
| Firefox | 89+ |
| Safari | 16.4+ |
| Edge | 91+ |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, coding standards, and the PR process.

```bash
git clone https://github.com/prashantprabhakar/nexvas.git
cd nexvas
pnpm install
pnpm --filter @nexvas/core run build
pnpm run test
```

---

## License

[MIT](LICENSE)
