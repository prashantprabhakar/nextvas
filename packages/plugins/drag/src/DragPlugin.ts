import type { Plugin, StageInterface, CanvasPointerEvent, BaseObject } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DragPluginOptions {
  /**
   * Constrain dragged objects so they stay within the stage bounding box.
   * Default: false. Also accepted as `clampToStage` (docs alias).
   */
  constrainToStage?: boolean
  /** Alias for constrainToStage. */
  clampToStage?: boolean
  /** Called when drag begins. */
  onDragStart?: (objects: BaseObject[], e: CanvasPointerEvent) => void
  /** Called each frame during drag with world-space delta from drag origin. */
  onDrag?: (objects: BaseObject[], dx: number, dy: number, e: CanvasPointerEvent) => void
  /** Called when drag ends. */
  onDragEnd?: (objects: BaseObject[], e: CanvasPointerEvent) => void
}

/**
 * Type augmentation for accessing DragPlugin through the stage.
 * @example
 * const drag = (stage as DragPluginAPI).drag
 */
export interface DragPluginAPI {
  drag: DragPlugin
}

interface ActiveDrag {
  objects: BaseObject[]
  startWorldX: number
  startWorldY: number
  initialPositions: Map<string, { x: number; y: number }>
}

/**
 * DragPlugin — makes canvas objects draggable by mouse.
 *
 * Works independently (any hittable, unlocked object is draggable) or
 * alongside SelectionPlugin (drags selected objects together).
 */
export class DragPlugin implements Plugin {
  readonly name = 'drag'
  readonly version = '0.1.0'

  private _stage: StageInterface | null = null
  private _options: {
    constrainToStage: boolean
    onDragStart: NonNullable<DragPluginOptions['onDragStart']>
    onDrag: NonNullable<DragPluginOptions['onDrag']>
    onDragEnd: NonNullable<DragPluginOptions['onDragEnd']>
  }
  private _drag: ActiveDrag | null = null

  private _onMouseDown: (e: CanvasPointerEvent) => void
  private _onMouseMove: (e: CanvasPointerEvent) => void
  private _onMouseUp: (e: CanvasPointerEvent) => void

  constructor(options: DragPluginOptions = {}) {
    this._options = {
      constrainToStage: options.constrainToStage ?? options.clampToStage ?? false,
      onDragStart: options.onDragStart ?? (() => undefined),
      onDrag: options.onDrag ?? (() => undefined),
      onDragEnd: options.onDragEnd ?? (() => undefined),
    }

    this._onMouseDown = this._handleMouseDown.bind(this)
    this._onMouseMove = this._handleMouseMove.bind(this)
    this._onMouseUp = this._handleMouseUp.bind(this)
  }

  // ---------------------------------------------------------------------------
  // Plugin lifecycle
  // ---------------------------------------------------------------------------

  install(stage: StageInterface): void {
    this._stage = stage
    ;(stage as unknown as DragPluginAPI).drag = this
    stage.on('mousedown', this._onMouseDown)
    stage.on('mousemove', this._onMouseMove)
    stage.on('mouseup', this._onMouseUp)
  }

  uninstall(stage: StageInterface): void {
    stage.off('mousedown', this._onMouseDown)
    stage.off('mousemove', this._onMouseMove)
    stage.off('mouseup', this._onMouseUp)
    this._drag = null
    this._stage = null
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private _handleMouseDown(e: CanvasPointerEvent): void {
    if (!this._stage || e.stopped) return

    const { x: worldX, y: worldY } = e.world

    // Hit test layers from top to bottom
    const layers = this._stage.layers
    let hit: BaseObject | null = null
    for (let i = layers.length - 1; i >= 0; i--) {
      const obj = layers[i]!.hitTest(worldX, worldY)
      if (obj && !obj.locked) {
        hit = obj
        break
      }
    }

    if (!hit) return

    const objects = [hit]
    const initialPositions = new Map<string, { x: number; y: number }>()
    for (const obj of objects) {
      initialPositions.set(obj.id, { x: obj.x, y: obj.y })
    }

    this._drag = { objects, startWorldX: worldX, startWorldY: worldY, initialPositions }
    this._options.onDragStart(objects, e)
    for (const obj of objects) {
      obj.emit('dragstart', e)
    }
    this._stage.markDirty()
  }

  private _handleMouseMove(e: CanvasPointerEvent): void {
    if (!this._drag || !this._stage) return

    const dx = e.world.x - this._drag.startWorldX
    const dy = e.world.y - this._drag.startWorldY

    for (const obj of this._drag.objects) {
      if (obj.locked) continue
      const init = this._drag.initialPositions.get(obj.id)
      if (!init) continue

      let newX = init.x + dx
      let newY = init.y + dy

      if (this._options.constrainToStage) {
        const bb = this._stage.getBoundingBox()
        newX = Math.max(bb.x, Math.min(bb.right - obj.width, newX))
        newY = Math.max(bb.y, Math.min(bb.bottom - obj.height, newY))
      }

      obj.x = newX
      obj.y = newY
    }

    this._options.onDrag(this._drag.objects, dx, dy, e)
    for (const obj of this._drag.objects) {
      obj.emit('drag', e)
    }
    this._stage.markDirty()
  }

  private _handleMouseUp(e: CanvasPointerEvent): void {
    if (!this._drag || !this._stage) return
    this._options.onDragEnd(this._drag.objects, e)
    for (const obj of this._drag.objects) {
      obj.emit('dragend', e)
    }
    this._drag = null
    this._stage.markDirty()
  }

  /** Returns true if a drag is currently in progress. */
  isDragging(): boolean {
    return this._drag !== null
  }
}
