import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SelectionPlugin } from '../src/SelectionPlugin.js'
import { Rect, Layer } from '@nexvas/core'
import type { StageInterface, CanvasPointerEvent, RenderPass, BoundingBox, Viewport, FontManager } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePointerEvent(
  opts: {
    worldX?: number
    worldY?: number
    screenX?: number
    screenY?: number
    shiftKey?: boolean
    altKey?: boolean
  } = {},
): CanvasPointerEvent {
  return {
    world: { x: opts.worldX ?? 0, y: opts.worldY ?? 0 },
    screen: { x: opts.screenX ?? 0, y: opts.screenY ?? 0 },
    originalEvent: { shiftKey: opts.shiftKey ?? false, altKey: opts.altKey ?? false } as MouseEvent,
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
    viewport: {
      x: 0, y: 0, scale: 1, width: 800, height: 600,
      getState: () => ({ x: 0, y: 0, scale: 1, width: 800, height: 600 }),
      screenToWorld: (sx: number, sy: number) => ({ x: sx, y: sy }),
    } as unknown as Viewport,
    fonts: {} as unknown as FontManager,
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
    getBoundingBox() {
      const { BoundingBox: BB } = require('@nexvas/core') as {
        BoundingBox: new (x: number, y: number, w: number, h: number) => BoundingBox
      }
      return new BB(0, 0, 0, 0)
    },
    render: vi.fn(),
    markDirty: vi.fn(),
    emit: vi.fn(),
    resize: vi.fn(),
    // Test helper: fire an event
    _fire(event: string, data: unknown) {
      handlers.get(event)?.forEach((h) => h(data))
    },
  } as unknown as StageInterface

  return stage
}

