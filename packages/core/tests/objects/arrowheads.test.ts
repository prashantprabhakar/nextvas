import { describe, it, expect, vi } from 'vitest'
import { Line } from '../../src/objects/Line.js'
import { Path } from '../../src/objects/Path.js'
import { drawArrowHead } from '../../src/renderer/paint.js'
import { strokeCacheKey } from '../../src/renderer/paint.js'
import { createMockCK, createMockCanvas } from '../__mocks__/canvaskit.js'
import type { RenderContext } from '../../src/types.js'
import type { FontManager } from '../../src/FontManager.js'

function makeCtx() {
  const ck = createMockCK()
  const canvas = createMockCanvas()
  const ctx: RenderContext = {
    skCanvas: canvas,
    canvasKit: ck,
    fontManager: {} as unknown as FontManager,
    pixelRatio: 1,
    viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
  }
  return { ctx, canvas, ck }
}

describe('strokeCacheKey — includes arrow fields', () => {
  it('differs when startArrow changes', () => {
    const base = { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2 }
    const k1 = strokeCacheKey(base, 1)
    const k2 = strokeCacheKey({ ...base, startArrow: 'filled-arrow' }, 1)
    expect(k1).not.toBe(k2)
  })

  it('differs when endArrow changes', () => {
    const base = { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2 }
    const k1 = strokeCacheKey(base, 1)
    const k2 = strokeCacheKey({ ...base, endArrow: 'arrow' }, 1)
    expect(k1).not.toBe(k2)
  })
})

describe('drawArrowHead', () => {
  it('does nothing for style=none', () => {
    const { canvas, ck } = makeCtx()
    drawArrowHead(canvas, ck, 100, 100, 0, 'none', 10, { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2 }, 1)
    expect(canvas.calls.some((c) => c.method === 'drawPath')).toBe(false)
  })

  it('calls drawPath for filled-arrow', () => {
    const { canvas, ck } = makeCtx()
    drawArrowHead(canvas, ck, 100, 50, 0, 'filled-arrow', 10, { color: { r: 1, g: 0, b: 0, a: 1 }, width: 2 }, 1)
    expect(canvas.calls.some((c) => c.method === 'drawPath')).toBe(true)
  })

  it('calls drawPath for arrow (open)', () => {
    const { canvas, ck } = makeCtx()
    drawArrowHead(canvas, ck, 0, 0, Math.PI / 4, 'arrow', 12, { color: { r: 0, g: 0, b: 1, a: 1 }, width: 1 }, 1)
    expect(canvas.calls.some((c) => c.method === 'drawPath')).toBe(true)
  })

  it('calls drawPath for diamond', () => {
    const { canvas, ck } = makeCtx()
    drawArrowHead(canvas, ck, 50, 50, 0, 'diamond', 10, { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2 }, 1)
    expect(canvas.calls.some((c) => c.method === 'drawPath')).toBe(true)
  })

  it('calls drawPath for circle', () => {
    const { canvas, ck } = makeCtx()
    drawArrowHead(canvas, ck, 50, 50, 0, 'circle', 10, { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2 }, 1)
    expect(canvas.calls.some((c) => c.method === 'drawPath')).toBe(true)
  })
})

describe('Line — arrowhead rendering', () => {
  it('calls drawPath for endArrow=filled-arrow', () => {
    const { ctx, canvas } = makeCtx()
    const line = new Line({
      x1: 0, y1: 0, x2: 100, y2: 0,
      stroke: { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2, endArrow: 'filled-arrow' },
    })
    line.render(ctx)
    expect(canvas.calls.some((c) => c.method === 'drawLine')).toBe(true)
    expect(canvas.calls.some((c) => c.method === 'drawPath')).toBe(true)
  })

  it('calls drawPath for startArrow=arrow', () => {
    const { ctx, canvas } = makeCtx()
    const line = new Line({
      x1: 0, y1: 0, x2: 100, y2: 0,
      stroke: { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2, startArrow: 'arrow' },
    })
    line.render(ctx)
    expect(canvas.calls.some((c) => c.method === 'drawPath')).toBe(true)
  })

  it('does not call drawPath when no arrows', () => {
    const { ctx, canvas } = makeCtx()
    const line = new Line({
      x1: 0, y1: 0, x2: 100, y2: 0,
      stroke: { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2 },
    })
    line.render(ctx)
    expect(canvas.calls.some((c) => c.method === 'drawPath')).toBe(false)
  })

  it('serializes and restores arrow fields', () => {
    const line = new Line({
      x1: 0, y1: 0, x2: 100, y2: 0,
      stroke: { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2, startArrow: 'circle', endArrow: 'diamond' },
    })
    const json = line.toJSON()
    const restored = Line.fromJSON(json)
    expect(restored.stroke?.startArrow).toBe('circle')
    expect(restored.stroke?.endArrow).toBe('diamond')
  })

  it('both arrows — two drawPath calls', () => {
    const { ctx, canvas } = makeCtx()
    const line = new Line({
      x1: 0, y1: 0, x2: 100, y2: 0,
      stroke: { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2, startArrow: 'filled-arrow', endArrow: 'filled-arrow' },
    })
    line.render(ctx)
    const pathCalls = canvas.calls.filter((c) => c.method === 'drawPath')
    expect(pathCalls.length).toBe(2)
  })
})

describe('Path — arrowhead rendering', () => {
  it('calls drawPath for arrowheads on a straight path', () => {
    const { ctx, canvas } = makeCtx()
    const path = new Path({
      d: 'M 0 0 L 100 0',
      stroke: { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2, endArrow: 'filled-arrow' },
    })
    path.render(ctx)
    // At least 2 drawPath calls: one for the path stroke, one for the arrowhead
    const pathCalls = canvas.calls.filter((c) => c.method === 'drawPath')
    expect(pathCalls.length).toBeGreaterThanOrEqual(2)
  })

  it('does not call extra drawPath without arrows', () => {
    const { ctx, canvas } = makeCtx()
    const path = new Path({
      d: 'M 0 0 L 100 0',
      stroke: { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2 },
    })
    path.render(ctx)
    // Only one drawPath for the stroke itself
    const pathCalls = canvas.calls.filter((c) => c.method === 'drawPath')
    expect(pathCalls.length).toBe(1)
  })
})
