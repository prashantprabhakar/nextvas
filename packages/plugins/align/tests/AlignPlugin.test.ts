import { describe, it, expect, beforeEach } from 'vitest'
import { AlignPlugin, type AlignPluginAPI } from '../src/AlignPlugin.js'
import { Rect, Layer, BoundingBox } from '@nexvas/core'
import type { StageInterface, Viewport, FontManager, RenderPass } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStage(): StageInterface {
  const layer = new Layer()
  const handlers = new Map<string, Set<(e: unknown) => void>>()
  const passes: RenderPass[] = []

  const stage: StageInterface = {
    id: 'test-stage',
    canvasKit: {},
    get layers() { return [layer] as unknown as readonly Layer[] },
    viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 } as unknown as Viewport,
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
    markDirty() {},
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
  } as unknown as StageInterface

  return stage
}

function makeRect(x: number, y: number, w: number, h: number): Rect {
  return new Rect({ x, y, width: w, height: h })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AlignPlugin', () => {
  let plugin: AlignPlugin
  let stage: StageInterface

  beforeEach(() => {
    plugin = new AlignPlugin()
    stage = makeStage()
    plugin.install(stage)
  })

  // --- lifecycle -----------------------------------------------------------

  it('installs without throwing', () => {
    const s = makeStage()
    expect(() => new AlignPlugin().install(s)).not.toThrow()
  })

  it('exposes align controller after install', () => {
    expect((stage as unknown as AlignPluginAPI).align).toBeDefined()
  })

  it('uninstalls cleanly — removes align from stage', () => {
    plugin.uninstall(stage)
    expect((stage as unknown as Partial<AlignPluginAPI>).align).toBeUndefined()
  })

  it('install → uninstall → re-install works correctly', () => {
    plugin.uninstall(stage)
    const stage2 = makeStage()
    expect(() => plugin.install(stage2)).not.toThrow()
    expect((stage2 as unknown as AlignPluginAPI).align).toBeDefined()
    plugin.uninstall(stage2)
    expect((stage2 as unknown as Partial<AlignPluginAPI>).align).toBeUndefined()
  })

  // --- align.left ----------------------------------------------------------

  describe('align.left', () => {
    it('aligns all objects to the leftmost edge of the selection', () => {
      const a = makeRect(50, 10, 80, 40)
      const b = makeRect(200, 30, 60, 40)
      const { align } = stage as unknown as AlignPluginAPI
      align.left([a, b])
      // leftmost is a at x=50; b should move to x=50
      expect(b.x).toBe(50)
      expect(a.x).toBe(50) // unchanged
    })

    it('aligns to stage when relativeTo="stage"', () => {
      const a = makeRect(100, 50, 80, 40)
      const { align } = stage as unknown as AlignPluginAPI
      align.left([a], { relativeTo: 'stage' })
      expect(a.x).toBe(0)
    })

    it('aligns to first object when relativeTo="first"', () => {
      const a = makeRect(300, 0, 50, 50)
      const b = makeRect(100, 0, 50, 50)
      const { align } = stage as unknown as AlignPluginAPI
      align.left([a, b], { relativeTo: 'first' })
      // anchor is a (first), so b moves to x=300
      expect(b.x).toBe(300)
    })

    it('aligns to a specific BaseObject anchor', () => {
      const anchor = makeRect(70, 0, 50, 50)
      const a = makeRect(200, 0, 50, 50)
      const { align } = stage as unknown as AlignPluginAPI
      align.left([a], { relativeTo: anchor })
      expect(a.x).toBe(70)
    })

    it('does nothing for empty array', () => {
      expect(() => (stage as unknown as AlignPluginAPI).align.left([])).not.toThrow()
    })
  })

  // --- align.right ---------------------------------------------------------

  describe('align.right', () => {
    it('aligns all objects so their right edges match the selection right edge', () => {
      const a = makeRect(0, 0, 100, 50)   // right = 100
      const b = makeRect(0, 60, 60, 50)   // right = 60
      const { align } = stage as unknown as AlignPluginAPI
      align.right([a, b])
      // selection right = max(100, 60) = 100; b.right should become 100 → b.x = 40
      expect(b.x).toBeCloseTo(40)
      expect(a.x).toBeCloseTo(0)
    })
  })

  // --- align.centerHorizontal ----------------------------------------------

  describe('align.centerHorizontal', () => {
    it('centers objects on the horizontal axis of the selection', () => {
      const a = makeRect(0, 0, 100, 50)   // cx = 50
      const b = makeRect(200, 60, 100, 50) // cx = 250
      const { align } = stage as unknown as AlignPluginAPI
      align.centerHorizontal([a, b])
      // selection: x=0, width=300, cx=150
      expect(a.x).toBeCloseTo(100)  // 150 - 100/2 = 100
      expect(b.x).toBeCloseTo(100)
    })
  })

  // --- align.top -----------------------------------------------------------

  describe('align.top', () => {
    it('aligns all objects to the topmost edge of the selection', () => {
      const a = makeRect(0, 20, 50, 50)
      const b = makeRect(0, 80, 50, 50)
      const { align } = stage as unknown as AlignPluginAPI
      align.top([a, b])
      expect(a.y).toBe(20)
      expect(b.y).toBe(20)
    })

    it('aligns to stage top when relativeTo="stage"', () => {
      const a = makeRect(0, 100, 50, 50)
      const { align } = stage as unknown as AlignPluginAPI
      align.top([a], { relativeTo: 'stage' })
      expect(a.y).toBe(0)
    })
  })

  // --- align.bottom --------------------------------------------------------

  describe('align.bottom', () => {
    it('aligns all objects so their bottom edges match the selection bottom', () => {
      const a = makeRect(0, 0, 50, 100)  // bottom = 100
      const b = makeRect(60, 0, 50, 60)  // bottom = 60
      const { align } = stage as unknown as AlignPluginAPI
      align.bottom([a, b])
      // selection bottom = 100; b.y should become 40
      expect(b.y).toBeCloseTo(40)
      expect(a.y).toBe(0)
    })
  })

  // --- align.centerVertical ------------------------------------------------

  describe('align.centerVertical', () => {
    it('centers objects on the vertical axis of the selection', () => {
      const a = makeRect(0, 0, 50, 100)   // cy = 50
      const b = makeRect(60, 200, 50, 100) // cy = 250
      const { align } = stage as unknown as AlignPluginAPI
      align.centerVertical([a, b])
      // selection: y=0, height=300, cy=150
      expect(a.y).toBeCloseTo(100)  // 150 - 50 = 100
      expect(b.y).toBeCloseTo(100)
    })
  })

  // --- align.distributeHorizontally ----------------------------------------

  describe('distributeHorizontally', () => {
    it('does nothing for fewer than 3 objects', () => {
      const a = makeRect(0, 0, 50, 50)
      const b = makeRect(200, 0, 50, 50)
      const origBX = b.x
      const { align } = stage as unknown as AlignPluginAPI
      align.distributeHorizontally([a, b])
      expect(b.x).toBe(origBX)
    })

    it('spaces 3 objects evenly along the horizontal axis', () => {
      // a: 0..50, b: 200..250, c: 300..350
      const a = makeRect(0, 0, 50, 50)
      const b = makeRect(200, 0, 50, 50)
      const c = makeRect(300, 0, 50, 50)
      const { align } = stage as unknown as AlignPluginAPI
      align.distributeHorizontally([a, b, c])
      // outer bounds: 0 to 350, total width = 150, gap = (350-150)/2 = 100
      // b should start at 50 + 100 = 150
      expect(b.x).toBeCloseTo(150)
      expect(a.x).toBe(0)   // unchanged
      expect(c.x).toBe(300) // unchanged
    })

    it('does nothing for empty array', () => {
      expect(() => (stage as unknown as AlignPluginAPI).align.distributeHorizontally([])).not.toThrow()
    })
  })

  // --- align.distributeVertically ------------------------------------------

  describe('distributeVertically', () => {
    it('spaces 3 objects evenly along the vertical axis', () => {
      // a: 0..50, b: 200..250, c: 300..350
      const a = makeRect(0, 0, 50, 50)
      const b = makeRect(0, 200, 50, 50)
      const c = makeRect(0, 300, 50, 50)
      const { align } = stage as unknown as AlignPluginAPI
      align.distributeVertically([a, b, c])
      // outer bounds: 0 to 350, total height = 150, gap = 100
      // b should start at 150
      expect(b.y).toBeCloseTo(150)
      expect(a.y).toBe(0)
      expect(c.y).toBe(300)
    })
  })
})
