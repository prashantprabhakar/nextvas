import type { Plugin, StageInterface, BaseObject } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The anchor reference used when aligning objects. */
export type AlignRelativeTo = 'selection' | 'stage' | 'first' | BaseObject

/** Options for AlignPlugin. */
export interface AlignPluginOptions {
  /** Default reference for alignment operations. Default: 'selection'. */
  defaultRelativeTo?: AlignRelativeTo
}

/** Type augmentation to access AlignPlugin API through the stage. */
export interface AlignPluginAPI {
  align: AlignController
}

// ---------------------------------------------------------------------------
// AlignController
// ---------------------------------------------------------------------------

/**
 * Provides alignment and distribution methods for a set of objects.
 * All mutations are wrapped in `stage.batch()` so HistoryPlugin records one undo entry.
 */
export class AlignController {
  private _stage: StageInterface

  constructor(stage: StageInterface) {
    this._stage = stage
  }

  // -------------------------------------------------------------------------
  // Alignment helpers
  // -------------------------------------------------------------------------

  /** Align all objects so their left edges match the anchor's left edge. */
  left(objects: BaseObject[], options?: { relativeTo?: AlignRelativeTo }): void {
    if (objects.length === 0) return
    const anchor = this._resolveAnchor(objects, options?.relativeTo ?? 'selection')
    const targetX = anchor.x
    this._stage.batch(() => {
      for (const obj of objects) {
        const bb = obj.getWorldBoundingBox()
        obj.x += targetX - bb.x
      }
    })
  }

  /** Align all objects so their centers share the same horizontal position. */
  centerHorizontal(objects: BaseObject[], options?: { relativeTo?: AlignRelativeTo }): void {
    if (objects.length === 0) return
    const anchor = this._resolveAnchor(objects, options?.relativeTo ?? 'selection')
    const targetCX = anchor.x + anchor.width / 2
    this._stage.batch(() => {
      for (const obj of objects) {
        const bb = obj.getWorldBoundingBox()
        obj.x += targetCX - (bb.x + bb.width / 2)
      }
    })
  }

  /** Align all objects so their right edges match the anchor's right edge. */
  right(objects: BaseObject[], options?: { relativeTo?: AlignRelativeTo }): void {
    if (objects.length === 0) return
    const anchor = this._resolveAnchor(objects, options?.relativeTo ?? 'selection')
    const targetRight = anchor.x + anchor.width
    this._stage.batch(() => {
      for (const obj of objects) {
        const bb = obj.getWorldBoundingBox()
        obj.x += targetRight - (bb.x + bb.width)
      }
    })
  }

  /** Align all objects so their top edges match the anchor's top edge. */
  top(objects: BaseObject[], options?: { relativeTo?: AlignRelativeTo }): void {
    if (objects.length === 0) return
    const anchor = this._resolveAnchor(objects, options?.relativeTo ?? 'selection')
    const targetY = anchor.y
    this._stage.batch(() => {
      for (const obj of objects) {
        const bb = obj.getWorldBoundingBox()
        obj.y += targetY - bb.y
      }
    })
  }

  /** Align all objects so their centers share the same vertical position. */
  centerVertical(objects: BaseObject[], options?: { relativeTo?: AlignRelativeTo }): void {
    if (objects.length === 0) return
    const anchor = this._resolveAnchor(objects, options?.relativeTo ?? 'selection')
    const targetCY = anchor.y + anchor.height / 2
    this._stage.batch(() => {
      for (const obj of objects) {
        const bb = obj.getWorldBoundingBox()
        obj.y += targetCY - (bb.y + bb.height / 2)
      }
    })
  }

  /** Align all objects so their bottom edges match the anchor's bottom edge. */
  bottom(objects: BaseObject[], options?: { relativeTo?: AlignRelativeTo }): void {
    if (objects.length === 0) return
    const anchor = this._resolveAnchor(objects, options?.relativeTo ?? 'selection')
    const targetBottom = anchor.y + anchor.height
    this._stage.batch(() => {
      for (const obj of objects) {
        const bb = obj.getWorldBoundingBox()
        obj.y += targetBottom - (bb.y + bb.height)
      }
    })
  }

  // -------------------------------------------------------------------------
  // Distribution helpers
  // -------------------------------------------------------------------------

