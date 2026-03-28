import { describe, it, expect } from 'vitest'
import { Group } from '../../src/objects/Group.js'
import { Rect } from '../../src/objects/Rect.js'
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

describe('Group', () => {
  it('add/remove child', () => {
    const g = new Group()
    const r = new Rect()
    g.add(r)
    expect(g.children).toHaveLength(1)
    expect(r.parent).toBe(g)
    g.remove(r)
    expect(g.children).toHaveLength(0)
    expect(r.parent).toBeNull()
  })

  it('throws when adding child with existing parent', () => {
    const g1 = new Group()
    const g2 = new Group()
    const r = new Rect()
    g1.add(r)
    expect(() => g2.add(r)).toThrow()
  })

  it('clear removes all children', () => {
    const g = new Group()
    g.add(new Rect()).add(new Rect())
    g.clear()
    expect(g.children).toHaveLength(0)
  })

  it('getById finds nested child', () => {
    const g = new Group()
    const inner = new Group()
    const r = new Rect()
    inner.add(r)
    g.add(inner)
    expect(g.getById(r.id)).toBe(r)
  })

  it('render calls save/restore and concat for transform', () => {
    const { ctx, canvas } = makeCtx()
    const g = new Group({ x: 50, y: 50, width: 200, height: 200 })
    g.add(
      new Rect({
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        fill: { type: 'solid', color: { r: 1, g: 0, b: 0, a: 1 } },
      }),
    )
    g.render(ctx)
    expect(canvas.calls[0]!.method).toBe('save')
    expect(canvas.calls.some((c) => c.method === 'concat')).toBe(true)
    expect(canvas.calls[canvas.calls.length - 1]!.method).toBe('restore')
  })

  it('render with clip=true calls clipRect', () => {
    const { ctx, canvas } = makeCtx()
    const g = new Group({ x: 0, y: 0, width: 100, height: 100, clip: true })
    g.render(ctx)
    expect(canvas.calls.some((c) => c.method === 'clipRect')).toBe(true)
  })

  it('render without clip does not call clipRect', () => {
    const { ctx, canvas } = makeCtx()
    const g = new Group({ x: 0, y: 0, width: 100, height: 100, clip: false })
    g.render(ctx)
    expect(canvas.calls.some((c) => c.method === 'clipRect')).toBe(false)
  })

  it('hitTest returns true when child is hit', () => {
    const g = new Group()
    g.add(new Rect({ x: 10, y: 10, width: 80, height: 80 }))
    expect(g.hitTest(50, 50)).toBe(true)
    expect(g.hitTest(200, 200)).toBe(false)
  })

  it('hitTestChild returns correct child', () => {
    const g = new Group()
    const a = new Rect({ x: 0, y: 0, width: 100, height: 100 })
    const b = new Rect({ x: 0, y: 0, width: 100, height: 100 })
    g.add(a).add(b)
    expect(g.hitTestChild(50, 50)).toBe(b) // topmost
  })

  it('getWorldBoundingBox unions children', () => {
    const g = new Group({ x: 10, y: 10 })
    g.add(new Rect({ x: 0, y: 0, width: 50, height: 50 }))
    g.add(new Rect({ x: 40, y: 40, width: 50, height: 50 }))
    const bb = g.getWorldBoundingBox()
    expect(bb.width).toBe(90) // from x=10 to x=100
    expect(bb.height).toBe(90)
  })

  it('nested transforms compose correctly', () => {
    const outer = new Group({ x: 100, y: 0 })
    const inner = new Rect({ x: 50, y: 0, width: 10, height: 10 })
    outer.add(inner)
    const bb = inner.getWorldBoundingBox()
    expect(bb.x).toBeCloseTo(150) // 100 + 50
  })

  it('toJSON includes children', () => {
    const g = new Group()
    g.add(new Rect({ x: 5, y: 5, width: 10, height: 10 }))
    const json = g.toJSON()
    expect(json['children']).toHaveLength(1)
    expect(json['clip']).toBe(false)
  })

  it('destroy cleans up children', () => {
    const g = new Group()
    const r = new Rect()
    g.add(r)
    g.destroy()
    expect(g.children).toHaveLength(0)
    expect(r.parent).toBeNull()
  })
})
