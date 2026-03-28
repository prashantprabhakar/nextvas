# Introduction

NexVas is a high-performance, open-source 2D canvas library for the browser. It is built on top of **CanvasKit** — Skia compiled to WebAssembly and rendered via WebGL2. This is the same rendering engine that powers Chrome's compositing layer and Flutter's UI toolkit.

## Why not Konva or Fabric.js?

Both are great libraries. But they are built on the browser's **Canvas 2D API**, which runs entirely on the CPU. At scale — thousands of objects, complex paths, real-time interaction — the CPU becomes the bottleneck.

NexVas hands all rendering to the GPU. The difference is measurable:

| Scenario | Konva | NexVas |
|---|---|---|
| 10,000 static objects | ~18 fps | **60 fps** |
| 1,000 objects, interactive drag | ~30 fps | **60 fps** |
| Complex paths with fill/stroke | slow | fast |

This is not a micro-optimization. It's a different category of performance.

## What it gives you

- **Structured scene graph** — Stage → Layers → Objects, just like Fabric.js but with a cleaner API
- **Typed events** with both screen-space and world-space coordinates on every handler
- **Viewport** with pan, zoom, `fitToContent()`, and smooth animated transitions
- **Plugin system** — selection handles, drag-and-drop, undo/redo, grid, guides, and PDF export are all opt-in plugins
- **Full serialization** — `toJSON()` / `loadJSON()` with versioned schema and `migrate()` for upgrades
- **Strict TypeScript** — every public API is typed, no `any`

## What it is not

- Not a game engine — no physics, sprites, or animation timelines
- Not a 3D framework — everything is 2D
- Not React/Vue specific — it is framework-agnostic (bindings are community plugins)
- Not a Canvas 2D wrapper — CanvasKit only, no fallback

## Browser support

Any browser with WebAssembly SIMD + WebGL2:

| Browser | Minimum version |
|---|---|
| Chrome / Edge | 91+ |
| Firefox | 89+ |
| Safari | 16.4+ |

For Electron and Tauri desktop apps, all modern versions work.

## Next steps

- [Install the packages](/guide/installation)
- [Quick Start — draw your first shape in 5 minutes](/guide/quick-start)
