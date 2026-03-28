# Free Drawing

Freehand drawing demo built with NexVas. Demonstrates `Path` objects built
incrementally from SVG path strings, the `Color` helper, and pointer event handling.

## Run

```bash
# From the repo root
pnpm --filter @nexvas-examples/free-drawing dev
```

Then open **http://localhost:5173**.

## What it demonstrates

- Building a `Path` incrementally on each `mousemove` by appending to an SVG `d` string
- `Color.hex()` helper for readable color values
- Stage-level pointer events (`mousedown`, `mousemove`, `mouseup`)
- Manual undo stack — no HistoryPlugin, just an array of paths
- Loading spinner while CanvasKit WASM initializes
