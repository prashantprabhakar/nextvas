import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TextEditPlugin, type CustomEditOptions, type TextEditPluginAPI } from '../src/TextEditPlugin.js'
import { Text } from '@nexvas/core'
import type { StageInterface, Viewport, FontManager, BaseObject, Layer, CanvasPointerEvent } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StageEventHandler = (data: unknown) => void

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 800
  c.height = 600
  // jsdom getBoundingClientRect returns zeros by default
  vi.spyOn(c, 'getBoundingClientRect').mockReturnValue({
    left: 10, top: 20, right: 810, bottom: 620,
    width: 800, height: 600, x: 10, y: 20,
    toJSON: () => ({}),
  })
  return c
}

function makeViewport(): Viewport {
  return {
    x: 0,
    y: 0,
    scale: 1,
    worldToScreen: (wx: number, wy: number) => ({ x: wx, y: wy }),
    screenToWorld: (sx: number, sy: number) => ({ x: sx, y: sy }),
    getState: () => ({ x: 0, y: 0, scale: 1, width: 800, height: 600 }),
  } as unknown as Viewport
}

function makeStage(overrides: { hitResult?: BaseObject | null } = {}): StageInterface & {
  _handlers: Record<string, StageEventHandler[]>
  _batchCalls: number
} {
  const handlers: Record<string, StageEventHandler[]> = {}
  let batchCalls = 0

  const layer: Layer = {
    hitTest: vi.fn(() => overrides.hitResult ?? null),
  } as unknown as Layer

  return {
    id: 'test-stage',
    canvasKit: {},
    canvas: makeCanvas(),
    layers: [layer],
    viewport: makeViewport(),
    fonts: {} as unknown as FontManager,
    on: vi.fn((event: string, handler: StageEventHandler) => {
      ;(handlers[event] ??= []).push(handler)
    }),
    off: vi.fn((event: string, handler: StageEventHandler) => {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== handler)
    }),
    addRenderPass: vi.fn(),
    removeRenderPass: vi.fn(),
    getBoundingBox: vi.fn(),
    render: vi.fn(),
    markDirty: vi.fn(),
    emit: vi.fn((event: string, data: unknown) => {
      for (const h of handlers[event] ?? []) h(data)
    }),
    resize: vi.fn(),
    batch: vi.fn((fn: () => void) => {
      batchCalls++
      fn()
    }),
    find: vi.fn(),
    findByType: vi.fn(),
    getObjectById: vi.fn(),
    registerObject: vi.fn(),
    getObjectLayer: vi.fn(),
    bringToFront: vi.fn(),
    sendToBack: vi.fn(),
    bringForward: vi.fn(),
    sendBackward: vi.fn(),
    groupObjects: vi.fn(),
    ungroupObject: vi.fn(),
    _handlers: handlers,
    get _batchCalls() { return batchCalls },
  } as unknown as StageInterface & { _handlers: Record<string, StageEventHandler[]>; _batchCalls: number }
}

function makeDblClickEvent(worldX = 0, worldY = 0): CanvasPointerEvent {
  return {
    world: { x: worldX, y: worldY },
    screen: { x: worldX, y: worldY },
    originalEvent: new MouseEvent('dblclick'),
    stopped: false,
    stopPropagation() { this.stopped = true },
  }
}

function makeTextObject(props: Partial<{ x: number; y: number; width: number; height: number; text: string }> = {}): Text {
  const t = new Text({
    x: props.x ?? 10,
    y: props.y ?? 20,
    width: props.width ?? 100,
    height: props.height ?? 30,
    text: props.text ?? 'Hello',
    fontSize: 16,
  })
  return t
}

