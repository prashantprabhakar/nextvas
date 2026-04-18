import { describe, it, expect, vi } from 'vitest'
import { makeFillPaint, fillCacheKey } from '../../src/renderer/paint.js'
import { Rect } from '../../src/objects/Rect.js'
import { Circle } from '../../src/objects/Circle.js'
import { createMockCK, createMockCanvas } from '../__mocks__/canvaskit.js'
import type { RadialGradientFill, RenderContext, Fill } from '../../src/types.js'
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

const radialFill: RadialGradientFill = {
  type: 'radial-gradient',
  stops: [
    { offset: 0, color: { r: 1, g: 0, b: 0, a: 1 } },
    { offset: 1, color: { r: 0, g: 0, b: 1, a: 1 } },
  ],
  center: { x: 0.5, y: 0.5 },
  radius: 0.5,
}

describe('RadialGradientFill — type definition', () => {
  it('is assignable to Fill union', () => {
    const fill: Fill = radialFill
    expect(fill.type).toBe('radial-gradient')
  })

  it('has correct fields', () => {
    expect(radialFill.center).toEqual({ x: 0.5, y: 0.5 })
    expect(radialFill.radius).toBe(0.5)
    expect(radialFill.stops).toHaveLength(2)
  })
})

describe('makeFillPaint — radial gradient', () => {
  it('calls MakeRadialGradient when bounds provided', () => {
    const { ck } = makeCtx()
    const spy = vi.spyOn(ck.Shader, 'MakeRadialGradient')
    makeFillPaint(ck, radialFill, 1, { x: 0, y: 0, width: 200, height: 100 })
    expect(spy).toHaveBeenCalledOnce()
    const [center, radius] = spy.mock.calls[0] as [number[], number]
    // center at (0.5*200, 0.5*100) = (100, 50)
    expect(center).toEqual([100, 50])
    // radius = 0.5 * max(200, 100) = 100
    expect(radius).toBe(100)
  })

  it('does NOT call MakeRadialGradient when bounds omitted', () => {
    const { ck } = makeCtx()
    const spy = vi.spyOn(ck.Shader, 'MakeRadialGradient')
    makeFillPaint(ck, radialFill, 1)
    expect(spy).not.toHaveBeenCalled()
  })

  it('does NOT call MakeLinearGradient for radial fill', () => {
    const { ck } = makeCtx()
    const spy = vi.spyOn(ck.Shader, 'MakeLinearGradient')
    makeFillPaint(ck, radialFill, 1, { x: 0, y: 0, width: 100, height: 100 })
    expect(spy).not.toHaveBeenCalled()
  })

  it('computes center correctly for non-zero origin bounds', () => {
    const { ck } = makeCtx()
    const spy = vi.spyOn(ck.Shader, 'MakeRadialGradient')
    makeFillPaint(ck, radialFill, 1, { x: 10, y: 20, width: 100, height: 80 })
    const [center] = spy.mock.calls[0] as [number[]]
    // center at (10 + 0.5*100, 20 + 0.5*80) = (60, 60)
    expect(center).toEqual([60, 60])
  })
})

describe('fillCacheKey — radial gradient', () => {
  it('includes bounds in key when fill is radial-gradient', () => {
    const bounds = { x: 0, y: 0, width: 200, height: 100 }
    const key = fillCacheKey(radialFill, 1, bounds)
    expect(key).toContain('200')
    expect(key).toContain('100')
  })

  it('differs when bounds change', () => {
    const k1 = fillCacheKey(radialFill, 1, { x: 0, y: 0, width: 100, height: 100 })
    const k2 = fillCacheKey(radialFill, 1, { x: 0, y: 0, width: 200, height: 100 })
    expect(k1).not.toBe(k2)
  })

  it('falls back to fill-only key when bounds omitted', () => {
    const k1 = fillCacheKey(radialFill, 1)
    const k2 = fillCacheKey(radialFill, 1)
    expect(k1).toBe(k2)
  })
})

describe('Rect — radial gradient render', () => {
  it('calls MakeRadialGradient when fill is radial-gradient', () => {
    const { ctx, ck } = makeCtx()
    const spy = vi.spyOn(ck.Shader, 'MakeRadialGradient')
    const rect = new Rect({ x: 0, y: 0, width: 200, height: 100, fill: radialFill })
    rect.render(ctx)
    expect(spy).toHaveBeenCalledOnce()
    const [center, radius] = spy.mock.calls[0] as [number[], number]
    expect(center).toEqual([100, 50])
    expect(radius).toBe(100)
  })

  it('invalidates paint cache when Rect is resized', () => {
    const { ctx, ck } = makeCtx()
    const spy = vi.spyOn(ck.Shader, 'MakeRadialGradient')
    const rect = new Rect({ x: 0, y: 0, width: 100, height: 100, fill: radialFill })
    rect.render(ctx)
    expect(spy).toHaveBeenCalledTimes(1)

    // Resize — paint must be rebuilt
    rect.width = 200
    rect.render(ctx)
    expect(spy).toHaveBeenCalledTimes(2)
  })
})

describe('Circle — radial gradient render', () => {
  it('calls MakeRadialGradient when fill is radial-gradient', () => {
    const { ctx, ck } = makeCtx()
    const spy = vi.spyOn(ck.Shader, 'MakeRadialGradient')
    const circle = new Circle({ cx: 50, cy: 50, radius: 50, fill: radialFill })
    circle.render(ctx)
    expect(spy).toHaveBeenCalledOnce()
  })
})
