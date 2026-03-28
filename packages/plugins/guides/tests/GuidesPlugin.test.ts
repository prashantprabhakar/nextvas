import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GuidesPlugin } from '../src/GuidesPlugin.js'
import { Rect, Layer } from '@nexvas/core'
import type { StageInterface, CanvasPointerEvent, RenderContext, RenderPass } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePointerEvent(
  opts: {
    worldX?: number
    worldY?: number
  } = {},
): CanvasPointerEvent {
  return {
    world: { x: opts.worldX ?? 0, y: opts.worldY ?? 0 },
    screen: { x: opts.worldX ?? 0, y: opts.worldY ?? 0 },
    originalEvent: {} as MouseEvent,
    stopped: false,
    stopPropagation() {
      this.stopped = true
    },
  }
}

type EventHandler = (e: unknown) => void

function makeStage(layerObjects: Rect[] = []): StageInterface {
  const layer = new Layer()
  for (const obj of layerObjects) layer.add(obj)

  const handlers = new Map<string, Set<EventHandler>>()
  const passes: RenderPass[] = []

  const stage: StageInterface = {
    id: 'test-stage',
    canvasKit: {},
    get layers() {
      return [layer] as unknown as readonly Layer[]
    },
    on(event: string, handler: EventHandler) {
      if (!handlers.has(event)) handlers.set(event, new Set())
      handlers.get(event)!.add(handler)
    },
    off(event: string, handler: EventHandler) {
      handlers.get(event)?.delete(handler)
    },
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
    _fire(event: string, data: unknown) {
      handlers.get(event)?.forEach((h) => h(data))
    },
    _passes: passes,
  } as unknown as StageInterface

  return stage
}

function fire(stage: StageInterface, event: string, data: unknown) {
  ;(stage as unknown as { _fire: (e: string, d: unknown) => void })._fire(event, data)
}

function getPasses(stage: StageInterface): RenderPass[] {
  return (stage as unknown as { _passes: RenderPass[] })._passes
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
  return {
    Paint: vi.fn(() => paint),
    Color4f: vi.fn(() => new Float32Array(4)),
    PaintStyle: { Stroke: 'stroke' },
    PathEffect: { MakeDash: vi.fn(() => 'dash-effect') },
    _paint: paint,
  }
}

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

function makeRenderCtx(canvas: unknown, ck: unknown): RenderContext {
  return {
    skCanvas: canvas,
    canvasKit: ck,
    fontManager: null,
    pixelRatio: 1,
    viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GuidesPlugin', () => {
  let plugin: GuidesPlugin
  let moving: Rect
  let target: Rect
  let stage: StageInterface

  beforeEach(() => {
    plugin = new GuidesPlugin({ snapThreshold: 10 })
    // 'moving' is at (50, 50), 'target' right edge is at 200 → snaps moving left edge to 200
    moving = new Rect({ x: 50, y: 50, width: 100, height: 100 })
    target = new Rect({ x: 100, y: 200, width: 100, height: 100 })
    stage = makeStage([moving, target])
    plugin.install(stage)
  })

  it('installs a post render pass', () => {
    const passes = getPasses(stage)
    expect(passes).toHaveLength(1)
    expect(passes[0]!.phase).toBe('post')
  })

  it('uninstall removes render pass', () => {
    plugin.uninstall(stage)
    expect(getPasses(stage)).toHaveLength(0)
  })

  it('no guides drawn when not dragging', () => {
    const canvas = makeCanvas()
    const ck = makeMockCK()
    const ctx = makeRenderCtx(canvas, ck)

    getPasses(stage)[0]!.render(ctx)
    const lineCalls = canvas.calls.filter((c) => c.method === 'drawLine')
    expect(lineCalls).toHaveLength(0)
  })

  it('snaps object to nearby edge and draws a guide', () => {
    // moving rect at x=50. target left edge at x=100, right edge at x=200.
    // Drag moving near x=98 (close to target left edge at 100, threshold=10)
    fire(stage, 'mousedown', makePointerEvent({ worldX: 75, worldY: 75 })) // center of moving
    fire(stage, 'mousemove', makePointerEvent({ worldX: 73, worldY: 75 })) // tiny move → x ≈ 48

    // Drag to position where moving.x ≈ 98 (delta = 98-50 = +48, worldX = 75+48 = 123)
    fire(stage, 'mousemove', makePointerEvent({ worldX: 123, worldY: 75 }))

    // moving.x should have snapped to 100 (target left edge)
    expect(moving.x).toBe(100)

    // Guide should be drawn
    const canvas = makeCanvas()
    const ck = makeMockCK()
    const ctx = makeRenderCtx(canvas, ck)
    getPasses(stage)[0]!.render(ctx)
    const lineCalls = canvas.calls.filter((c) => c.method === 'drawLine')
    expect(lineCalls.length).toBeGreaterThan(0)
  })

  it('clears guides on mouseup', () => {
    fire(stage, 'mousedown', makePointerEvent({ worldX: 75, worldY: 75 }))
    fire(stage, 'mousemove', makePointerEvent({ worldX: 123, worldY: 75 }))
    fire(stage, 'mouseup', makePointerEvent({ worldX: 123, worldY: 75 }))

    const canvas = makeCanvas()
    const ck = makeMockCK()
    const ctx = makeRenderCtx(canvas, ck)
    getPasses(stage)[0]!.render(ctx)

    const lineCalls = canvas.calls.filter((c) => c.method === 'drawLine')
    expect(lineCalls).toHaveLength(0)
  })

  it('does not snap when outside threshold', () => {
    // Move far away from any edge
    fire(stage, 'mousedown', makePointerEvent({ worldX: 75, worldY: 75 }))
    fire(stage, 'mousemove', makePointerEvent({ worldX: 400, worldY: 400 }))

    // No snap — position should be as dragged
    const expectedX = 50 + (400 - 75) // 375
    expect(moving.x).toBe(expectedX)
  })

  it('locked objects are not dragged by guides plugin', () => {
    moving.locked = true
    const initialX = moving.x

    fire(stage, 'mousedown', makePointerEvent({ worldX: 75, worldY: 75 }))
    fire(stage, 'mousemove', makePointerEvent({ worldX: 200, worldY: 75 }))

    // Moving is locked — GuidesPlugin should not have started a drag on it
    expect(moving.x).toBe(initialX)
  })
})
