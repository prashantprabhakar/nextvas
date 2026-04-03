import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GridPlugin } from '../src/GridPlugin.js'
import type { StageInterface, RenderContext, RenderPass, Viewport, FontManager } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MockCanvas {
  calls: Array<{ method: string; args: unknown[] }>
}

function makeCanvas(): MockCanvas {
  const canvas: MockCanvas = { calls: [] }
  return new Proxy(canvas, {
    get(target, prop) {
      if (prop === 'calls') return target.calls
      return (...args: unknown[]) => {
        target.calls.push({ method: String(prop), args })
      }
    },
  })
}

function makeMockCK() {
  const paint = {
    setStyle: vi.fn(),
    setColor: vi.fn(),
    setAntiAlias: vi.fn(),
    setStrokeWidth: vi.fn(),
    setPathEffect: vi.fn(),
    delete: vi.fn(),
  }
  // Paint must be a class — CanvasKit requires `new ck.Paint()`
  class MockPaint {
    constructor() { Object.assign(this, paint) }
  }
  return {
    Paint: MockPaint as unknown as new () => typeof paint,
    Color4f: vi.fn((r: number, g: number, b: number, a: number) => new Float32Array([r, g, b, a])),
    PaintStyle: { Fill: 'fill', Stroke: 'stroke' },
    PathEffect: { MakeDash: vi.fn() },
    _paint: paint,
  }
}

function makeRenderCtx(canvas: unknown, ck: unknown): RenderContext {
  return {
    skCanvas: canvas,
    canvasKit: ck,
    fontManager: null,
    pixelRatio: 1,
    viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
  }
}

function makeStage(): StageInterface {
  const passes: RenderPass[] = []
  const stage: StageInterface = {
    id: 'test',
    canvasKit: {},
    layers: [],
    viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600, getState: () => ({ x: 0, y: 0, scale: 1, width: 800, height: 600 }) } as unknown as Viewport,
    fonts: {} as unknown as FontManager,
    on: vi.fn(),
    off: vi.fn(),
    addRenderPass(pass: RenderPass) {
      passes.push(pass)
    },
    removeRenderPass(pass: RenderPass) {
      const i = passes.indexOf(pass)
      if (i !== -1) passes.splice(i, 1)
    },
    getBoundingBox: vi.fn(),
    render: vi.fn(),
    markDirty: vi.fn(),
    emit: vi.fn(),
    resize: vi.fn(),
    _passes: passes,
  } as unknown as StageInterface
  return stage
}

function getPasses(stage: StageInterface): RenderPass[] {
  return (stage as unknown as { _passes: RenderPass[] })._passes
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GridPlugin', () => {
  let plugin: GridPlugin
  let stage: StageInterface

  beforeEach(() => {
    plugin = new GridPlugin()
    stage = makeStage()
    plugin.install(stage)
  })

  it('installs a pre render pass', () => {
    const passes = getPasses(stage)
    expect(passes).toHaveLength(1)
    expect(passes[0]!.phase).toBe('pre')
    expect(passes[0]!.order).toBeLessThan(0)
  })

  it('uninstall removes render pass', () => {
    plugin.uninstall(stage)
    expect(getPasses(stage)).toHaveLength(0)
  })

  it('draws lines when type is lines', () => {
    const canvas = makeCanvas()
    const ck = makeMockCK()
    const ctx = makeRenderCtx(canvas, ck)

    getPasses(stage)[0]!.render(ctx)

    const lineCalls = (canvas as MockCanvas).calls.filter((c) => c.method === 'drawLine')
    expect(lineCalls.length).toBeGreaterThan(0)
  })

  it('draws dots when type is dots', () => {
    plugin.uninstall(stage)
    plugin = new GridPlugin({ type: 'dots', cellSize: 50 })
    plugin.install(stage)

    const canvas = makeCanvas()
    const ck = makeMockCK()
    const ctx = makeRenderCtx(canvas, ck)

    getPasses(stage)[0]!.render(ctx)

    const circleCalls = (canvas as MockCanvas).calls.filter((c) => c.method === 'drawCircle')
    expect(circleCalls.length).toBeGreaterThan(0)
  })

  it('snap returns value unchanged when snapToGrid is false', () => {
    expect(plugin.snap(13)).toBe(13)
  })

  it('snap snaps to nearest grid cell', () => {
    plugin.uninstall(stage)
    plugin = new GridPlugin({ snapToGrid: true, cellSize: 20, snapThreshold: 5 })
    plugin.install(stage)

    expect(plugin.snap(19)).toBe(20) // within threshold
    expect(plugin.snap(14)).toBe(14) // outside threshold
  })

  it('snapPoint snaps both axes', () => {
    plugin.uninstall(stage)
    plugin = new GridPlugin({ snapToGrid: true, cellSize: 20, snapThreshold: 5 })
    plugin.install(stage)

    const pt = plugin.snapPoint(19, 41)
    expect(pt.x).toBe(20)
    expect(pt.y).toBe(40)
  })

  it('skips rendering when canvasKit or canvas is missing', () => {
    const passes = getPasses(stage)
    expect(() =>
      passes[0]!.render({
        skCanvas: null,
        canvasKit: null,
        fontManager: null,
        pixelRatio: 1,
        viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
      }),
    ).not.toThrow()
  })

  it('paint.delete is called after render', () => {
    const canvas = makeCanvas()
    const ck = makeMockCK()
    const ctx = makeRenderCtx(canvas, ck)

    getPasses(stage)[0]!.render(ctx)

    expect(ck._paint.delete).toHaveBeenCalled()
  })
})
