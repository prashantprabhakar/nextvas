import type { Plugin, StageInterface, RenderContext, RenderPass } from '@nexvas/core'

// ---------------------------------------------------------------------------
// CanvasKit interface fragments
// ---------------------------------------------------------------------------

interface SkCanvas {
  drawRect(rect: Float32Array | number[], paint: unknown): void
  drawLine(x0: number, y0: number, x1: number, y1: number, paint: unknown): void
  drawText(str: string, x: number, y: number, paint: unknown, font: unknown): void
  save(): number
  restore(): void
  concat(matr: number[]): void
}

interface RulerCK {
  Paint: new () => SkPaint
  Font: new (face: unknown | null, size: number) => SkFont
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

interface SkFont {
  delete(): void
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RulerColor {
  r: number
  g: number
  b: number
  a: number
}

export interface RulerPluginOptions {
  /** Ruler band thickness in CSS pixels. Default: 20. */
  size?: number
  /** Display unit for tick labels. Default: 'px'. */
  unit?: 'px' | 'pt' | 'mm' | 'cm' | 'in'
  /** Tick mark and border color. Default: mid-grey. */
  tickColor?: RulerColor
  /** Ruler band background color. Default: near-white. */
  backgroundColor?: RulerColor
  /** Tick label text color. Default: dark grey. */
  textColor?: RulerColor
  /** Label font size in screen pixels. Default: 9. */
  fontSize?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** World pixels per display unit at 96 DPI. */
const UNIT_SCALE: Record<string, number> = {
  px: 1,
  pt: 96 / 72,       // 1 pt = 1.333… px
  mm: 96 / 25.4,     // 1 mm = 3.779… px
  cm: 96 / 2.54,     // 1 cm = 37.79… px
  in: 96,            // 1 in = 96 px
}

/** Round to a "nice" tick interval: 1, 2, 5, 10, 20, 50, 100 … */
function niceInterval(raw: number): number {
  if (raw <= 0) return 1
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)))
  const fraction = raw / magnitude
  if (fraction < 1.5) return magnitude
  if (fraction < 3.5) return magnitude * 2
  if (fraction < 7.5) return magnitude * 5
  return magnitude * 10
}

