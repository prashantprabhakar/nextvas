import { Matrix3x3 } from './math/Matrix3x3.js'
import type { ViewportState } from './types.js'

export interface ViewportOptions {
  minScale?: number
  maxScale?: number
}

/** Options for `viewport.animateTo()`. */
export interface AnimateToOptions {
  /** Duration in milliseconds. Default: 300. */
  duration?: number
  /** Easing function receives t in [0,1] and returns eased t. Default: ease-out cubic. */
  easing?: (t: number) => number
  /** Called when the animation completes. */
  onComplete?: () => void
}

/** Default easing: ease-out cubic. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Controls pan and zoom for the stage.
 * All object coordinates are in world-space; the viewport transforms them to screen-space.
 */
export class Viewport {
  private _x: number = 0
  private _y: number = 0
  private _scale: number = 1
  private _width: number = 0
  private _height: number = 0

  // Animation state
  private _animRafId: number | null = null
  private _animStartTime: number = 0
  private _animFrom: { x: number; y: number; scale: number } | null = null
  private _animTo: { x: number; y: number; scale: number } | null = null
  private _animDuration: number = 300
  private _animEasing: (t: number) => number = easeOutCubic
  private _animOnComplete: (() => void) | null = null
  private _onChange: (() => void) | null = null

  minScale: number
  maxScale: number

  constructor(options: ViewportOptions = {}) {
    this.minScale = options.minScale ?? 0.01
    this.maxScale = options.maxScale ?? 256
  }

  get x(): number {
    return this._x
  }
  get y(): number {
    return this._y
  }
  get scale(): number {
    return this._scale
  }
  get width(): number {
    return this._width
  }
  get height(): number {
    return this._height
  }

  /**
   * Register a callback invoked whenever the viewport changes (pan, zoom, animate).
   * Used internally by Stage to mark dirty on viewport change.
   */
  setOnChange(fn: () => void): void {
    this._onChange = fn
  }

  /** Called by Stage when the canvas is resized. */
  setSize(width: number, height: number): void {
    this._width = width
    this._height = height
  }

  pan(dx: number, dy: number): void {
    this._cancelAnimation()
    this._x += dx
    this._y += dy
    this._onChange?.()
  }

  panTo(x: number, y: number): void {
    this._cancelAnimation()
    this._x = x
    this._y = y
    this._onChange?.()
  }

  zoom(factor: number, originX: number, originY: number): void {
    this._cancelAnimation()
    const newScale = Math.min(this.maxScale, Math.max(this.minScale, this._scale * factor))
    const actualFactor = newScale / this._scale
    // Zoom around the given origin point (screen space)
    this._x = originX - (originX - this._x) * actualFactor
    this._y = originY - (originY - this._y) * actualFactor
    this._scale = newScale
    this._onChange?.()
  }

  setScale(scale: number, originX?: number, originY?: number): void {
    const cx = originX ?? this._width / 2
    const cy = originY ?? this._height / 2
    this.zoom(scale / this._scale, cx, cy)
  }

  reset(): void {
    this._cancelAnimation()
    this._x = 0
    this._y = 0
    this._scale = 1
    this._onChange?.()
  }

  /**
   * Set pan and/or zoom in one call. Only the provided keys are changed.
   * Equivalent to calling panTo() and setScale() but batched into a single
   * onChange notification.
   */
  setState(state: { x?: number; y?: number; scale?: number }): void {
    this._cancelAnimation()
    if (state.x !== undefined) this._x = state.x
    if (state.y !== undefined) this._y = state.y
    if (state.scale !== undefined) {
      this._scale = Math.min(this.maxScale, Math.max(this.minScale, state.scale))
    }
    this._onChange?.()
  }

  /**
   * Update viewport constraints at runtime.
   * Useful when the valid zoom range changes (e.g. based on content size).
   */
  setOptions(options: { minScale?: number; maxScale?: number }): void {
    if (options.minScale !== undefined) this.minScale = options.minScale
    if (options.maxScale !== undefined) this.maxScale = options.maxScale
    // Clamp current scale to new bounds
    const clamped = Math.min(this.maxScale, Math.max(this.minScale, this._scale))
    if (clamped !== this._scale) {
      this._scale = clamped
      this._onChange?.()
    }
  }

  // ---------------------------------------------------------------------------
  // Fit helpers
  // ---------------------------------------------------------------------------

