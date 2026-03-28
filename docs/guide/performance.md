# Performance

NexVas is built for performance from the ground up. This page explains what's built in and how to get the most out of it.

## Performance targets

| Scenario | Target |
|---|---|
| Static scene, 10,000 objects | 60 fps |
| Interactive drag, 1,000 objects | 60 fps |
| 50,000 object scene, read-only | 30 fps minimum |
| `stage.toJSON()` on 10,000 objects | < 50ms |

These are not aspirational — they are tested in the benchmark suite on every PR.

## What's built in

### Dirty flag rendering

The render loop only fires when something has changed. If no objects are mutated and no events occur, zero frames are rendered. CPU and GPU idle completely.

```ts
stage.startLoop()    // skips frames automatically when clean
stage.markDirty()    // force a redraw (rarely needed manually)
```

### Viewport culling

Objects entirely outside the current viewport are skipped — no paint cost, no Skia calls. This scales linearly: a 100,000-object scene where only 200 are visible renders at the cost of 200 objects.

### CanvasKit / Skia

All rendering is GPU-accelerated via WebGL2. Skia batches draw calls internally. Complex paths, gradients, and blending happen on the GPU, not the CPU.

## Tips for large scenes

**Use layers to your advantage.** Static background content on one layer, interactive content on another. In a future version, static layers will support texture caching.

**Avoid per-frame object creation.** Mutate existing objects rather than removing and re-adding them. Object creation always marks the stage dirty and allocates.

**Batch mutations.** If you're updating 1,000 objects at once, update them all before yielding to the event loop. The dirty flag batches all changes into one render:

```ts
// Good: one render for all updates
objects.forEach(obj => { obj.x += 10 })
// Stage renders once on the next RAF tick

// Avoid: triggering layouts inside a loop that causes style recalcs
```

**Keep Group nesting shallow.** Each level of nesting adds a matrix multiply per object in the hit-test path. Prefer 2–3 levels maximum.

**Use `visible = false` over removing objects.** Toggling visibility avoids layer mutation overhead. Invisible objects are skipped in both rendering and hit testing.

## Benchmarks

Run the benchmark suite locally:

```sh
pnpm benchmark
```

This measures layer operations, hit testing, serialization, and BoundingBox math. Results are compared against a baseline in CI.
