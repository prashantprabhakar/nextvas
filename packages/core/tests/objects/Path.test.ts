import { describe, it, expect } from 'vitest'
import { Path } from '../../src/objects/Path.js'
import { createMockCK, createMockCanvas, createMockPath } from '../__mocks__/canvaskit.js'
import type { RenderContext } from '../../src/types.js'
import type { FontManager } from '../../src/FontManager.js'

function makeCtx(containsResult = false) {
  const ck = createMockCK()
  // Override path mock to control contains() result
  ck.Path.MakeFromSVGString = (_svg: string) => createMockPath(containsResult)
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

describe('Path', () => {
  it('renders — calls drawPath', () => {
    const { ctx, canvas } = makeCtx()
    const path = new Path({
      d: 'M 0 0 L 100 100 Z',
      fill: { type: 'solid', color: { r: 1, g: 0, b: 0, a: 1 } },
    })
    path.render(ctx)
    expect(canvas.calls.some((c) => c.method === 'drawPath')).toBe(true)
  })

  it('skips render with empty d', () => {
    const { ctx, canvas } = makeCtx()
    const path = new Path({ d: '' })
    path.render(ctx)
    expect(canvas.calls.some((c) => c.method === 'drawPath')).toBe(false)
  })

  it('skips render when invisible', () => {
    const { ctx, canvas } = makeCtx()
    const path = new Path({ d: 'M 0 0 L 100 100 Z', visible: false })
    path.render(ctx)
    expect(canvas.calls.some((c) => c.method === 'drawPath')).toBe(false)
  })

  it('hitTest uses skPath.contains when available', () => {
    const { ctx } = makeCtx(true) // contains returns true
    const path = new Path({ d: 'M 0 0 L 100 100 Z' })
    path.render(ctx) // triggers path parsing
    expect(path.hitTest(50, 50)).toBe(true)
  })

  it('hitTest returns true everywhere without skPath — sentinel box prevents culling', () => {
    const path = new Path({ x: 0, y: 0, width: 100, height: 100, d: 'M 0 0 L 100 100 Z' })
    // No render() called — getLocalBoundingBox() returns a large sentinel so
    // culling passes never discard an unrendered path. Both points hit.
    expect(path.hitTest(50, 50)).toBe(true)
    expect(path.hitTest(200, 200)).toBe(true)
  })

  it('d setter invalidates cached path', () => {
    const { ctx, canvas } = makeCtx()
    const path = new Path({
      d: 'M 0 0 L 50 50 Z',
      fill: { type: 'solid', color: { r: 1, g: 0, b: 0, a: 1 } },
    })
    path.render(ctx) // parse once
    const firstCalls = canvas.calls.length
    path.d = 'M 0 0 L 100 100 Z' // invalidate
    path.render(ctx) // should re-parse and re-draw
    expect(canvas.calls.length).toBeGreaterThan(firstCalls)
  })

  it('toJSON roundtrip', () => {
    const path = new Path({ d: 'M 10 10 L 90 90 Z' })
    const json = path.toJSON()
    expect(json.type).toBe('Path')
    expect(json['d']).toBe('M 10 10 L 90 90 Z')
    const restored = Path.fromJSON(json)
    expect(restored.d).toBe('M 10 10 L 90 90 Z')
  })
})