  /**
   * Pan and zoom so that the given world-space rect fills the viewport,
   * with optional padding (in screen pixels, default 20).
   */
  fitToRect(
    rect: { x: number; y: number; width: number; height: number },
    padding = 20,
    animate = false,
    animOptions?: AnimateToOptions,
  ): void {
    if (rect.width === 0 || rect.height === 0) return

    const availW = this._width - padding * 2
    const availH = this._height - padding * 2
    if (availW <= 0 || availH <= 0) return

    const scaleX = availW / rect.width
    const scaleY = availH / rect.height
    const newScale = Math.min(this.maxScale, Math.max(this.minScale, Math.min(scaleX, scaleY)))

    // Center the rect in the viewport
    const newX = this._width / 2 - (rect.x + rect.width / 2) * newScale
    const newY = this._height / 2 - (rect.y + rect.height / 2) * newScale

    if (animate) {
      this.animateTo({ x: newX, y: newY, scale: newScale }, animOptions)
    } else {
      this._cancelAnimation()
      this._x = newX
      this._y = newY
      this._scale = newScale
      this._onChange?.()
    }
  }

  /**
   * Compute the union bounding box of all provided world-space rects and
   * call `fitToRect`. Pass the result of `stage.getBoundingBox()`.
   */
  fitToContent(
    contentBounds: { x: number; y: number; width: number; height: number },
    padding = 40,
    animate = false,
    animOptions?: AnimateToOptions,
  ): void {
    this.fitToRect(contentBounds, padding, animate, animOptions)
  }

  // ---------------------------------------------------------------------------
  // Animation
  // ---------------------------------------------------------------------------

  /**
   * Smoothly animate the viewport to the given pan/zoom state.
   * Any in-progress animation is cancelled and replaced.
   */
  animateTo(target: { x: number; y: number; scale: number }, options: AnimateToOptions = {}): void {
    this._cancelAnimation()

    this._animFrom = { x: this._x, y: this._y, scale: this._scale }
    this._animTo = { ...target }
    this._animDuration = options.duration ?? 300
    this._animEasing = options.easing ?? easeOutCubic
    this._animOnComplete = options.onComplete ?? null
    this._animStartTime = -1 // sentinel: set on first frame

    const tick = (now: number): void => {
      if (this._animFrom === null || this._animTo === null) return

      if (this._animStartTime < 0) this._animStartTime = now

      const elapsed = now - this._animStartTime
      const raw = Math.min(1, elapsed / this._animDuration)
      const t = this._animEasing(raw)

      this._x = this._animFrom.x + (this._animTo.x - this._animFrom.x) * t
      this._y = this._animFrom.y + (this._animTo.y - this._animFrom.y) * t
      this._scale = this._animFrom.scale + (this._animTo.scale - this._animFrom.scale) * t
      this._onChange?.()

      if (raw < 1) {
        this._animRafId = requestAnimationFrame(tick)
      } else {
        // Snap to exact target
        this._x = this._animTo.x
        this._y = this._animTo.y
        this._scale = this._animTo.scale
        this._onChange?.()
        this._animFrom = null
        this._animTo = null
        this._animRafId = null
        this._animOnComplete?.()
      }
    }

    this._animRafId = requestAnimationFrame(tick)
  }

  /** Returns true if an animation is currently in progress. */
  isAnimating(): boolean {
    return this._animRafId !== null
  }

  // ---------------------------------------------------------------------------
  // Coordinate conversion
  // ---------------------------------------------------------------------------

  /** Convert a screen-space point to world-space. */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this._x) / this._scale,
      y: (screenY - this._y) / this._scale,
    }
  }

  /** Convert a world-space point to screen-space. */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this._scale + this._x,
      y: worldY * this._scale + this._y,
    }
  }

  // ---------------------------------------------------------------------------
  // Matrix (for passing to CanvasKit's canvas.concat)
  // ---------------------------------------------------------------------------

  getMatrix(): Matrix3x3 {
    return Matrix3x3.translation(this._x, this._y).multiply(
      Matrix3x3.scale(this._scale, this._scale),
    )
  }

  getState(): ViewportState {
    return {
      x: this._x,
      y: this._y,
      scale: this._scale,
      width: this._width,
      height: this._height,
    }
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private _cancelAnimation(): void {
    if (this._animRafId !== null) {
      cancelAnimationFrame(this._animRafId)
      this._animRafId = null
    }
    this._animFrom = null
    this._animTo = null
  }
}
