import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DragPlugin } from '../src/DragPlugin.js'
import { Rect, Layer } from '@nexvas/core'
import type { StageInterface, CanvasPointerEvent, RenderPass, BoundingBox } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePointerEvent(
  opts: {
    worldX?: number
    worldY?: number
    screenX?: number
    screenY?: number
  } = {},
): CanvasPointerEvent {
  return {
    world: { x: opts.worldX ?? 0, y: opts.worldY ?? 0 },
    screen: { x: opts.screenX ?? opts.worldX ?? 0, y: opts.screenY ?? opts.worldY ?? 0 },
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
    getBoundingBox() {
      const { BoundingBox: BB } = require('@nexvas/core') as {
        BoundingBox: new (x: number, y: number, w: number, h: number) => BoundingBox
      }
      return new BB(0, 0, 800, 600)
    },
    render: vi.fn(),
    markDirty: vi.fn(),
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

describe('DragPlugin', () => {
  let plugin: DragPlugin
  let rect: Rect
  let stage: StageInterface

  beforeEach(() => {
    plugin = new DragPlugin()
    rect = new Rect({ x: 0, y: 0, width: 100, height: 100 })
    stage = makeStage([rect])
    plugin.install(stage)
  })

  it('installs and uninstalls without error', () => {
    expect(plugin.isDragging()).toBe(false)
    plugin.uninstall(stage)
    expect(plugin.isDragging()).toBe(false)
  })

  it('isDragging is false before mousedown', () => {
    expect(plugin.isDragging()).toBe(false)
  })

  it('drag moves object by delta', () => {
    const initialX = rect.x

    fire(stage, 'mousedown', makePointerEvent({ worldX: 50, worldY: 50 }))
    fire(stage, 'mousemove', makePointerEvent({ worldX: 80, worldY: 70 }))
    fire(stage, 'mouseup', makePointerEvent({ worldX: 80, worldY: 70 }))

    expect(rect.x).toBe(initialX + 30)
    expect(rect.y).toBe(20)
  })

  it('mousedown on empty area does not start drag', () => {
    fire(stage, 'mousedown', makePointerEvent({ worldX: 500, worldY: 500 }))
    expect(plugin.isDragging()).toBe(false)
  })

  it('isDragging is true while dragging', () => {
    fire(stage, 'mousedown', makePointerEvent({ worldX: 50, worldY: 50 }))
    expect(plugin.isDragging()).toBe(true)
    fire(stage, 'mouseup', makePointerEvent({ worldX: 50, worldY: 50 }))
    expect(plugin.isDragging()).toBe(false)
  })

  it('locked objects are not dragged', () => {
    rect.locked = true
    fire(stage, 'mousedown', makePointerEvent({ worldX: 50, worldY: 50 }))
    // DragPlugin skips locked objects in hit test
    expect(plugin.isDragging()).toBe(false)
  })

  it('calls onDragStart and onDragEnd callbacks', () => {
    const onDragStart = vi.fn()
    const onDragEnd = vi.fn()
    const pluginWithCallbacks = new DragPlugin({ onDragStart, onDragEnd })
    pluginWithCallbacks.install(stage)

    fire(stage, 'mousedown', makePointerEvent({ worldX: 50, worldY: 50 }))
    expect(onDragStart).toHaveBeenCalledOnce()

    fire(stage, 'mouseup', makePointerEvent({ worldX: 60, worldY: 60 }))
    expect(onDragEnd).toHaveBeenCalledOnce()

    pluginWithCallbacks.uninstall(stage)
  })

  it('calls onDrag callback with delta', () => {
    const onDrag = vi.fn()
    const pluginWithCallback = new DragPlugin({ onDrag })
    pluginWithCallback.install(stage)

    fire(stage, 'mousedown', makePointerEvent({ worldX: 50, worldY: 50 }))
    fire(stage, 'mousemove', makePointerEvent({ worldX: 60, worldY: 55 }))

    expect(onDrag).toHaveBeenCalledWith(expect.arrayContaining([rect]), 10, 5, expect.anything())

    pluginWithCallback.uninstall(stage)
  })

  it('constrainToStage clamps position', () => {
    const bigRect = new Rect({ x: 0, y: 0, width: 200, height: 200 })
    const stageConstrained = makeStage([bigRect])
    const constrained = new DragPlugin({ constrainToStage: true })
    constrained.install(stageConstrained)

    fire(stageConstrained, 'mousedown', makePointerEvent({ worldX: 100, worldY: 100 }))
    // Try to drag way past the stage right edge (800x600 stage, 200 wide rect → max x = 600)
    fire(stageConstrained, 'mousemove', makePointerEvent({ worldX: 1000, worldY: 100 }))

    expect(bigRect.x).toBeLessThanOrEqual(600)

    constrained.uninstall(stageConstrained)
  })

  it('uninstall stops responding to events', () => {
    plugin.uninstall(stage)
    const initialX = rect.x

    fire(stage, 'mousedown', makePointerEvent({ worldX: 50, worldY: 50 }))
    fire(stage, 'mousemove', makePointerEvent({ worldX: 80, worldY: 80 }))
    fire(stage, 'mouseup', makePointerEvent({ worldX: 80, worldY: 80 }))

    expect(rect.x).toBe(initialX)
  })
})