function makeCustomOpts(overrides: Partial<CustomEditOptions> = {}): CustomEditOptions & {
  commitCalls: string[]
  cancelCalled: boolean
} {
  const commitCalls: string[] = []
  let cancelCalled = false
  return {
    getText: () => 'custom text',
    onCommit: vi.fn((t: string) => { commitCalls.push(t) }) as unknown as (t: string) => void,
    onCancel: vi.fn(() => { cancelCalled = true }),
    style: { x: 5, y: 10, width: 120, height: 40, fontSize: 14, fontFamily: 'Arial', color: '#333', align: 'left' },
    commitCalls,
    get cancelCalled() { return cancelCalled },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TextEditPlugin', () => {
  let plugin: TextEditPlugin
  let stage: ReturnType<typeof makeStage>

  beforeEach(() => {
    plugin = new TextEditPlugin()
    stage = makeStage()
    plugin.install(stage)
  })

  afterEach(() => {
    plugin.uninstall(stage)
  })

  // -------------------------------------------------------------------------
  // Install / uninstall
  // -------------------------------------------------------------------------

  it('installs textEdit accessor on stage', () => {
    expect((stage as unknown as TextEditPluginAPI).textEdit).toBe(plugin)
  })

  it('registers dblclick handler on install', () => {
    expect(stage.on).toHaveBeenCalledWith('dblclick', expect.any(Function))
  })

  it('deregisters dblclick handler on uninstall', () => {
    plugin.uninstall(stage)
    expect(stage.off).toHaveBeenCalledWith('dblclick', expect.any(Function))
    // Re-install for afterEach cleanup
    plugin.install(stage)
  })

  // -------------------------------------------------------------------------
  // isEditing()
  // -------------------------------------------------------------------------

  it('isEditing() returns false before any edit', () => {
    expect(plugin.isEditing()).toBe(false)
  })

  it('isEditing() returns true while Text edit is active', () => {
    const text = makeTextObject()
    plugin.startEditing(text)
    expect(plugin.isEditing()).toBe(true)
  })

  it('isEditing() returns true while custom edit is active', () => {
    const obj = makeTextObject()
    const opts = makeCustomOpts()
    plugin.startEditing(obj, opts)
    expect(plugin.isEditing()).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Text object — startEditing
  // -------------------------------------------------------------------------

  it('hides Text object and marks dirty on startEditing', () => {
    const text = makeTextObject({ text: 'Hi' })
    plugin.startEditing(text)
    expect(text.visible).toBe(false)
    expect(stage.markDirty).toHaveBeenCalled()
  })

  it('fires textedit:start with the Text object', () => {
    const text = makeTextObject()
    plugin.startEditing(text)
    expect(stage.emit).toHaveBeenCalledWith('textedit:start', { object: text })
  })

  it('creates a textarea in the DOM when editing a Text object', () => {
    const text = makeTextObject({ text: 'world' })
    plugin.startEditing(text)
    const ta = document.querySelector('textarea')
    expect(ta).not.toBeNull()
    expect(ta!.value).toBe('world')
  })

  // -------------------------------------------------------------------------
  // Text object — commit
  // -------------------------------------------------------------------------

  it('commit via stopEditing() restores visibility and updates text', () => {
    const text = makeTextObject({ text: 'old' })
    plugin.startEditing(text)

    const ta = document.querySelector('textarea')!
    ta.value = 'new text'
    plugin.stopEditing()

    expect(text.visible).toBe(true)
    expect(text.text).toBe('new text')
    expect(plugin.isEditing()).toBe(false)
  })

  it('commit wraps Text mutation in stage.batch()', () => {
    const text = makeTextObject()
    plugin.startEditing(text)
    plugin.stopEditing()
    expect(stage.batch).toHaveBeenCalledOnce()
  })

  it('fires textedit:commit with oldText and newText for Text object', () => {
    const text = makeTextObject({ text: 'original' })
    plugin.startEditing(text)
    const ta = document.querySelector('textarea')!
    ta.value = 'updated'
    plugin.stopEditing()

    expect(stage.emit).toHaveBeenCalledWith('textedit:commit', {
      object: text,
      oldText: 'original',
      newText: 'updated',
    })
  })

  it('removes textarea from DOM after commit', () => {
    const text = makeTextObject()
    plugin.startEditing(text)
    expect(document.querySelector('textarea')).not.toBeNull()
    plugin.stopEditing()
    expect(document.querySelector('textarea')).toBeNull()
  })

  // -------------------------------------------------------------------------
  // Text object — cancel
  // -------------------------------------------------------------------------

  it('cancel via cancelEditing() restores visibility, does not update text', () => {
    const text = makeTextObject({ text: 'original' })
    plugin.startEditing(text)
    const ta = document.querySelector('textarea')!
    ta.value = 'changed'
    plugin.cancelEditing()

    expect(text.visible).toBe(true)
    expect(text.text).toBe('original')
    expect(plugin.isEditing()).toBe(false)
  })

  it('cancel does not call stage.batch()', () => {
    const text = makeTextObject()
    plugin.startEditing(text)
    vi.mocked(stage.batch).mockClear()
    plugin.cancelEditing()
    expect(stage.batch).not.toHaveBeenCalled()
  })

  it('fires textedit:cancel for Text object', () => {
    const text = makeTextObject()
    plugin.startEditing(text)
    plugin.cancelEditing()
    expect(stage.emit).toHaveBeenCalledWith('textedit:cancel', { object: text })
  })

  it('removes textarea from DOM after cancel', () => {
    const text = makeTextObject()
    plugin.startEditing(text)
    plugin.cancelEditing()
    expect(document.querySelector('textarea')).toBeNull()
  })

  // -------------------------------------------------------------------------
  // Keyboard — Enter commits, Escape cancels
  // -------------------------------------------------------------------------

  it('Enter key in textarea commits the edit', () => {
    const text = makeTextObject({ text: 'before' })
    plugin.startEditing(text)
    const ta = document.querySelector('textarea')!
    ta.value = 'after'
    ta.dispatchEvent(Object.assign(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    expect(text.text).toBe('after')
    expect(plugin.isEditing()).toBe(false)
  })

  it('Shift+Enter does NOT commit (allows newline)', () => {
    const text = makeTextObject()
    plugin.startEditing(text)
    document.querySelector('textarea')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }),
    )
    expect(plugin.isEditing()).toBe(true)
  })

  it('Escape key in textarea cancels the edit', () => {
    const text = makeTextObject({ text: 'orig' })
    plugin.startEditing(text)
    const ta = document.querySelector('textarea')!
    ta.value = 'changed'
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(text.text).toBe('orig')
    expect(plugin.isEditing()).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Custom object — startEditing
  // -------------------------------------------------------------------------

  it('hides custom object and marks dirty on startEditing', () => {
    const obj = makeTextObject()
    const opts = makeCustomOpts()
    plugin.startEditing(obj, opts)
    expect(obj.visible).toBe(false)
    expect(stage.markDirty).toHaveBeenCalled()
  })

  it('fires textedit:start with custom object', () => {
    const obj = makeTextObject()
    const opts = makeCustomOpts()
    plugin.startEditing(obj, opts)
    expect(stage.emit).toHaveBeenCalledWith('textedit:start', { object: obj })
  })

  it('pre-fills textarea with getText() result', () => {
    const obj = makeTextObject()
    const opts = makeCustomOpts()
    plugin.startEditing(obj, opts)
    expect(document.querySelector('textarea')!.value).toBe('custom text')
  })

  it('isEditing() returns true during custom edit', () => {
    const obj = makeTextObject()
    plugin.startEditing(obj, makeCustomOpts())
    expect(plugin.isEditing()).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Custom object — commit
  // -------------------------------------------------------------------------

  it('commit calls onCommit wrapped in stage.batch()', () => {
    const obj = makeTextObject()
    const opts = makeCustomOpts()
    plugin.startEditing(obj, opts)
    const ta = document.querySelector('textarea')!
    ta.value = 'committed'
    plugin.stopEditing()

    expect(stage.batch).toHaveBeenCalledOnce()
    expect(opts.onCommit).toHaveBeenCalledWith('committed')
  })

  it('commit restores custom object visibility', () => {
    const obj = makeTextObject()
    plugin.startEditing(obj, makeCustomOpts())
    plugin.stopEditing()
    expect(obj.visible).toBe(true)
    expect(plugin.isEditing()).toBe(false)
  })

  it('fires textedit:commit with oldText and newText for custom object', () => {
    const obj = makeTextObject()
    const opts = makeCustomOpts()  // getText returns 'custom text'
    plugin.startEditing(obj, opts)
    const ta = document.querySelector('textarea')!
    ta.value = 'edited'
    plugin.stopEditing()

    expect(stage.emit).toHaveBeenCalledWith('textedit:commit', {
      object: obj,
      oldText: 'custom text',
      newText: 'edited',
    })
  })

  // -------------------------------------------------------------------------
  // Custom object — cancel
  // -------------------------------------------------------------------------

  it('cancel calls onCancel callback', () => {
    const obj = makeTextObject()
    const opts = makeCustomOpts()
    plugin.startEditing(obj, opts)
    plugin.cancelEditing()
    expect(opts.onCancel).toHaveBeenCalledOnce()
  })

  it('cancel does not call onCommit or stage.batch()', () => {
    const obj = makeTextObject()
    const opts = makeCustomOpts()
    plugin.startEditing(obj, opts)
    vi.mocked(stage.batch).mockClear()
    plugin.cancelEditing()
    expect(opts.onCommit).not.toHaveBeenCalled()
    expect(stage.batch).not.toHaveBeenCalled()
  })

  it('cancel restores custom object visibility', () => {
    const obj = makeTextObject()
    plugin.startEditing(obj, makeCustomOpts())
    plugin.cancelEditing()
    expect(obj.visible).toBe(true)
  })

  it('fires textedit:cancel for custom object', () => {
    const obj = makeTextObject()
    const opts = makeCustomOpts()
    plugin.startEditing(obj, opts)
    plugin.cancelEditing()
    expect(stage.emit).toHaveBeenCalledWith('textedit:cancel', { object: obj })
  })

  it('stopEditing() on custom object acts as commit', () => {
    const obj = makeTextObject()
    const opts = makeCustomOpts()
    plugin.startEditing(obj, opts)
    document.querySelector('textarea')!.value = 'stop result'
    plugin.stopEditing()
    expect(opts.onCommit).toHaveBeenCalledWith('stop result')
    expect(obj.visible).toBe(true)
  })

  it('cancelEditing() on custom object acts as cancel', () => {
    const obj = makeTextObject()
    const opts = makeCustomOpts()
    plugin.startEditing(obj, opts)
    plugin.cancelEditing()
    expect(opts.onCancel).toHaveBeenCalled()
    expect(opts.onCommit).not.toHaveBeenCalled()
    expect(obj.visible).toBe(true)
  })

  // -------------------------------------------------------------------------
  // dblclick auto-trigger on Text objects
  // -------------------------------------------------------------------------

  it('dblclick on a Text object starts editing it', () => {
    const text = makeTextObject()
    const stageWithHit = makeStage({ hitResult: text as unknown as BaseObject })
    plugin.uninstall(stage)
    plugin.install(stageWithHit)

    const dblclick = stageWithHit._handlers['dblclick']?.[0]
    dblclick?.(makeDblClickEvent(text.x, text.y))

    expect(text.visible).toBe(false)
    expect(plugin.isEditing()).toBe(true)

    plugin.uninstall(stageWithHit)
    plugin.install(stage)
  })

  it('dblclick on a non-Text object does not start editing', () => {
    // BaseObject that is NOT a Text
    const obj = { hitTest: vi.fn() } as unknown as BaseObject
    const stageWithHit = makeStage({ hitResult: obj })
    plugin.uninstall(stage)
    plugin.install(stageWithHit)

    const dblclick = stageWithHit._handlers['dblclick']?.[0]
    dblclick?.(makeDblClickEvent(0, 0))

    expect(plugin.isEditing()).toBe(false)
    plugin.uninstall(stageWithHit)
    plugin.install(stage)
  })

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  it('starting a new edit while already editing commits the previous edit', () => {
    const text1 = makeTextObject({ text: 'first' })
    const text2 = makeTextObject({ text: 'second' })
    plugin.startEditing(text1)
    // Change first textarea
    document.querySelector('textarea')!.value = 'modified'
    plugin.startEditing(text2)
    // First edit should be committed
    expect(text1.text).toBe('modified')
    expect(text1.visible).toBe(true)
    // Second edit is now active
    expect(plugin.isEditing()).toBe(true)
    expect(text2.visible).toBe(false)
    plugin.cancelEditing()
  })

  it('stopEditing() is a no-op when not editing', () => {
    expect(() => plugin.stopEditing()).not.toThrow()
  })

  it('cancelEditing() is a no-op when not editing', () => {
    expect(() => plugin.cancelEditing()).not.toThrow()
  })

  it('uninstall cancels active edit without throwing', () => {
    const text = makeTextObject()
    plugin.startEditing(text)
    expect(() => plugin.uninstall(stage)).not.toThrow()
    expect(text.visible).toBe(true)
    expect(plugin.isEditing()).toBe(false)
    // Re-install for afterEach
    plugin.install(stage)
  })
})
