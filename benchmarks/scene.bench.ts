/**
 * Performance regression benchmarks for nexvas.
 *
 * These run with `pnpm benchmark` in CI (PR only) and locally via `pnpm benchmark:watch`.
 * All benchmarks are headless — no CanvasKit WASM, no browser.
 * They measure the CPU cost of the scene graph, transforms, hit testing,
 * and serialization at scale.
 */
import { bench, describe } from 'vitest'
import { Layer, Rect, Group, BoundingBox } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRects(count: number): Rect[] {
  return Array.from({ length: count }, (_, i) =>
    new Rect({
      x: (i % 100) * 12,
      y: Math.floor(i / 100) * 12,
      width: 10,
      height: 10,
    }),
  )
}

// ---------------------------------------------------------------------------
// Layer — add objects
// ---------------------------------------------------------------------------

describe('Layer.add', () => {
  bench('add 1,000 objects', () => {
    const layer = new Layer()
    const rects = makeRects(1000)
    for (const r of rects) layer.add(r)
  })

  bench('add 10,000 objects', () => {
    const layer = new Layer()
    const rects = makeRects(10_000)
    for (const r of rects) layer.add(r)
  })
})

// ---------------------------------------------------------------------------
// Hit testing
// ---------------------------------------------------------------------------

describe('Layer.hitTest', () => {
  const layer1k = new Layer()
  const layer10k = new Layer()
  for (const r of makeRects(1000)) layer1k.add(r)
  for (const r of makeRects(10_000)) layer10k.add(r)

  bench('hitTest miss — 1,000 objects', () => {
    layer1k.hitTest(9999, 9999)
  })

  bench('hitTest hit — 1,000 objects', () => {
    layer1k.hitTest(5, 5)
  })

  bench('hitTest miss — 10,000 objects', () => {
    layer10k.hitTest(9999, 9999)
  })

  bench('hitTest hit — 10,000 objects', () => {
    layer10k.hitTest(5, 5)
  })
})

// ---------------------------------------------------------------------------
// Transforms — world bounding box computation
// ---------------------------------------------------------------------------

describe('BaseObject.getWorldBoundingBox', () => {
  const rects = makeRects(1000)

  bench('getWorldBoundingBox × 1,000 (flat)', () => {
    for (const r of rects) r.getWorldBoundingBox()
  })

  bench('getWorldBoundingBox — nested group (3 levels deep)', () => {
    const root = new Group({ x: 10, y: 10, width: 200, height: 200 })
    const mid = new Group({ x: 10, y: 10, width: 100, height: 100 })
    const leaf = new Rect({ x: 5, y: 5, width: 50, height: 50 })
    mid.add(leaf)
    root.add(mid)
    for (let i = 0; i < 1000; i++) leaf.getWorldBoundingBox()
  })
})

// ---------------------------------------------------------------------------
// Serialization — toJSON / fromJSON
// ---------------------------------------------------------------------------

describe('Serialization', () => {
  const layer = new Layer()
  for (const r of makeRects(1000)) layer.add(r)

  bench('Layer.toJSON — 1,000 objects', () => {
    layer.toJSON()
  })
})

// ---------------------------------------------------------------------------
// BoundingBox math
// ---------------------------------------------------------------------------

describe('BoundingBox', () => {
  const boxes = Array.from(
    { length: 10_000 },
    (_, i) => new BoundingBox(i, i, 10, 10),
  )

  bench('BoundingBox.intersects × 10,000', () => {
    const probe = new BoundingBox(50, 50, 100, 100)
    for (const bb of boxes) bb.intersects(probe)
  })

  bench('BoundingBox.union × 10,000', () => {
    let acc = boxes[0]!
    for (let i = 1; i < boxes.length; i++) acc = acc.union(boxes[i]!)
  })
})
