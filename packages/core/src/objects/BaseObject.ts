import { Matrix3x3 } from '../math/Matrix3x3.js'
import { BoundingBox } from '../math/BoundingBox.js'
import type { ObjectJSON, RenderContext, ObjectEventMap, Fill, StrokeStyle } from '../types.js'

export type EventHandler<T> = (event: T) => void

let _nextId = 1
function generateId(): string {
  return `obj_${(_nextId++).toString(36)}`
}

export interface BaseObjectProps {
  id?: string
  name?: string
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
  scaleX?: number
  scaleY?: number
  skewX?: number
  skewY?: number
  opacity?: number
  visible?: boolean
  locked?: boolean
  fill?: Fill | null
  stroke?: StrokeStyle | null
}

/**
 * Abstract base class for all canvas objects.
 * Provides transforms, events, serialization, and hit testing scaffolding.
 */
export abstract class BaseObject {
  readonly id: string
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
  fill: Fill | null
  stroke: StrokeStyle | null

  /** Reference to the parent Group, set by Group.add(). */
  parent: BaseObject | null = null

  private _eventHandlers = new Map<string, Set<EventHandler<unknown>>>()

  constructor(props: BaseObjectProps = {}) {
    this.id = props.id ?? generateId()
    this.name = props.name ?? ''
    this.x = props.x ?? 0
    this.y = props.y ?? 0
    this.width = props.width ?? 0
    this.height = props.height ?? 0
    this.rotation = props.rotation ?? 0
    this.scaleX = props.scaleX ?? 1
    this.scaleY = props.scaleY ?? 1
    this.skewX = props.skewX ?? 0
    this.skewY = props.skewY ?? 0
    this.opacity = props.opacity ?? 1
    this.visible = props.visible ?? true
    this.locked = props.locked ?? false
    this.fill = props.fill ?? null
    this.stroke = props.stroke ?? null
  }

  // ---------------------------------------------------------------------------
  // Transform
  // ---------------------------------------------------------------------------

  /**
   * Local transform matrix: translate → rotate → scale → skew.
   * Computed from this object's own properties only.
   */
  getLocalTransform(): Matrix3x3 {
    const rotRad = (this.rotation * Math.PI) / 180
    return Matrix3x3.translation(this.x, this.y)
      .multiply(Matrix3x3.rotation(rotRad))
      .multiply(Matrix3x3.scale(this.scaleX, this.scaleY))
  }

  /**
   * World transform matrix — composes all ancestor transforms.
   * Walk up the parent chain and multiply matrices.
   */
  getWorldTransform(): Matrix3x3 {
    if (this.parent === null) return this.getLocalTransform()
    return this.parent.getWorldTransform().multiply(this.getLocalTransform())
  }

  /**
   * Axis-aligned bounding box in local space (before world transform).
   * Subclasses may override for non-rectangular shapes.
   */
  getLocalBoundingBox(): BoundingBox {
    return new BoundingBox(0, 0, this.width, this.height)
  }

  /**
   * Axis-aligned bounding box in world space.
   * Accounts for all ancestor transforms.
   */
  getWorldBoundingBox(): BoundingBox {
    return this.getLocalBoundingBox().transform(this.getWorldTransform())
  }

  // ---------------------------------------------------------------------------
  // Hit Testing
  // ---------------------------------------------------------------------------

  /**
   * Returns true if the given world-space point is inside this object.
   *
   * Default: bounding box check with configurable tolerance.
   * Override in subclasses for precise hit testing (e.g. Path uses Skia contains).
   *
   * @param worldX - X coordinate in world space
   * @param worldY - Y coordinate in world space
   * @param tolerance - Extra padding around the bounding box, in world units
   */
  hitTest(worldX: number, worldY: number, tolerance = 4): boolean {
    if (!this.visible) return false
    return this.getWorldBoundingBox().contains(worldX, worldY, tolerance)
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  /**
   * Render this object onto the CanvasKit canvas.
   * @param ctx - Render context containing the SkCanvas and viewport state.
   */
  abstract render(ctx: RenderContext): void

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  toJSON(): ObjectJSON {
    return {
      type: this.getType(),
      id: this.id,
      name: this.name,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      skewX: this.skewX,
      skewY: this.skewY,
      opacity: this.opacity,
      visible: this.visible,
      locked: this.locked,
      fill: this.fill,
      stroke: this.stroke,
    }
  }

  /** Subclasses return their type string, e.g. "Rect", "Circle". */
  abstract getType(): string

  protected applyBaseJSON(json: ObjectJSON): void {
    ;(this as { id: string }).id = json.id
    this.name = json.name
    this.x = json.x
    this.y = json.y
    this.width = json.width
    this.height = json.height
    this.rotation = json.rotation
    this.scaleX = json.scaleX
    this.scaleY = json.scaleY
    this.skewX = json.skewX
    this.skewY = json.skewY
    this.opacity = json.opacity
    this.visible = json.visible
    this.locked = json.locked
    this.fill = (json.fill as Fill | null | undefined) ?? null
    this.stroke = (json.stroke as StrokeStyle | null | undefined) ?? null
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  on<K extends keyof ObjectEventMap>(event: K, handler: EventHandler<ObjectEventMap[K]>): this {
    if (!this._eventHandlers.has(event)) {
      this._eventHandlers.set(event, new Set())
    }
    this._eventHandlers.get(event)!.add(handler as EventHandler<unknown>)
    return this
  }

  off<K extends keyof ObjectEventMap>(event: K, handler: EventHandler<ObjectEventMap[K]>): this {
    this._eventHandlers.get(event)?.delete(handler as EventHandler<unknown>)
    return this
  }

  emit<K extends keyof ObjectEventMap>(event: K, data: ObjectEventMap[K]): void {
    this._eventHandlers.get(event)?.forEach((handler) => handler(data))
    // Bubble to parent if not stopped
    if (!('stopped' in data && data.stopped)) {
      this.parent?.emit(event, data)
    }
  }

  /** Remove all event listeners. */
  removeAllListeners(): void {
    this._eventHandlers.clear()
  }

  destroy(): void {
    this.removeAllListeners()
    this.parent = null
  }
}
