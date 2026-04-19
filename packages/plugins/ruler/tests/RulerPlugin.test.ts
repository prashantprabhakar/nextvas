import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RulerPlugin } from '../src/RulerPlugin.js'
import { Layer, BoundingBox } from '@nexvas/core'
import type { StageInterface, FontManager, RenderPass, RenderContext, ViewportState } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeViewport(overrides: Partial<ViewportState> = {}): ViewportState & {
  pan(dx: number, dy: number): void
  zoom(factor: number, ox: number, oy: number): void
  getState(): ViewportState
  screenToWorld(sx: number, sy: number): { x: number; y: number }
} {
  const state: ViewportState = { x: 0, y: 0, scale: 1, width: 800, height: 600, ...overrides }
  return {
    ...state,
    getState: () => state,
    pan(dx: number, dy: number) { state.x += dx; state.y += dy },
    zoom(factor: number) { state.scale *= factor },
    screenToWorld(sx: number, sy: number) {
      return { x: (sx - state.x) / state.scale, y: (sy - state.y) / state.scale }
    },
    panTo() {},
    setScale() {},
    reset() {},
    setState() {},
    setOptions() {},
    setOnChange() {},
    setSize() {},
    fitToRect() {},
    animateTo() {},
    cancelAnimation() {},
  }
}

function makeStage() {
  const layer = new Layer()
  const handlers = new Map<string, Set<(e: unknown) => void>>()
  const passes: RenderPass[] = []
  const vp = makeViewport()

  const stage = {
    id: 'test-stage',
    canvasKit: {},
    get layers() { return [layer] as unknown as readonly Layer[] },
    viewport: vp,
    fonts: {} as unknown as FontManager,
    on(event: string, handler: (e: unknown) => void) {
      if (!handlers.has(event)) handlers.set(event, new Set())
      handlers.get(event)!.add(handler)
    },
    off(event: string, handler: (e: unknown) => void) {
      handlers.get(event)?.delete(handler)
    },
    emit(event: string, data: unknown) {
      handlers.get(event)?.forEach((h) => h(data))
    },
    addRenderPass(pass: RenderPass) { passes.push(pass) },
    removeRenderPass(pass: RenderPass) {
      const i = passes.indexOf(pass)
      if (i !== -1) passes.splice(i, 1)
    },
    getBoundingBox() { return new BoundingBox(0, 0, 800, 600) },
    render() {},
    markDirty: vi.fn(),
    resize() {},
    find: () => [],
    findByType: () => [],
    getObjectById: () => undefined,
    registerObject: () => {},
    getObjectLayer: () => null,
    bringToFront: () => {},
    sendToBack: () => {},
    bringForward: () => {},
    sendBackward: () => {},
    groupObjects: () => { throw new Error('not implemented') },
    ungroupObject: () => [],
    batch(fn: () => void) { fn() },
    _passes: passes,
    _handlers: handlers,
  } as unknown as StageInterface & { _passes: RenderPass[]; _handlers: Map<string, Set<(e: unknown) => void>> }

  return { stage, vp, passes, handlers }
}

/** Minimal CanvasKit mock that records draw calls. */
function makeCanvasKit() {
  const drawCalls: string[] = []
  const ck = {
    Paint: class {
      setStyle() {}
      setColor() {}
      setAntiAlias() {}
      setStrokeWidth() {}
      delete() {}
    },
    Font: class {
      delete() {}
    },
    Color4f: (r: number, g: number, b: number, a: number) => new Float32Array([r, g, b, a]),
    PaintStyle: { Fill: 'fill', Stroke: 'stroke' },
  }
  const skCanvas = {
    drawRect() { drawCalls.push('drawRect') },
    drawLine() { drawCalls.push('drawLine') },
    drawText(str: string) { drawCalls.push(`drawText:${str}`) },
    save: () => 1,
    restore() {},
    concat() {},
  }
  return { ck, skCanvas, drawCalls }
}

