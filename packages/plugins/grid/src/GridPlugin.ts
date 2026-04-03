import type { Plugin, StageInterface, RenderContext, RenderPass } from '@nexvas/core'

// ---------------------------------------------------------------------------
// CanvasKit minimal interface for grid rendering
// ---------------------------------------------------------------------------
interface SkCanvas {
  drawLine(x0: number, y0: number, x1: number, y1: number, paint: unknown): void
  drawCircle(cx: number, cy: number, r: number, paint: unknown): void
}

interface GridCK {
  Paint: new () => SkPaint  // CanvasKit structs require `new`
  Color4f(r: number, g: number, b: number, a: number): Float32Array
  PaintStyle: { Fill: unknown; Stroke: unknown }
}

interface SkPaint {
  setStyle(style: unknown): void
  setColor(color: Float32Array): void
  setAntiAlias(aa: boolean): void
  setStrokeWidth(w: number): void
  delete(): void
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GridPluginOptions {
  /** Visual style of the grid. Default: 'lines'. */
  type?: 'lines' | 'dots'
  /** Grid cell size in world units. Default: 20. */
  cellSize?: number
  /** Grid color as RGBA. Default: rgba(0,0,0,0.15). */
  color?: { r: number; g: number; b: number; a: number }
  /** Snap dragged objects to grid intersections. Default: false. */
  snapToGrid?: boolean
  /** Distance in world units within which snapping activates. Default: 5. */
  snapThreshold?: number
}

/**
 * GridPlugin — renders a background grid (lines or dots) that tracks the
 * current viewport, and optionally snaps object positions to grid cells.
 */
export class GridPlugin implements Plugin {
  readonly name = 'grid'
  readonly version = '0.1.0'

  private _options: Required<GridPluginOptions>
  private _renderPass: RenderPass | null = null

  constructor(options: GridPluginOptions = {}) {
    this._options = {
      type: options.type ?? 'lines',
      cellSize: options.cellSize ?? 20,
      color: options.color ?? { r: 0, g: 0, b: 0, a: 0.15 },
      snapToGrid: options.snapToGrid ?? false,
      snapThreshold: options.snapThreshold ?? 5,
    }
  }

  // ---------------------------------------------------------------------------
  // Plugin lifecycle
  // ---------------------------------------------------------------------------

  install(stage: StageInterface): void {
    this._renderPass = {
      phase: 'pre',
      order: -100,
      render: (ctx: RenderContext) => this._drawGrid(ctx),
    }
    stage.addRenderPass(this._renderPass)
  }

  uninstall(stage: StageInterface): void {
    if (this._renderPass) {
      stage.removeRenderPass(this._renderPass)
      this._renderPass = null
    }
  }

  // ---------------------------------------------------------------------------
  // Snap helper
  // ---------------------------------------------------------------------------

  /**
   * Snap a world-space coordinate to the nearest grid intersection.
   * Only snaps if within `snapThreshold` world units.
   */
  snap(value: number): number {
    if (!this._options.snapToGrid) return value
    const cell = this._options.cellSize
    const snapped = Math.round(value / cell) * cell
    return Math.abs(value - snapped) <= this._options.snapThreshold ? snapped : value
  }

  /** Snap both x and y. */
  snapPoint(x: number, y: number): { x: number; y: number } {
    return { x: this.snap(x), y: this.snap(y) }
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  private _drawGrid(ctx: RenderContext): void {
    if (!ctx.skCanvas || !ctx.canvasKit) return
    const ck = ctx.canvasKit as GridCK
    const canvas = ctx.skCanvas as SkCanvas
    const vp = ctx.viewport
    const { cellSize, color, type } = this._options

    // Compute visible world-space range
    const invScale = 1 / vp.scale
    const worldLeft = -vp.x * invScale
    const worldTop = -vp.y * invScale
    const worldRight = worldLeft + (vp.width ?? 4000) * invScale
    const worldBottom = worldTop + (vp.height ?? 4000) * invScale

    // First grid line in each direction
    const startX = Math.floor(worldLeft / cellSize) * cellSize
    const startY = Math.floor(worldTop / cellSize) * cellSize

    const paint = new ck.Paint()
    paint.setColor(ck.Color4f(color.r, color.g, color.b, color.a))
    paint.setAntiAlias(true)

    if (type === 'dots') {
      paint.setStyle(ck.PaintStyle.Fill)
      for (let x = startX; x <= worldRight; x += cellSize) {
        for (let y = startY; y <= worldBottom; y += cellSize) {
          // Convert to screen space for drawing (we're inside the viewport transform)
          canvas.drawCircle(x, y, 1.5 * invScale, paint)
        }
      }
    } else {
      paint.setStyle(ck.PaintStyle.Stroke)
      paint.setStrokeWidth(invScale) // 1 pixel in screen space

      for (let x = startX; x <= worldRight; x += cellSize) {
        canvas.drawLine(x, worldTop, x, worldBottom, paint)
      }
      for (let y = startY; y <= worldBottom; y += cellSize) {
        canvas.drawLine(worldLeft, y, worldRight, y, paint)
      }
    }

    paint.delete()
  }
}
