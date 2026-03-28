import type { BoundingBox } from './math/BoundingBox.js'
import type { Layer } from './Layer.js'

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/** Versioned JSON schema for a serialized scene graph. */
export interface SceneJSON {
  version: string
  layers: LayerJSON[]
}

export interface LayerJSON {
  id: string
  name: string
  visible: boolean
  locked: boolean
  objects: ObjectJSON[]
}

export interface ObjectJSON {
  type: string
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  skewX: number
  skewY: number
  opacity: number
  visible: boolean
  locked: boolean
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Context passed to every object's render() call.
 * The `skCanvas` and `canvasKit` fields are typed as `unknown` in core to avoid
 * a hard dependency on canvaskit-wasm. Object render() implementations cast them
 * to the appropriate CanvasKit types internally.
 */
export interface RenderContext {
  /** CanvasKit SkCanvas instance — cast to SkCanvas inside render() implementations. */
  skCanvas: unknown
  /** CanvasKit instance — used to create Paints, Paths, etc. inside render(). */
  canvasKit: unknown
  /** FontManager for loading and retrieving typefaces for Text rendering. */
  fontManager: unknown
  /** Device pixel ratio for HiDPI rendering. */
  pixelRatio: number
  /** Current viewport state. */
  viewport: ViewportState
}

// ---------------------------------------------------------------------------
// Viewport
// ---------------------------------------------------------------------------

export interface ViewportState {
  x: number
  y: number
  scale: number
  width: number
  height: number
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface PointerPosition {
  /** Position in screen (canvas pixel) space. */
  screen: { x: number; y: number }
  /** Position in world space (accounting for viewport pan/zoom). */
  world: { x: number; y: number }
}

export interface CanvasPointerEvent extends PointerPosition {
  originalEvent: PointerEvent | MouseEvent | TouchEvent
  stopped: boolean
  stopPropagation(): void
}

export interface CanvasWheelEvent extends PointerPosition {
  deltaX: number
  deltaY: number
  originalEvent: WheelEvent
}

/** All events that can be emitted on a BaseObject or Stage. */
export interface ObjectEventMap {
  click: CanvasPointerEvent
  dblclick: CanvasPointerEvent
  mousedown: CanvasPointerEvent
  mouseup: CanvasPointerEvent
  mousemove: CanvasPointerEvent
  mouseenter: CanvasPointerEvent
  mouseleave: CanvasPointerEvent
  dragstart: CanvasPointerEvent
  drag: CanvasPointerEvent
  dragend: CanvasPointerEvent
  tap: CanvasPointerEvent
  doubletap: CanvasPointerEvent
}

export interface StageEventMap extends ObjectEventMap {
  wheel: CanvasWheelEvent
  /** Fired after a render frame completes. */
  render: { timestamp: number }
  /** Fired when an object is added to any layer. */
  'object:added': { object: unknown }
  /** Fired when an object is removed from any layer. */
  'object:removed': { object: unknown }
}

// ---------------------------------------------------------------------------
// Plugins
// ---------------------------------------------------------------------------

/**
 * A plugin adds optional capabilities to a Stage without modifying core.
 * Plugins must be fully reversible: `uninstall` must undo everything `install` did.
 */
export interface Plugin {
  /** Unique kebab-case identifier, e.g. "selection", "drag". */
  readonly name: string
  /** SemVer string. */
  readonly version: string
  /**
   * Called once when the plugin is added to a stage.
   * Should register event listeners, render passes, etc.
   */
  install(stage: StageInterface, options?: Record<string, unknown>): void
  /**
   * Called when the plugin is removed from a stage.
   * Must fully clean up all side effects from install().
   */
  uninstall(stage: StageInterface): void
}

// ---------------------------------------------------------------------------
// Fill & Stroke
// ---------------------------------------------------------------------------

export type ColorRGBA = { r: number; g: number; b: number; a: number }

export interface SolidFill {
  type: 'solid'
  color: ColorRGBA
}

export interface LinearGradientFill {
  type: 'linear-gradient'
  stops: Array<{ offset: number; color: ColorRGBA }>
  start: { x: number; y: number }
  end: { x: number; y: number }
}

export type Fill = SolidFill | LinearGradientFill

export type StrokeLineCap = 'butt' | 'round' | 'square'
export type StrokeLineJoin = 'miter' | 'round' | 'bevel'

export interface StrokeStyle {
  color: ColorRGBA
  width: number
  lineCap?: StrokeLineCap
  lineJoin?: StrokeLineJoin
  dash?: number[]
  dashOffset?: number
}

// ---------------------------------------------------------------------------
// Minimal Stage interface for Plugin use (avoids circular imports)
// ---------------------------------------------------------------------------

/** Minimal interface that plugins interact with. Full Stage extends this. */
export interface StageInterface {
  readonly id: string
  readonly canvasKit: unknown
  readonly layers: readonly Layer[]
  on<K extends keyof StageEventMap>(event: K, handler: (e: StageEventMap[K]) => void): void
  off<K extends keyof StageEventMap>(event: K, handler: (e: StageEventMap[K]) => void): void
  addRenderPass(pass: RenderPass): void
  removeRenderPass(pass: RenderPass): void
  getBoundingBox(): BoundingBox
  render(): void
  /** Mark the stage as needing a redraw. Call after mutating objects programmatically. */
  markDirty(): void
}

// ---------------------------------------------------------------------------
// Render passes (for plugins)
// ---------------------------------------------------------------------------

export type RenderPassPhase = 'pre' | 'post'

export interface RenderPass {
  phase: RenderPassPhase
  /** Lower numbers render first within the same phase. */
  order?: number
  render(ctx: RenderContext): void
}
