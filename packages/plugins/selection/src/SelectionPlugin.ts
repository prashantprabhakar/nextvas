import type {
  Plugin,
  StageInterface,
  RenderContext,
  RenderPass,
  CanvasPointerEvent,
  BaseObject,
} from '@nexvas/core'

// ---------------------------------------------------------------------------
// CanvasKit interface fragments needed for selection rendering
// ---------------------------------------------------------------------------
interface SkCanvas {
  save(): number
  restore(): void
  drawRect(rect: number[], paint: unknown): void
  drawCircle(cx: number, cy: number, r: number, paint: unknown): void
  drawLine(x0: number, y0: number, x1: number, y1: number, paint: unknown): void
  concat(m: number[]): void
}

interface SelectionCK {
  Paint(): SkPaint
  Color4f(r: number, g: number, b: number, a: number): Float32Array
  PaintStyle: { Fill: unknown; Stroke: unknown }
  PathEffect: { MakeDash(intervals: number[], phase: number): unknown }
  LTRBRect(l: number, t: number, r: number, b: number): Float32Array
}

interface SkPaint {
  setStyle(style: unknown): void
  setColor(color: Float32Array): void
  setAntiAlias(aa: boolean): void
  setStrokeWidth(w: number): void
  setAlphaf(a: number): void
  setPathEffect(e: unknown): void
  delete(): void
}

// ---------------------------------------------------------------------------
// Handle positions — 8 handles: 4 corners + 4 midpoints
// ---------------------------------------------------------------------------
type HandleId = 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br' | 'rot'

interface Handle {
  id: HandleId
  x: number // screen-space x
  y: number // screen-space y
}

const HANDLE_SIZE = 8 // half-size (handle is HANDLE_SIZE*2 square)
const ROT_HANDLE_OFFSET = 24 // pixels above top-center

// ---------------------------------------------------------------------------
// Drag state
// ---------------------------------------------------------------------------
interface DragState {
  type: 'move' | 'resize' | 'rotate' | 'marquee'
  startScreenX: number
  startScreenY: number
  startWorldX: number
  startWorldY: number
  // move/resize: snapshot of initial object positions
  initialPositions: Map<
    string,
    { x: number; y: number; width: number; height: number; rotation: number }
  >
  // resize handle
  handle?: HandleId
  // marquee
  marqueeX?: number
  marqueeY?: number
  marqueeW?: number
  marqueeH?: number
}

// ---------------------------------------------------------------------------
// Plugin options
// ---------------------------------------------------------------------------
export interface SelectionPluginOptions {
  /** Stroke color for selection border. Default: blue. */
  selectionColor?: { r: number; g: number; b: number; a: number }
  /** Allow deleting selected objects with Delete/Backspace keys. Default: true. */
  allowDelete?: boolean
}

type ChangeHandler = (selected: BaseObject[]) => void

/**
 * SelectionPlugin — click to select objects, drag to move, handles to resize/rotate.
 *
 * Features:
 * - Click to select / Shift+click for multi-select
 * - Click on empty area to deselect
 * - Drag selected objects to move them
 * - 8 transform handles (corners + midpoints) for resize
 * - Rotation handle above the selection
 * - Marquee (drag-to-select) on empty area
 * - Delete/Backspace key removes selected objects
 */
export class SelectionPlugin implements Plugin {
  readonly name = 'selection'
  readonly version = '0.1.0'

  private _stage: StageInterface | null = null
  private _selected: Set<BaseObject> = new Set()
  private _options: Required<SelectionPluginOptions>
  private _renderPass: RenderPass | null = null
  private _dragState: DragState | null = null
  private _changeHandlers: Set<ChangeHandler> = new Set()

  // Bound event handlers (stored for cleanup)
  private _onMouseDown: (e: CanvasPointerEvent) => void
  private _onMouseMove: (e: CanvasPointerEvent) => void
  private _onMouseUp: (e: CanvasPointerEvent) => void
  private _onKeyDown: (e: KeyboardEvent) => void

