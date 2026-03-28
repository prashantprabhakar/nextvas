import type { Matrix3x3 } from './Matrix3x3.js'

/** Axis-aligned bounding box in 2D space. */
export class BoundingBox {
  constructor(
    readonly x: number,
    readonly y: number,
    readonly width: number,
    readonly height: number,
  ) {}

  get left(): number {
    return this.x
  }
  get top(): number {
    return this.y
  }
  get right(): number {
    return this.x + this.width
  }
  get bottom(): number {
    return this.y + this.height
  }
  get centerX(): number {
    return this.x + this.width / 2
  }
  get centerY(): number {
    return this.y + this.height / 2
  }

  contains(px: number, py: number, tolerance = 0): boolean {
    return (
      px >= this.x - tolerance &&
      px <= this.x + this.width + tolerance &&
      py >= this.y - tolerance &&
      py <= this.y + this.height + tolerance
    )
  }

  intersects(other: BoundingBox): boolean {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    )
  }

  union(other: BoundingBox): BoundingBox {
    const x = Math.min(this.x, other.x)
    const y = Math.min(this.y, other.y)
    return new BoundingBox(
      x,
      y,
      Math.max(this.right, other.right) - x,
      Math.max(this.bottom, other.bottom) - y,
    )
  }

  expand(amount: number): BoundingBox {
    return new BoundingBox(
      this.x - amount,
      this.y - amount,
      this.width + amount * 2,
      this.height + amount * 2,
    )
  }

  /**
   * Returns the axis-aligned bounding box of this box after applying a matrix transform.
   * Used to compute the world-space AABB for hit testing.
   */
  transform(matrix: Matrix3x3): BoundingBox {
    const corners = [
      matrix.transformPoint(this.x, this.y),
      matrix.transformPoint(this.right, this.y),
      matrix.transformPoint(this.right, this.bottom),
      matrix.transformPoint(this.x, this.bottom),
    ]
    const xs = corners.map((c) => c.x)
    const ys = corners.map((c) => c.y)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    return new BoundingBox(minX, minY, Math.max(...xs) - minX, Math.max(...ys) - minY)
  }

  equals(other: BoundingBox): boolean {
    return (
      this.x === other.x &&
      this.y === other.y &&
      this.width === other.width &&
      this.height === other.height
    )
  }
}