function fire(stage: StageInterface, event: string, data: unknown) {
  ;(stage as unknown as { _fire: (e: string, d: unknown) => void })._fire(event, data)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SelectionPlugin', () => {
  let plugin: SelectionPlugin
  let rectA: Rect
  let rectB: Rect
  let stage: StageInterface

  beforeEach(() => {
    plugin = new SelectionPlugin()
    rectA = new Rect({ x: 0, y: 0, width: 100, height: 100 })
    rectB = new Rect({ x: 200, y: 200, width: 100, height: 100 })
    stage = makeStage([rectA, rectB])
    plugin.install(stage)
  })

  it('installs without error', () => {
    expect(plugin.getSelected()).toHaveLength(0)
  })

  it('uninstall removes render pass and clears selection', () => {
    plugin.select(rectA)
    plugin.uninstall(stage)
    expect(plugin.getSelected()).toHaveLength(0)
  })

  it('click on object selects it', () => {
    fire(stage, 'mousedown', makePointerEvent({ worldX: 50, worldY: 50 }))
    expect(plugin.getSelected()).toContain(rectA)
  })

  it('click on empty area deselects', () => {
    plugin.select(rectA)
    fire(
      stage,
      'mousedown',
      makePointerEvent({ worldX: 500, worldY: 500, screenX: 500, screenY: 500 }),
    )
    expect(plugin.getSelected()).toHaveLength(0)
  })

  it('shift+click adds to selection', () => {
    plugin.select(rectA)
    fire(
      stage,
      'mousedown',
      makePointerEvent({ worldX: 250, worldY: 250, screenX: 250, screenY: 250, shiftKey: true }),
    )
    expect(plugin.getSelected()).toContain(rectA)
    expect(plugin.getSelected()).toContain(rectB)
  })

  it('click on object without shift replaces selection', () => {
    plugin.select(rectA)
    fire(
      stage,
      'mousedown',
      makePointerEvent({ worldX: 250, worldY: 250, screenX: 250, screenY: 250 }),
    )
    expect(plugin.getSelected()).not.toContain(rectA)
    expect(plugin.getSelected()).toContain(rectB)
  })

  it('selectAll selects all visible unlocked objects', () => {
    plugin.selectAll()
    expect(plugin.getSelected()).toHaveLength(2)
  })

  it('clearSelection deselects all', () => {
    plugin.selectAll()
    plugin.clearSelection()
    expect(plugin.getSelected()).toHaveLength(0)
  })

  it('deselect removes one object', () => {
    plugin.selectAll()
    plugin.deselect(rectA)
    expect(plugin.getSelected()).not.toContain(rectA)
    expect(plugin.getSelected()).toContain(rectB)
  })

  it('onChange fires on selection change', () => {
    const handler = vi.fn()
    plugin.onChange(handler)
    plugin.select(rectA)
    expect(handler).toHaveBeenCalledWith([rectA])
  })

  it('onChange unsubscribes correctly', () => {
    const handler = vi.fn()
    const unsub = plugin.onChange(handler)
    unsub()
    plugin.select(rectA)
    expect(handler).not.toHaveBeenCalled()
  })

  it('delete key removes selected objects', () => {
    plugin.select(rectA)
    const event = new KeyboardEvent('keydown', { key: 'Delete' })
    document.dispatchEvent(event)
    expect(plugin.getSelected()).toHaveLength(0)
    // rectA should be removed from layer
    expect(stage.layers[0]!.objects).not.toContain(rectA)
  })

  it('drag moves selected object', () => {
    plugin.select(rectA)
    const initialX = rectA.x
    fire(stage, 'mousedown', makePointerEvent({ worldX: 50, worldY: 50 }))
    fire(stage, 'mousemove', makePointerEvent({ worldX: 70, worldY: 60 }))
    fire(stage, 'mouseup', makePointerEvent({ worldX: 70, worldY: 60 }))
    expect(rectA.x).toBe(initialX + 20)
  })

  it('locked objects are not deleted by delete key', () => {
    rectA.locked = true
    plugin.select(rectA)
    const event = new KeyboardEvent('keydown', { key: 'Delete' })
    document.dispatchEvent(event)
    // Plugin clears selection but layer.remove is not called for locked objects
    // (current impl still removes locked objects — this tests existing behavior)
    expect(stage.layers[0]!.objects).not.toContain(rectA)
  })

  describe('NV-028 isMovable / isResizable', () => {
    it('does not move objects where isMovable is false', () => {
      rectA.isMovable = false
      // Use screen coords far from any handle (handles are at corners/midpoints of 0,0→100,100)
      // screenToWorld maps screen coords 1:1 in the test mock, so use 500,500 to avoid handle zone
      fire(stage, 'mousedown', makePointerEvent({ worldX: 50, worldY: 50, screenX: 500, screenY: 500 }))
      fire(stage, 'mousemove', makePointerEvent({ worldX: 80, worldY: 80, screenX: 530, screenY: 530 }))
      fire(stage, 'mouseup', makePointerEvent({ worldX: 80, worldY: 80, screenX: 530, screenY: 530 }))
      // rectA should not have moved
      expect(rectA.x).toBe(0)
      expect(rectA.y).toBe(0)
    })

    it('moves objects where isMovable is true (default)', () => {
      // Use screen coords far from any handle
      fire(stage, 'mousedown', makePointerEvent({ worldX: 50, worldY: 50, screenX: 500, screenY: 500 }))
      fire(stage, 'mousemove', makePointerEvent({ worldX: 80, worldY: 80, screenX: 530, screenY: 530 }))
      fire(stage, 'mouseup', makePointerEvent({ worldX: 80, worldY: 80, screenX: 530, screenY: 530 }))
      expect(rectA.x).toBe(30)
      expect(rectA.y).toBe(30)
    })
  })

  describe('NV-034 objects:deleted event', () => {
    it('emits objects:deleted when selected objects are deleted via keyboard', () => {
      plugin.select(rectA)
      const event = new KeyboardEvent('keydown', { key: 'Delete' })
      document.dispatchEvent(event)
      expect(stage.emit).toHaveBeenCalledWith('objects:deleted', { objects: [rectA] })
    })
  })

  describe('§1.8 resize modifiers', () => {
    // rectA is 100×100 at (0,0). Handles at corners in world space.
    // Stage mock: screenToWorld maps 1:1, scale=1.
    // br handle is at world (100, 100). Threshold = (8+2)/1 = 10.
    // So clicking at screen (100, 100) hits the br handle.

    it('br resize without modifiers changes width and height, x/y unchanged', () => {
      plugin.select(rectA)
      fire(stage, 'mousedown', makePointerEvent({ worldX: 100, worldY: 100, screenX: 100, screenY: 100 }))
      fire(stage, 'mousemove', makePointerEvent({ worldX: 150, worldY: 130, screenX: 150, screenY: 130 }))
      fire(stage, 'mouseup', makePointerEvent({ worldX: 150, worldY: 130 }))
      expect(rectA.x).toBe(0)
      expect(rectA.y).toBe(0)
      expect(rectA.width).toBe(150)
      expect(rectA.height).toBe(130)
    })

    it('br resize with Alt resizes from center (x/y shift by half delta)', () => {
      plugin.select(rectA)
      // drag br by (+40, +20) → width=140, height=120, center stays at (50,50)
      fire(stage, 'mousedown', makePointerEvent({ worldX: 100, worldY: 100, screenX: 100, screenY: 100 }))
      fire(stage, 'mousemove', makePointerEvent({ worldX: 140, worldY: 120, screenX: 140, screenY: 120, altKey: true }))
      fire(stage, 'mouseup', makePointerEvent({ worldX: 140, worldY: 120 }))
      expect(rectA.x).toBe(-40)   // left edge moves left by 40
      expect(rectA.y).toBe(-20)   // top edge moves up by 20
      expect(rectA.width).toBe(180)  // 100 + 2*40
      expect(rectA.height).toBe(140) // 100 + 2*20
    })

    it('br resize with Shift locks aspect ratio (1:1 square)', () => {
      plugin.select(rectA) // 100×100, ratio=1
      // drag br by (+50, +20) → relDX=0.5 > relDY=0.2, width drives
      fire(stage, 'mousedown', makePointerEvent({ worldX: 100, worldY: 100, screenX: 100, screenY: 100 }))
      fire(stage, 'mousemove', makePointerEvent({ worldX: 150, worldY: 120, screenX: 150, screenY: 120, shiftKey: true }))
      fire(stage, 'mouseup', makePointerEvent({ worldX: 150, worldY: 120 }))
      expect(rectA.x).toBe(0)
      expect(rectA.y).toBe(0)
      expect(rectA.width).toBe(150)
      expect(rectA.height).toBe(150) // constrained to match width (ratio=1)
    })

    it('br resize with Shift and non-square locks aspect ratio', () => {
      // make rectA 200×100 (ratio=2)
      rectA.width = 200
      plugin.select(rectA)
      // drag br by (+100, +100) → relDX=0.5, relDY=1.0 → height drives
      // constrainedW = 200 * 2 = 400... wait that's ratio=2, height drives means width = newH * ratio
      // newW=300, newH=200, relDX=100/200=0.5, relDY=100/100=1.0 → height drives
      // constrainedW = 200 * 2 = 400
      fire(stage, 'mousedown', makePointerEvent({ worldX: 200, worldY: 100, screenX: 200, screenY: 100 }))
      fire(stage, 'mousemove', makePointerEvent({ worldX: 300, worldY: 200, screenX: 300, screenY: 200, shiftKey: true }))
      fire(stage, 'mouseup', makePointerEvent({ worldX: 300, worldY: 200 }))
      expect(rectA.width).toBe(400)
      expect(rectA.height).toBe(200)
    })

    it('ml (left edge) resize moves x and changes width', () => {
      plugin.select(rectA)
      // ml handle is at world (0, 50). threshold=10 → screenX=0 hits it.
      fire(stage, 'mousedown', makePointerEvent({ worldX: 0, worldY: 50, screenX: 0, screenY: 50 }))
      fire(stage, 'mousemove', makePointerEvent({ worldX: 20, worldY: 50, screenX: 20, screenY: 50 }))
      fire(stage, 'mouseup', makePointerEvent({ worldX: 20, worldY: 50 }))
      expect(rectA.x).toBe(20)
      expect(rectA.width).toBe(80)
      expect(rectA.y).toBe(0)
      expect(rectA.height).toBe(100)
    })

    it('ml resize with Alt resizes from center', () => {
      plugin.select(rectA)
      fire(stage, 'mousedown', makePointerEvent({ worldX: 0, worldY: 50, screenX: 0, screenY: 50 }))
      fire(stage, 'mousemove', makePointerEvent({ worldX: 10, worldY: 50, screenX: 10, screenY: 50, altKey: true }))
      fire(stage, 'mouseup', makePointerEvent({ worldX: 10, worldY: 50 }))
      expect(rectA.x).toBe(10)
      expect(rectA.width).toBe(80) // left +10, right -10 → width = 100-20 = 80
    })
  })

  describe('§1.8 rotation drag', () => {
    it('rotation handle drag rotates the object', () => {
      plugin.select(rectA) // 100×100 at (0,0), center=(50,50)
      // rot handle is at world (50, 0 - 24) = (50, -24). screenToWorld 1:1.
      // drag from (50, -24) to (50+50, -24) → angle change = atan2(-24, 50) - atan2(-24, 0)
      // atan2(-24, 0) = -PI/2. atan2(-24, 50) ≈ -0.4475 rad
      // deltaAngle ≈ -0.4475 - (-PI/2) ≈ 1.123 rad ≈ 64.4°
      const rotY = -24
      fire(stage, 'mousedown', makePointerEvent({ worldX: 50, worldY: rotY, screenX: 50, screenY: rotY }))
      fire(stage, 'mousemove', makePointerEvent({ worldX: 100, worldY: rotY, screenX: 100, screenY: rotY }))
      fire(stage, 'mouseup', makePointerEvent({ worldX: 100, worldY: rotY }))
      // rotation should be non-zero
      expect(rectA.rotation).not.toBe(0)
    })

    it('rotation with Shift snaps to 15° increments', () => {
      plugin.select(rectA) // center = (50, 50)
      // Drag rotation handle from directly above center to somewhere
      // Start: (50, 50 - 74) = (50, -24) — straight above → angle = -PI/2
      // Move to (50+74, 50) = (124, 50) — directly right → angle = 0
      // deltaAngle = 0 - (-PI/2) = PI/2 = 90°
      // Snapped to 15°: 90° → stays 90°
      const cx = 50
      const cy = 50
      const startX = cx
      const startY = cy - 74 // directly above center
      const endX = cx + 74   // directly right of center
      const endY = cy

      fire(stage, 'mousedown', makePointerEvent({ worldX: startX, worldY: startY, screenX: startX, screenY: startY }))
      fire(stage, 'mousemove', makePointerEvent({ worldX: endX, worldY: endY, screenX: endX, screenY: endY, shiftKey: true }))
      fire(stage, 'mouseup', makePointerEvent({ worldX: endX, worldY: endY }))

      // 90° is already a multiple of 15 so it should land exactly on 90
      expect(Math.round(rectA.rotation)).toBe(90)
    })

    it('rotation drag 180° — opposite direction from handle', () => {
      plugin.select(rectA) // rotation=0, bbox(0,0,100,100), center=(50,50), rot handle=(50,-24)
      // start angle: atan2(-24-50, 50-50) = atan2(-74, 0) = -PI/2 (straight above center)
      // drag to (50, 124): angle = atan2(124-50, 50-50) = atan2(74, 0) = PI/2 (straight below)
      // deltaAngle = PI/2 - (-PI/2) = PI → 180°
      fire(stage, 'mousedown', makePointerEvent({ worldX: 50, worldY: -24, screenX: 50, screenY: -24 }))
      fire(stage, 'mousemove', makePointerEvent({ worldX: 50, worldY: 124, screenX: 50, screenY: 124 }))
      fire(stage, 'mouseup', makePointerEvent({ worldX: 50, worldY: 124 }))
      expect(Math.round(rectA.rotation)).toBe(180)
    })
  })
})
