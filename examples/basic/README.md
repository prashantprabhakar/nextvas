# Basic Example

Minimal NexVas setup — a `Rect` and a `Circle` on a stage. The starting point
for any new NexVas project.

## Run

```bash
# From the repo root
pnpm --filter @nexvas-examples/basic dev
```

Then open **http://localhost:5173**.

## What it demonstrates

- Loading CanvasKit with `loadCanvasKit()`
- Creating a `Stage` and adding a `Layer`
- Adding `Rect` and `Circle` objects with solid fills
- Starting the render loop with `stage.startLoop()`