  constructor(options: SelectionPluginOptions = {}) {
    this._options = {
      selectionColor: options.selectionColor ?? { r: 0.039, g: 0.522, b: 1, a: 1 },
      allowDelete: options.allowDelete ?? true,
    }

    this._onMouseDown = this._handleMouseDown.bind(this)
    this._onMouseMove = this._handleMouseMove.bind(this)
    this._onMouseUp = this._handleMouseUp.bind(this)
    this._onKeyDown = this._handleKeyDown.bind(this)
  }

  // ---------------------------------------------------------------------------
  // Plugin lifecycle
  // ---------------------------------------------------------------------------

  install(stage: StageInterface): void {
    this._stage = stage

    stage.on('mousedown', this._onMouseDown)
    stage.on('mousemove', this._onMouseMove)
    stage.on('mouseup', this._onMouseUp)

    if (this._options.allowDelete && typeof document !== 'undefined') {
      document.addEventListener('keydown', this._onKeyDown)
    }

    this._renderPass = {
      phase: 'post',
      order: 100,
      render: (ctx: RenderContext) => this._drawSelection(ctx),
    }
    stage.addRenderPass(this._renderPass)
  }

  uninstall(stage: StageInterface): void {
    stage.off('mousedown', this._onMouseDown)
    stage.off('mousemove', this._onMouseMove)
    stage.off('mouseup', this._onMouseUp)

    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this._onKeyDown)
    }

    if (this._renderPass) {
      stage.removeRenderPass(this._renderPass)
      this._renderPass = null
    }

    this._selected.clear()
    this._dragState = null
    this._stage = null
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Select a single object (replaces current selection). */
  select(obj: BaseObject): void {
    this._selected.clear()
    this._selected.add(obj)
    this._emitChange()
    this._stage?.markDirty()
  }

  /** Add an object to the selection. */
  addToSelection(obj: BaseObject): void {
    this._selected.add(obj)
    this._emitChange()
    this._stage?.markDirty()
  }

  /** Remove an object from the selection. */
  deselect(obj: BaseObject): void {
    this._selected.delete(obj)
    this._emitChange()
    this._stage?.markDirty()
  }

  /** Clear the selection. */
  clearSelection(): void {
    if (this._selected.size === 0) return
    this._selected.clear()
    this._emitChange()
    this._stage?.markDirty()
  }

  /** Select all visible unlocked objects across all layers. */
  selectAll(): void {
    this._selected.clear()
    for (const layer of this._stage?.layers ?? []) {
      for (const obj of layer.objects) {
        if (obj.visible && !obj.locked) this._selected.add(obj)
      }
    }
    this._emitChange()
    this._stage?.markDirty()
  }

  /** Returns a copy of the selected objects array. */
  getSelected(): BaseObject[] {
    return Array.from(this._selected)
  }

  /** Listen for selection changes. */
  onChange(handler: ChangeHandler): () => void {
    this._changeHandlers.add(handler)
    return () => this._changeHandlers.delete(handler)
  }

  private _emitChange(): void {
    const selected = this.getSelected()
    this._changeHandlers.forEach((h) => h(selected))
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private _handleMouseDown(e: CanvasPointerEvent): void {
    if (!this._stage) return

    const { world, screen } = e

    // Check if clicking on a resize/rotation handle
    const handle = this._hitTestHandle(screen.x, screen.y)
    if (handle && this._selected.size > 0) {
      this._startDrag('resize', e, handle)
      return
    }

    // Hit-test scene objects
    const hit = this._hitTestScene(world.x, world.y)

    if (hit) {
      if (!this._selected.has(hit)) {
        const shiftHeld = (e.originalEvent as MouseEvent).shiftKey
        if (shiftHeld) {
          this._selected.add(hit)
        } else {
          this._selected.clear()
          this._selected.add(hit)
        }
        this._emitChange()
      }
      this._startDrag('move', e)
    } else {
      // Click on empty area — start marquee or deselect
      const shiftHeld = (e.originalEvent as MouseEvent).shiftKey
      if (!shiftHeld) {
        this._selected.clear()
        this._emitChange()
      }
      this._startDrag('marquee', e)
    }

    this._stage.markDirty()
  }

  private _handleMouseMove(e: CanvasPointerEvent): void {
    if (!this._dragState || !this._stage) return
    const { world, screen } = e

    const ds = this._dragState
    const dWorldX = world.x - ds.startWorldX
    const dWorldY = world.y - ds.startWorldY

    if (ds.type === 'move') {
      for (const obj of this._selected) {
        if (obj.locked) continue
        const init = ds.initialPositions.get(obj.id)
        if (init) {
          obj.x = init.x + dWorldX
          obj.y = init.y + dWorldY
        }
      }
    } else if (ds.type === 'resize' && ds.handle) {
      this._applyResize(ds.handle, dWorldX, dWorldY)
    } else if (ds.type === 'marquee') {
      ds.marqueeX = Math.min(screen.x, ds.startScreenX)
      ds.marqueeY = Math.min(screen.y, ds.startScreenY)
      ds.marqueeW = Math.abs(screen.x - ds.startScreenX)
      ds.marqueeH = Math.abs(screen.y - ds.startScreenY)
    }

    this._stage.markDirty()
  }

  private _handleMouseUp(_e: CanvasPointerEvent): void {
    if (!this._dragState || !this._stage) return

    if (this._dragState.type === 'marquee') {
      this._finishMarquee()
    }

    this._dragState = null
    this._stage.markDirty()
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (!this._stage || this._selected.size === 0) return
    if (e.key !== 'Delete' && e.key !== 'Backspace') return

    // Remove selected objects from their layers
    for (const obj of this._selected) {
      for (const layer of this._stage.layers) {
        if (layer.objects.includes(obj)) {
          layer.remove(obj)
          break
        }
      }
    }
    this._selected.clear()
    this._emitChange()
    this._stage.markDirty()
  }

  // ---------------------------------------------------------------------------
  // Drag helpers
  // ---------------------------------------------------------------------------

  private _startDrag(type: DragState['type'], e: CanvasPointerEvent, handle?: HandleId): void {
    const initialPositions = new Map<
      string,
      { x: number; y: number; width: number; height: number; rotation: number }
    >()
    for (const obj of this._selected) {
      initialPositions.set(obj.id, {
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        rotation: obj.rotation,
      })
    }
    this._dragState = {
      type,
      startScreenX: e.screen.x,
      startScreenY: e.screen.y,
      startWorldX: e.world.x,
      startWorldY: e.world.y,
      initialPositions,
      ...(handle !== undefined && { handle }),
    }
  }

  private _applyResize(handle: HandleId, dWorldX: number, dWorldY: number): void {
    for (const obj of this._selected) {
      if (obj.locked) continue
      const init = this._dragState!.initialPositions.get(obj.id)
      if (!init) continue

      switch (handle) {
        case 'br':
          obj.width = Math.max(1, init.width + dWorldX)
          obj.height = Math.max(1, init.height + dWorldY)
          break
        case 'bl':
          obj.x = init.x + dWorldX
          obj.width = Math.max(1, init.width - dWorldX)
          obj.height = Math.max(1, init.height + dWorldY)
          break
        case 'tr':
          obj.y = init.y + dWorldY
          obj.width = Math.max(1, init.width + dWorldX)
          obj.height = Math.max(1, init.height - dWorldY)
          break
        case 'tl':
          obj.x = init.x + dWorldX
          obj.y = init.y + dWorldY
          obj.width = Math.max(1, init.width - dWorldX)
          obj.height = Math.max(1, init.height - dWorldY)
          break
        case 'mr':
          obj.width = Math.max(1, init.width + dWorldX)
          break
        case 'ml':
          obj.x = init.x + dWorldX
          obj.width = Math.max(1, init.width - dWorldX)
          break
        case 'bc':
          obj.height = Math.max(1, init.height + dWorldY)
          break
        case 'tc':
          obj.y = init.y + dWorldY
          obj.height = Math.max(1, init.height - dWorldY)
          break
      }
    }
  }

  private _finishMarquee(): void {
    if (!this._dragState || !this._stage) return
    const { marqueeX, marqueeY, marqueeW, marqueeH } = this._dragState
    if (marqueeX === undefined || marqueeY === undefined || !marqueeW || !marqueeH) return
    if (marqueeW < 4 && marqueeH < 4) return // too small — ignore

    const mLeft = marqueeX
    const mTop = marqueeY
    const mRight = marqueeX + marqueeW
    const mBottom = marqueeY + marqueeH

    for (const layer of this._stage.layers) {
      for (const obj of layer.objects) {
        if (!obj.visible || obj.locked) continue
        const bb = obj.getWorldBoundingBox()
        // Inline intersects check (both in screen-ish space for marquee)
        const intersects =
          mLeft < bb.right && mRight > bb.left && mTop < bb.bottom && mBottom > bb.top
        if (intersects) {
          this._selected.add(obj)
        }
      }
    }
    this._emitChange()
  }

  // ---------------------------------------------------------------------------
  // Scene hit testing
  // ---------------------------------------------------------------------------

  private _hitTestScene(worldX: number, worldY: number): BaseObject | null {
    if (!this._stage) return null
    const layers = this._stage.layers
    for (let i = layers.length - 1; i >= 0; i--) {
      const hit = layers[i]!.hitTest(worldX, worldY)
      if (hit) return hit
    }
    return null
  }

  // ---------------------------------------------------------------------------
  // Handle hit testing (screen space)
  // ---------------------------------------------------------------------------

  private _getHandles(): Handle[] {
    if (this._selected.size === 0) return []
    const bb = this._getSelectionScreenBB()
    if (!bb) return []
    const { x, y, r, b } = bb
    const cx = (x + r) / 2
    const cy = (y + b) / 2
    return [
      { id: 'tl', x, y },
      { id: 'tc', x: cx, y },
      { id: 'tr', x: r, y },
      { id: 'ml', x, y: cy },
      { id: 'mr', x: r, y: cy },
      { id: 'bl', x, y: b },
      { id: 'bc', x: cx, y: b },
      { id: 'br', x: r, y: b },
      { id: 'rot', x: cx, y: y - ROT_HANDLE_OFFSET },
    ]
  }

  private _hitTestHandle(screenX: number, screenY: number): HandleId | null {
    for (const handle of this._getHandles()) {
      if (
        Math.abs(screenX - handle.x) <= HANDLE_SIZE + 2 &&
        Math.abs(screenY - handle.y) <= HANDLE_SIZE + 2
      ) {
        return handle.id
      }
    }
    return null
  }

  /** Returns the combined bounding box of all selected objects in world space. */
  private _getSelectionScreenBB(): { x: number; y: number; r: number; b: number } | null {
    if (!this._stage || this._selected.size === 0) return null

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity

    for (const obj of this._selected) {
      const bb = obj.getWorldBoundingBox()
      if (bb.x < minX) minX = bb.x
      if (bb.y < minY) minY = bb.y
      if (bb.right > maxX) maxX = bb.right
      if (bb.bottom > maxY) maxY = bb.bottom
    }

    if (minX === Infinity) return null
    return { x: minX, y: minY, r: maxX, b: maxY }
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  private _drawSelection(ctx: RenderContext): void {
    if (this._selected.size === 0 || !ctx.skCanvas || !ctx.canvasKit) return
    const ck = ctx.canvasKit as SelectionCK
    const canvas = ctx.skCanvas as SkCanvas
    const vp = ctx.viewport
    const color = this._options.selectionColor

    // Draw selection border for each selected object
    for (const obj of this._selected) {
      const bb = obj.getWorldBoundingBox()
      // Convert to screen space
      const sx = bb.x * vp.scale + vp.x
      const sy = bb.y * vp.scale + vp.y
      const sw = bb.width * vp.scale
      const sh = bb.height * vp.scale

      // Dashed border
      const borderPaint = ck.Paint()
      borderPaint.setStyle(ck.PaintStyle.Stroke)
      borderPaint.setColor(ck.Color4f(color.r, color.g, color.b, color.a))
      borderPaint.setAntiAlias(true)
      borderPaint.setStrokeWidth(1.5)
      if (ck.PathEffect) {
        borderPaint.setPathEffect(ck.PathEffect.MakeDash([5, 3], 0))
      }
      canvas.drawRect([sx, sy, sx + sw, sy + sh], borderPaint)
      borderPaint.delete()
    }

    // Draw handles on combined bounding box
    const bb = this._getSelectionScreenBB()
    if (!bb) return

    const { x, y, r, b } = bb
    const cx = (x + r) / 2
    const cy = (y + b) / 2

    // Rotation handle line
    const linePaint = ck.Paint()
    linePaint.setStyle(ck.PaintStyle.Stroke)
    linePaint.setColor(ck.Color4f(color.r, color.g, color.b, color.a))
    linePaint.setStrokeWidth(1.5)
    linePaint.setAntiAlias(true)
    canvas.drawLine(
      cx * vp.scale + vp.x,
      y * vp.scale + vp.y,
      cx * vp.scale + vp.x,
      (y - ROT_HANDLE_OFFSET) * vp.scale + vp.y,
      linePaint,
    )
    linePaint.delete()

    const handles: Array<{ hx: number; hy: number; isRot: boolean }> = [
      { hx: x, hy: y, isRot: false },
      { hx: cx, hy: y, isRot: false },
      { hx: r, hy: y, isRot: false },
      { hx: x, hy: cy, isRot: false },
      { hx: r, hy: cy, isRot: false },
      { hx: x, hy: b, isRot: false },
      { hx: cx, hy: b, isRot: false },
      { hx: r, hy: b, isRot: false },
      { hx: cx, hy: y - ROT_HANDLE_OFFSET, isRot: true },
    ]

    for (const { hx, hy, isRot } of handles) {
      const sx = hx * vp.scale + vp.x
      const sy = hy * vp.scale + vp.y

      // White fill
      const fillPaint = ck.Paint()
      fillPaint.setStyle(ck.PaintStyle.Fill)
      fillPaint.setColor(ck.Color4f(1, 1, 1, 1))
      fillPaint.setAntiAlias(true)

      // Blue stroke
      const strokePaint = ck.Paint()
      strokePaint.setStyle(ck.PaintStyle.Stroke)
      strokePaint.setColor(ck.Color4f(color.r, color.g, color.b, color.a))
      strokePaint.setStrokeWidth(1.5)
      strokePaint.setAntiAlias(true)

      if (isRot) {
        canvas.drawCircle(sx, sy, HANDLE_SIZE / 2, fillPaint)
        canvas.drawCircle(sx, sy, HANDLE_SIZE / 2, strokePaint)
      } else {
        const hs = HANDLE_SIZE / 2
        canvas.drawRect([sx - hs, sy - hs, sx + hs, sy + hs], fillPaint)
        canvas.drawRect([sx - hs, sy - hs, sx + hs, sy + hs], strokePaint)
      }

      fillPaint.delete()
      strokePaint.delete()
    }

    // Draw marquee if active
    if (this._dragState?.type === 'marquee') {
      const { marqueeX, marqueeY, marqueeW, marqueeH } = this._dragState
      if (marqueeX !== undefined && marqueeW && marqueeH) {
        const marqueePaint = ck.Paint()
        marqueePaint.setStyle(ck.PaintStyle.Stroke)
        marqueePaint.setColor(ck.Color4f(color.r, color.g, color.b, 0.8))
        marqueePaint.setStrokeWidth(1)
        marqueePaint.setAntiAlias(true)
        if (ck.PathEffect) {
          marqueePaint.setPathEffect(ck.PathEffect.MakeDash([4, 4], 0))
        }
        canvas.drawRect(
          [marqueeX, marqueeY!, marqueeX + marqueeW, marqueeY! + marqueeH],
          marqueePaint,
        )
        marqueePaint.delete()
      }
    }
  }
}
