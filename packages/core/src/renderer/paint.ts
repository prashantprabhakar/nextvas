/**
 * Internal paint/color helpers for CanvasKit rendering.
 * Not exported from the public package API.
 */
import type { Fill, StrokeStyle, ColorRGBA, SolidFill, LinearGradientFill } from '../types.js'

// ---------------------------------------------------------------------------
// Minimal CanvasKit interfaces needed by this module
// ---------------------------------------------------------------------------

interface SkPaint {
  setStyle(style: unknown): void
  setColor(color: Float32Array): void
  setAntiAlias(aa: boolean): void
  setStrokeWidth(width: number): void
  setStrokeCap(cap: unknown): void
  setStrokeJoin(join: unknown): void
  setStrokeMiter(limit: number): void
  setShader(shader: unknown | null): void
  setAlphaf(alpha: number): void
  delete(): void
}

interface SkShader {
  delete(): void
}

export interface PaintCK {
  // eslint-disable-next-line @typescript-eslint/no-misused-new
  Paint: new () => SkPaint
  Color4f(r: number, g: number, b: number, a: number): Float32Array
  PaintStyle: { Fill: unknown; Stroke: unknown }
  StrokeCap: { Butt: unknown; Round: unknown; Square: unknown }
  StrokeJoin: { Miter: unknown; Round: unknown; Bevel: unknown }
  Shader: {
    MakeLinearGradient(
      start: number[],
      end: number[],
      colors: Float32Array[],
      positions: number[] | null,
      mode: unknown,
    ): SkShader | null
  }
  TileMode: { Clamp: unknown }
}

// ---------------------------------------------------------------------------
// Color conversion
// ---------------------------------------------------------------------------

/**
 * Convert a framework ColorRGBA (values 0–1) to a CanvasKit Color4f Float32Array.
 */
export function colorToCK(ck: PaintCK, c: ColorRGBA): Float32Array {
  return ck.Color4f(c.r, c.g, c.b, c.a)
}

// ---------------------------------------------------------------------------
// Fill paint
// ---------------------------------------------------------------------------

/**
 * Create and configure a CanvasKit Paint for a Fill.
 * Caller is responsible for calling `paint.delete()` when done.
 */
export function makeFillPaint(ck: PaintCK, fill: Fill, opacity: number): SkPaint {
  const paint = new ck.Paint()
  paint.setStyle(ck.PaintStyle.Fill)
  paint.setAntiAlias(true)
  paint.setAlphaf(opacity)

  if (fill.type === 'solid') {
    applySolidFill(ck, paint, fill)
  } else if (fill.type === 'linear-gradient') {
    applyLinearGradient(ck, paint, fill)
  }

  return paint
}

function applySolidFill(ck: PaintCK, paint: SkPaint, fill: SolidFill): void {
  paint.setColor(colorToCK(ck, fill.color))
}

function applyLinearGradient(ck: PaintCK, paint: SkPaint, fill: LinearGradientFill): void {
  const colors = fill.stops.map((s) => colorToCK(ck, s.color))
  const positions = fill.stops.map((s) => s.offset)
  const shader = ck.Shader.MakeLinearGradient(
    [fill.start.x, fill.start.y],
    [fill.end.x, fill.end.y],
    colors,
    positions,
    ck.TileMode.Clamp,
  )
  if (shader) {
    paint.setShader(shader)
    shader.delete()
  }
}

// ---------------------------------------------------------------------------
// Stroke paint
// ---------------------------------------------------------------------------

/**
 * Create and configure a CanvasKit Paint for a StrokeStyle.
 * Caller is responsible for calling `paint.delete()` when done.
 */
export function makeStrokePaint(ck: PaintCK, stroke: StrokeStyle, opacity: number): SkPaint {
  const paint = new ck.Paint()
  paint.setStyle(ck.PaintStyle.Stroke)
  paint.setAntiAlias(true)
  paint.setAlphaf(opacity)
  paint.setColor(colorToCK(ck, stroke.color))
  paint.setStrokeWidth(stroke.width)

  if (stroke.cap === 'round') {
    paint.setStrokeCap(ck.StrokeCap.Round)
  } else if (stroke.cap === 'square') {
    paint.setStrokeCap(ck.StrokeCap.Square)
  } else {
    paint.setStrokeCap(ck.StrokeCap.Butt)
  }

  if (stroke.join === 'round') {
    paint.setStrokeJoin(ck.StrokeJoin.Round)
  } else if (stroke.join === 'bevel') {
    paint.setStrokeJoin(ck.StrokeJoin.Bevel)
  } else {
    paint.setStrokeJoin(ck.StrokeJoin.Miter)
    paint.setStrokeMiter(10)
  }

  return paint
}

// ---------------------------------------------------------------------------
// Utility — run a function with a Paint, delete when done
// ---------------------------------------------------------------------------

/**
 * Create a paint, call `fn` with it, then delete it automatically.
 * Prevents accidental memory leaks when many render paths are involved.
 */
export function withPaint<T>(ck: PaintCK, fn: (paint: SkPaint) => T): T {
  const paint = new ck.Paint()
  try {
    return fn(paint)
  } finally {
    paint.delete()
  }
}