function makeRenderCtx(
  ck: ReturnType<typeof makeCanvasKit>['ck'],
  skCanvas: ReturnType<typeof makeCanvasKit>['skCanvas'],
  stage: StageInterface,
  vpOverrides: Partial<ViewportState> = {},
): RenderContext {
  const vp: ViewportState = { x: 0, y: 0, scale: 1, width: 800, height: 600, ...vpOverrides }
  return {
    skCanvas,
    canvasKit: ck as unknown as RenderContext['canvasKit'],
    fontManager: null,
    pixelRatio: 1,
    viewport: vp,
    stage,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RulerPlugin', () => {
  let stageEnv: ReturnType<typeof makeStage>

  beforeEach(() => {
    stageEnv = makeStage()
  })

  describe('install / uninstall', () => {
    it('installs without throwing', () => {
      const plugin = new RulerPlugin()
      expect(() => plugin.install(stageEnv.stage)).not.toThrow()
    })

    it('registers a post-phase render pass on install', () => {
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      expect(stageEnv.passes).toHaveLength(1)
      expect(stageEnv.passes[0]!.phase).toBe('post')
    })

    it('removes the render pass on uninstall', () => {
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      plugin.uninstall(stageEnv.stage)
      expect(stageEnv.passes).toHaveLength(0)
    })

    it('uninstall is idempotent when called without prior install', () => {
      const plugin = new RulerPlugin()
      expect(() => plugin.uninstall(stageEnv.stage)).not.toThrow()
    })

    it('supports install → uninstall → reinstall', () => {
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      plugin.uninstall(stageEnv.stage)
      plugin.install(stageEnv.stage)
      expect(stageEnv.passes).toHaveLength(1)
    })
  })

  describe('ruler:ready event', () => {
    it('emits ruler:ready on install', () => {
      const handler = vi.fn()
      stageEnv.stage.on('ruler:ready', handler as unknown as Parameters<StageInterface['on']>[1])
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      expect(handler).toHaveBeenCalledOnce()
    })

    it('ruler:ready payload contains the configured size', () => {
      const received: unknown[] = []
      stageEnv.stage.on('ruler:ready', (e) => received.push(e))
      const plugin = new RulerPlugin({ size: 24 })
      plugin.install(stageEnv.stage)
      expect(received[0]).toEqual({ size: 24 })
    })

    it('ruler:ready uses default size of 20 when no options given', () => {
      const received: unknown[] = []
      stageEnv.stage.on('ruler:ready', (e) => received.push(e))
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      expect(received[0]).toEqual({ size: 20 })
    })
  })

  describe('render pass', () => {
    it('render pass runs without throwing with a valid context', () => {
      const { ck, skCanvas } = makeCanvasKit()
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      const pass = stageEnv.passes[0]!
      const ctx = makeRenderCtx(ck, skCanvas, stageEnv.stage)
      expect(() => pass.render(ctx)).not.toThrow()
    })

    it('render pass skips drawing when skCanvas is null', () => {
      const { ck } = makeCanvasKit()
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      const pass = stageEnv.passes[0]!
      const ctx: RenderContext = {
        skCanvas: null,
        canvasKit: ck as unknown as RenderContext['canvasKit'],
        fontManager: null,
        pixelRatio: 1,
        viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        stage: stageEnv.stage,
      }
      expect(() => pass.render(ctx)).not.toThrow()
    })

    it('draws background rects for both rulers', () => {
      const { ck, skCanvas, drawCalls } = makeCanvasKit()
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      const pass = stageEnv.passes[0]!
      pass.render(makeRenderCtx(ck, skCanvas, stageEnv.stage))
      const rectCount = drawCalls.filter((c) => c === 'drawRect').length
      // At minimum: horizontal + vertical backgrounds = 2 rects
      expect(rectCount).toBeGreaterThanOrEqual(2)
    })

    it('draws tick lines for the rulers', () => {
      const { ck, skCanvas, drawCalls } = makeCanvasKit()
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      const pass = stageEnv.passes[0]!
      pass.render(makeRenderCtx(ck, skCanvas, stageEnv.stage))
      const lineCount = drawCalls.filter((c) => c === 'drawLine').length
      // At minimum: 2 separator lines + some tick marks
      expect(lineCount).toBeGreaterThanOrEqual(2)
    })

    it('draws text labels for major ticks', () => {
      const { ck, skCanvas, drawCalls } = makeCanvasKit()
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      const pass = stageEnv.passes[0]!
      pass.render(makeRenderCtx(ck, skCanvas, stageEnv.stage))
      const textCount = drawCalls.filter((c) => c.startsWith('drawText:')).length
      expect(textCount).toBeGreaterThan(0)
    })

    it('renders at zoomed-in scale without throwing', () => {
      const { ck, skCanvas } = makeCanvasKit()
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      const pass = stageEnv.passes[0]!
      // scale=5 (zoomed in), pan offset
      const ctx = makeRenderCtx(ck, skCanvas, stageEnv.stage, { x: -200, y: -100, scale: 5 })
      expect(() => pass.render(ctx)).not.toThrow()
    })

    it('renders at zoomed-out scale without throwing', () => {
      const { ck, skCanvas } = makeCanvasKit()
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      const pass = stageEnv.passes[0]!
      const ctx = makeRenderCtx(ck, skCanvas, stageEnv.stage, { scale: 0.1 })
      expect(() => pass.render(ctx)).not.toThrow()
    })
  })

  describe('options', () => {
    it('accepts custom size', () => {
      const plugin = new RulerPlugin({ size: 30 })
      expect(() => plugin.install(stageEnv.stage)).not.toThrow()
    })

    it('accepts all unit options', () => {
      const units: Array<'px' | 'pt' | 'mm' | 'cm' | 'in'> = ['px', 'pt', 'mm', 'cm', 'in']
      for (const unit of units) {
        const { ck, skCanvas } = makeCanvasKit()
        const { stage, passes } = makeStage()
        const plugin = new RulerPlugin({ unit })
        plugin.install(stage)
        expect(() => passes[0]!.render(makeRenderCtx(ck, skCanvas, stage))).not.toThrow()
      }
    })

    it('accepts custom colors without throwing', () => {
      const plugin = new RulerPlugin({
        tickColor: { r: 1, g: 0, b: 0, a: 1 },
        backgroundColor: { r: 0, g: 0, b: 1, a: 0.5 },
        textColor: { r: 0, g: 1, b: 0, a: 1 },
      })
      const { ck, skCanvas } = makeCanvasKit()
      plugin.install(stageEnv.stage)
      expect(() => stageEnv.passes[0]!.render(makeRenderCtx(ck, skCanvas, stageEnv.stage))).not.toThrow()
    })

    it('accepts custom fontSize', () => {
      const plugin = new RulerPlugin({ fontSize: 12 })
      const { ck, skCanvas } = makeCanvasKit()
      plugin.install(stageEnv.stage)
      expect(() => stageEnv.passes[0]!.render(makeRenderCtx(ck, skCanvas, stageEnv.stage))).not.toThrow()
    })
  })

  describe('render pass order', () => {
    it('render pass order is high (draws on top)', () => {
      const plugin = new RulerPlugin()
      plugin.install(stageEnv.stage)
      const pass = stageEnv.passes[0]!
      expect(pass.order).toBeGreaterThanOrEqual(100)
    })
  })
})