  /**
   * Space objects evenly along the horizontal axis.
   * Leftmost and rightmost objects stay fixed; inner objects are repositioned.
   * Requires at least 3 objects to have any effect.
   */
  distributeHorizontally(objects: BaseObject[]): void {
    if (objects.length < 3) return
    const sorted = [...objects].sort((a, b) => a.getWorldBoundingBox().x - b.getWorldBoundingBox().x)
    // ! is safe: early return above guarantees sorted.length >= 3
    const first = sorted[0]!.getWorldBoundingBox()
    const last = sorted[sorted.length - 1]!.getWorldBoundingBox()
    const totalWidth = sorted.reduce((sum, o) => sum + o.getWorldBoundingBox().width, 0)
    const gap = (last.x + last.width - first.x - totalWidth) / (sorted.length - 1)
    this._stage.batch(() => {
      let cursor = first.x + first.width + gap
      for (let i = 1; i < sorted.length - 1; i++) {
        const bb = sorted[i]!.getWorldBoundingBox()
        sorted[i]!.x += cursor - bb.x
        cursor += bb.width + gap
      }
    })
  }

  /**
   * Space objects evenly along the vertical axis.
   * Topmost and bottommost objects stay fixed; inner objects are repositioned.
   * Requires at least 3 objects to have any effect.
   */
  distributeVertically(objects: BaseObject[]): void {
    if (objects.length < 3) return
    const sorted = [...objects].sort((a, b) => a.getWorldBoundingBox().y - b.getWorldBoundingBox().y)
    // ! is safe: early return above guarantees sorted.length >= 3
    const first = sorted[0]!.getWorldBoundingBox()
    const last = sorted[sorted.length - 1]!.getWorldBoundingBox()
    const totalHeight = sorted.reduce((sum, o) => sum + o.getWorldBoundingBox().height, 0)
    const gap = (last.y + last.height - first.y - totalHeight) / (sorted.length - 1)
    this._stage.batch(() => {
      let cursor = first.y + first.height + gap
      for (let i = 1; i < sorted.length - 1; i++) {
        const bb = sorted[i]!.getWorldBoundingBox()
        sorted[i]!.y += cursor - bb.y
        cursor += bb.height + gap
      }
    })
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private _resolveAnchor(
    objects: BaseObject[],
    relativeTo: AlignRelativeTo,
  ): { x: number; y: number; width: number; height: number } {
    if (relativeTo === 'stage') {
      const bb = this._stage.getBoundingBox()
      return { x: bb.x, y: bb.y, width: bb.width, height: bb.height }
    }

    if (relativeTo === 'first') {
      // ! is safe: callers must pass a non-empty objects array (enforced by all public align methods)
      const bb = objects[0]!.getWorldBoundingBox()
      return { x: bb.x, y: bb.y, width: bb.width, height: bb.height }
    }

    if (relativeTo !== 'selection') {
      // Specific BaseObject anchor
      const bb = relativeTo.getWorldBoundingBox()
      return { x: bb.x, y: bb.y, width: bb.width, height: bb.height }
    }

    // 'selection' — compute union bounding box of all objects
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const obj of objects) {
      const bb = obj.getWorldBoundingBox()
      if (bb.x < minX) minX = bb.x
      if (bb.y < minY) minY = bb.y
      if (bb.x + bb.width > maxX) maxX = bb.x + bb.width
      if (bb.y + bb.height > maxY) maxY = bb.y + bb.height
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }
}

// ---------------------------------------------------------------------------
// AlignPlugin
// ---------------------------------------------------------------------------

/**
 * AlignPlugin — alignment and distribution for canvas objects.
 *
 * After installing, access alignment operations via `(stage as AlignPluginAPI).align`.
 * All mutations go through `stage.batch()` so HistoryPlugin records a single undo entry.
 *
 * @example
 * ```ts
 * stage.use(new AlignPlugin())
 * const { align } = stage as unknown as AlignPluginAPI
 *
 * align.left(selectedObjects)
 * align.distributeHorizontally(selectedObjects)
 * align.centerVertical(selectedObjects, { relativeTo: 'stage' })
 * ```
 */
export class AlignPlugin implements Plugin {
  readonly name = 'plugin-align'
  readonly version = '0.0.1'

  private _controller: AlignController | null = null
  private _stage: StageInterface | null = null

  constructor(_options: AlignPluginOptions = {}) {}

  /** Install the plugin on a stage. Attaches the `align` controller to the stage object. */
  install(stage: StageInterface): void {
    this._stage = stage
    this._controller = new AlignController(stage)
    ;(stage as unknown as AlignPluginAPI).align = this._controller
  }

  /** Remove the plugin. Detaches the `align` controller from the stage object. */
  uninstall(stage: StageInterface): void {
    delete (stage as unknown as Partial<AlignPluginAPI>).align
    this._controller = null
    this._stage = null
  }
}