/** Format a display-unit value as a compact string. */
function formatLabel(displayValue: number): string {
  const rounded = Math.round(displayValue * 100) / 100
  if (rounded === Math.floor(rounded)) return String(Math.floor(rounded))
  return rounded.toFixed(2).replace(/\.?0+$/, '')
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/**
 * RulerPlugin — draws horizontal and vertical rulers along the top and left
 * edges of the canvas. Ticks and labels update automatically as the viewport
 * pans and zooms.
 *
 * Fires `'ruler:ready'` on the stage immediately after install so the
 * application can inset the canvas element to reveal the ruler bands.
 *
 * @example
 * ```ts
 * stage.use(new RulerPlugin({ size: 20, unit: 'px' }))
 * stage.on('ruler:ready', ({ size }) => {
 *   canvas.style.cssText = `position:absolute;inset:${size}px 0 0 ${size}px`
 * })
 * ```
 */
export class RulerPlugin implements Plugin {
  readonly name = 'ruler'
  readonly version = '0.1.0'

  private _options: Required<RulerPluginOptions>
  private _renderPass: RenderPass | null = null

  constructor(options: RulerPluginOptions = {}) {
    this._options = {
      size: options.size ?? 20,
      unit: options.unit ?? 'px',
      tickColor: options.tickColor ?? { r: 0.4, g: 0.4, b: 0.4, a: 1 },
      backgroundColor: options.backgroundColor ?? { r: 0.95, g: 0.95, b: 0.95, a: 1 },
      textColor: options.textColor ?? { r: 0.3, g: 0.3, b: 0.3, a: 1 },
      fontSize: options.fontSize ?? 9,
    }
  }

  // ---------------------------------------------------------------------------
  // Plugin lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Register the ruler render pass and emit `'ruler:ready'` with the ruler
   * band size so the application can adjust the canvas element position.
   */
  install(stage: StageInterface): void {
    this._renderPass = {
      phase: 'post',
      order: 1000,
      render: (ctx: RenderContext) => this._draw(ctx),
    }
    stage.addRenderPass(this._renderPass)
    stage.emit('ruler:ready', { size: this._options.size })
  }

  /** Remove the render pass, leaving no side effects on the stage. */
  uninstall(stage: StageInterface): void {
    if (this._renderPass) {
      stage.removeRenderPass(this._renderPass)
      this._renderPass = null
    }
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  private _draw(ctx: RenderContext): void {
    if (!ctx.skCanvas || !ctx.canvasKit) return
    const ck = ctx.canvasKit as unknown as RulerCK
    const canvas = ctx.skCanvas as SkCanvas
    const vp = ctx.viewport
    const { size, unit, tickColor, backgroundColor, textColor, fontSize } = this._options

    const scale = vp.scale
    const invScale = 1 / scale
    const unitScale = UNIT_SCALE[unit] ?? 1

    // World-space extents of the visible area
    const worldLeft = -vp.x * invScale
    const worldTop = -vp.y * invScale
    const worldRight = worldLeft + vp.width * invScale
    const worldBottom = worldTop + vp.height * invScale

    // Ruler band thickness and font size in world units
    const rulerThick = size * invScale
    const fontSizeW = fontSize * invScale

    // ─── Paints ────────────────────────────────────────────────────────────

    const bgPaint = new ck.Paint()
    bgPaint.setStyle(ck.PaintStyle.Fill)
    bgPaint.setColor(ck.Color4f(backgroundColor.r, backgroundColor.g, backgroundColor.b, backgroundColor.a))
    bgPaint.setAntiAlias(false)

    const borderPaint = new ck.Paint()
    borderPaint.setStyle(ck.PaintStyle.Stroke)
    borderPaint.setColor(ck.Color4f(tickColor.r, tickColor.g, tickColor.b, tickColor.a * 0.4))
    borderPaint.setStrokeWidth(invScale)
    borderPaint.setAntiAlias(false)

    const tickPaint = new ck.Paint()
    tickPaint.setStyle(ck.PaintStyle.Stroke)
    tickPaint.setColor(ck.Color4f(tickColor.r, tickColor.g, tickColor.b, tickColor.a))
    tickPaint.setStrokeWidth(invScale)
    tickPaint.setAntiAlias(true)

    const textPaint = new ck.Paint()
    textPaint.setStyle(ck.PaintStyle.Fill)
    textPaint.setColor(ck.Color4f(textColor.r, textColor.g, textColor.b, textColor.a))
    textPaint.setAntiAlias(true)

    // Font size in world units — the viewport scale produces correct screen size
    const font = new ck.Font(null, fontSizeW)

    // ─── Background bands ──────────────────────────────────────────────────

    // Horizontal ruler (top band, full width)
    canvas.drawRect([worldLeft, worldTop, worldRight, worldTop + rulerThick], bgPaint)
    // Vertical ruler (left band, full height)
    canvas.drawRect([worldLeft, worldTop, worldLeft + rulerThick, worldBottom], bgPaint)

    // Separator lines
    canvas.drawLine(worldLeft, worldTop + rulerThick, worldRight, worldTop + rulerThick, borderPaint)
    canvas.drawLine(worldLeft + rulerThick, worldTop, worldLeft + rulerThick, worldBottom, borderPaint)

    // ─── Tick interval ─────────────────────────────────────────────────────

    // Target ~60 screen px between major ticks, expressed in display units
    const rawDisplaySpacing = (60 * invScale) / unitScale
    const majorDisplayInterval = niceInterval(rawDisplaySpacing)
    const majorWorldInterval = majorDisplayInterval * unitScale

    // 5 sub-divisions between major ticks
    const SUB = 5
    const minorWorldInterval = majorWorldInterval / SUB

    // ─── Horizontal ruler ticks ────────────────────────────────────────────

    const hContentLeft = worldLeft + rulerThick
    const hFirstMinor = Math.ceil(hContentLeft / minorWorldInterval) * minorWorldInterval
    const hFirstMajor = Math.ceil(hContentLeft / majorWorldInterval) * majorWorldInterval
    const tickBottom = worldTop + rulerThick

    // Minor ticks
    for (let wx = hFirstMinor; wx <= worldRight; wx += minorWorldInterval) {
      // Skip positions that will be drawn as major ticks
      const rem = Math.abs(((wx - hFirstMajor) % majorWorldInterval + majorWorldInterval) % majorWorldInterval)
      if (rem < majorWorldInterval * 0.001) continue
      canvas.drawLine(wx, tickBottom - rulerThick * 0.25, wx, tickBottom, tickPaint)
    }

    // Major ticks + labels
    for (let wx = hFirstMajor; wx <= worldRight; wx += majorWorldInterval) {
      canvas.drawLine(wx, tickBottom - rulerThick * 0.5, wx, tickBottom, tickPaint)
      const label = formatLabel(wx / unitScale)
      canvas.drawText(label, wx + 2 * invScale, worldTop + fontSizeW + 2 * invScale, textPaint, font)
    }

    // ─── Vertical ruler ticks ──────────────────────────────────────────────

    const vContentTop = worldTop + rulerThick
    const vFirstMinor = Math.ceil(vContentTop / minorWorldInterval) * minorWorldInterval
    const vFirstMajor = Math.ceil(vContentTop / majorWorldInterval) * majorWorldInterval
    const tickRight = worldLeft + rulerThick

    // Minor ticks
    for (let wy = vFirstMinor; wy <= worldBottom; wy += minorWorldInterval) {
      const rem = Math.abs(((wy - vFirstMajor) % majorWorldInterval + majorWorldInterval) % majorWorldInterval)
      if (rem < majorWorldInterval * 0.001) continue
      canvas.drawLine(tickRight - rulerThick * 0.25, wy, tickRight, wy, tickPaint)
    }

    // Major ticks + labels (rotated -90° so text reads bottom-to-top)
    for (let wy = vFirstMajor; wy <= worldBottom; wy += majorWorldInterval) {
      canvas.drawLine(tickRight - rulerThick * 0.5, wy, tickRight, wy, tickPaint)

      const label = formatLabel(wy / unitScale)
      // Rotation matrix for -90° around (tx, ty) — maps local (x,y) to world (ty-x+tx, wy+... wait
      // Row-major 3×3: [a,b,tx, c,d,ty, 0,0,1] → x'=a·x+b·y+tx, y'=c·x+d·y+ty
      // For -90° rotation: a=0, b=1, c=-1, d=0
      // Translate to (tx, ty) first, then rotate: net matrix = [0,1,tx, -1,0,ty, 0,0,1]
      // local +x → world -y (upward): text glyphs flow upward ✓
      // local +y → world +x (rightward, toward canvas interior): cap height faces canvas ✓
      const tx = worldLeft + rulerThick * 0.5
      const approxHalfWidth = label.length * fontSizeW * 0.35
      canvas.save()
      canvas.concat([0, 1, tx, -1, 0, wy, 0, 0, 1])
      canvas.drawText(label, -approxHalfWidth, fontSizeW * 0.4, textPaint, font)
      canvas.restore()
    }

    // Cleanup
    bgPaint.delete()
    borderPaint.delete()
    tickPaint.delete()
    textPaint.delete()
    font.delete()
  }
}
