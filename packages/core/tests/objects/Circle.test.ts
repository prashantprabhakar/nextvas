import { describe, it, expect } from 'vitest'
import { Circle } from '../../src/objects/Circle.js'
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

describe('Circle', () => {
  it('renders fill — calls drawOval', () => {
    const { ctx, canvas } = makeCtx()
    const c = new Circle({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      fill: { type: 'solid', color: { r: 0, g: 0, b: 1, a: 1 } },
    })
    c.render(ctx)
    expect(canvas.calls.some((call) => call.method === 'drawOval')).toBe(true)
  })

  it('skips render when invisible', () => {
    const { ctx, canvas } = makeCtx()
    const c = new Circle({ visible: false })
    c.render(ctx)
    expect(canvas.calls.some((call) => call.method === 'drawOval')).toBe(false)
  })

  it('hitTest inside', () => {
    const c = new Circle({ x: 0, y: 0, width: 100, height: 100 })
    expect(c.hitTest(50, 50)).toBe(true)
  })

  it('hitTest outside', () => {
    const c = new Circle({ x: 0, y: 0, width: 100, height: 100 })
    expect(c.hitTest(200, 50)).toBe(false)
  })

  it('toJSON roundtrip', () => {
    const c = new Circle({ x: 10, y: 20, width: 50, height: 50 })
    const json = c.toJSON()
    expect(json.type).toBe('Circle')
    const restored = Circle.fromJSON(json)
    expect(restored.x).toBe(10)
    expect(restored.width).toBe(50)
  })
})
