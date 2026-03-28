import { describe, it, expect } from 'vitest'
import { Line } from '../../src/objects/Line.js'
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

describe('Line', () => {
  it('renders stroke — calls drawLine', () => {
    const { ctx, canvas } = makeCtx()
    const line = new Line({
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      stroke: { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2 },
    })
    line.render(ctx)
    expect(canvas.calls.some((c) => c.method === 'drawLine')).toBe(true)
  })

  it('skips render without stroke', () => {
    const { ctx, canvas } = makeCtx()
    const line = new Line({ x1: 0, y1: 0, x2: 100, y2: 0 })
    line.render(ctx)
    expect(canvas.calls.some((c) => c.method === 'drawLine')).toBe(false)
  })

  it('hitTest — point on horizontal line', () => {
    const line = new Line({
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      stroke: { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2 },
    })
    expect(line.hitTest(50, 2)).toBe(true) // 2px away — within 4px tolerance
    expect(line.hitTest(50, 10)).toBe(false) // 10px away — outside tolerance
  })

  it('hitTest — point on diagonal line', () => {
    const line = new Line({
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 100,
      stroke: { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2 },
    })
    expect(line.hitTest(50, 50)).toBe(true) // exactly on the line
    expect(line.hitTest(50, 60)).toBe(false) // 7+ px off
  })

  it('hitTest — invisible always false', () => {
    const line = new Line({ x1: 0, y1: 0, x2: 100, y2: 0, visible: false })
    expect(line.hitTest(50, 0)).toBe(false)
  })

  it('toJSON roundtrip', () => {
    const line = new Line({ x1: 10, y1: 20, x2: 80, y2: 90 })
    const json = line.toJSON()
    expect(json.type).toBe('Line')
    expect(json['x1']).toBe(10)
    const restored = Line.fromJSON(json)
    expect(restored.x1).toBe(10)
    expect(restored.y2).toBe(90)
  })

  it('getLocalBoundingBox is expanded by stroke width', () => {
    const line = new Line({
      x1: 10,
      y1: 10,
      x2: 110,
      y2: 10,
      stroke: { color: { r: 0, g: 0, b: 0, a: 1 }, width: 4 },
    })
    const bb = line.getLocalBoundingBox()
    expect(bb.y).toBe(10 - 2) // top expanded by strokeWidth/2
    expect(bb.height).toBe(4) // 0 height + 2*strokeWidth/2
  })
})
