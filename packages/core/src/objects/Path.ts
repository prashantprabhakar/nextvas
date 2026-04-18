import { BaseObject, type BaseObjectProps } from './BaseObject.js'
import { BoundingBox } from '../math/BoundingBox.js'
import { makeFillPaint, makeStrokePaint, fillCacheKey, strokeCacheKey, type PaintCK, type SkPaint } from '../renderer/paint.js'
import type { RenderContext, ObjectJSON } from '../types.js'

interface SkPath {
  contains(x: number, y: number): boolean
  getBounds(output?: Float32Array): Float32Array
  delete(): void
}

interface SkCanvas {
  save(): number
  restore(): void
  concat(matrix: ArrayLike<number>): void
  drawPath(path: SkPath, paint: unknown): void
}

interface PathCK extends PaintCK {
  Path: {
    MakeFromSVGString(svg: string): SkPath | null
  }
}

export interface PathProps extends BaseObjectProps {
  /** SVG path data string, e.g. "M 0 0 L 100 100 Z" */
  d?: string
}

/**
 * Arbitrary SVG-compatible path.
 * Hit testing uses Skia's SkPath.contains() for pixel-precise results.
 * The parsed SkPath is cached and invalidated when `d` changes.
 */
export class Path extends BaseObject {
  private _d: string
  /** Cached CanvasKit path — recreated when `d` changes. */
  private _skPath: SkPath | null = null
  private _skPathCK: PathCK | null = null

  constructor(props: PathProps = {}) {
    super(props)
    this._d = props.d ?? ''
  }

  get d(): string {
    return this._d
  }

  set d(value: string) {
    if (value !== this._d) {
      this._d = value
      this._invalidatePath()
    }
  }

  private _invalidatePath(): void {
    if (this._skPath) {
      this._skPath.delete()
      this._skPath = null
    }
  }

  private _ensurePath(ck: PathCK): SkPath | null {
    if (this._skPath && this._skPathCK === ck) return this._skPath
    this._invalidatePath()
    if (!this._d) return null
    this._skPath = ck.Path.MakeFromSVGString(this._d) ?? null
    this._skPathCK = ck
    return this._skPath
  }

  /**
   * Returns the bounding box of the path.
   * When the SkPath has been parsed, uses Skia's getBounds() for accuracy.
   * Before the first render (SkPath not yet created), returns a large box so
   * the viewport culling pass never incorrectly discards an unrendered path.
   */
  getLocalBoundingBox(): BoundingBox {
    if (this._skPath) {
      const b = this._skPath.getBounds()
      return new BoundingBox(b[0]!, b[1]!, b[2]! - b[0]!, b[3]! - b[1]!)
    }
    // Not yet parsed — skip culling by returning a large sentinel box.
    const LARGE = 1e7
    return new BoundingBox(-LARGE, -LARGE, LARGE * 2, LARGE * 2)
  }

  getType(): string {
    return 'Path'
  }

  /**
   * Precise hit test using Skia's SkPath.contains().
   * Falls back to bounding box when CanvasKit is not available.
   */
  hitTest(worldX: number, worldY: number, tolerance = 4): boolean {
    if (!this.visible) return false
    // Try precise hit test if we have a cached path
    if (this._skPath) {
      const wt = this.getWorldTransform()
      const local = wt.inverse().transformPoint(worldX, worldY)
      return this._skPath.contains(local.x, local.y)
    }
    return this.getWorldBoundingBox().contains(worldX, worldY, tolerance)
  }

  render(ctx: RenderContext): void {
    if (!this.visible || !ctx.skCanvas || !this._d) return
    const ck = ctx.canvasKit as unknown as PathCK
    const canvas = ctx.skCanvas as SkCanvas

    const skPath = this._ensurePath(ck)
    if (!skPath) return

    canvas.save()
    canvas.concat(this.getLocalTransform().values)

    if (this.fill) {
      const key = fillCacheKey(this.fill, this.opacity)
      if (this._fillPaintCache?.key !== key) {
        ;(this._fillPaintCache?.paint as SkPaint | undefined)?.delete()
        this._fillPaintCache = { paint: makeFillPaint(ck, this.fill, this.opacity), key }
      }
      canvas.drawPath(skPath, this._fillPaintCache!.paint as SkPaint)
    } else if (this._fillPaintCache) {
      ;(this._fillPaintCache.paint as SkPaint).delete()
      this._fillPaintCache = null
    }

    if (this.stroke) {
      const key = strokeCacheKey(this.stroke, this.opacity)
      if (this._strokePaintCache?.key !== key) {
        ;(this._strokePaintCache?.paint as SkPaint | undefined)?.delete()
        this._strokePaintCache = { paint: makeStrokePaint(ck, this.stroke, this.opacity), key }
      }
      canvas.drawPath(skPath, this._strokePaintCache!.paint as SkPaint)
    } else if (this._strokePaintCache) {
      ;(this._strokePaintCache.paint as SkPaint).delete()
      this._strokePaintCache = null
    }

    canvas.restore()
  }

  toJSON(): ObjectJSON {
    return { ...super.toJSON(), d: this._d }
  }

  static fromJSON(json: ObjectJSON): Path {
    const obj = new Path()
    obj.applyBaseJSON(json)
    if (json['d'] !== undefined) obj.d = json['d'] as string
    return obj
  }

  destroy(): void {
    this._invalidatePath()
    super.destroy()
  }
}
