/** Immutable 2D vector. */
export class Vec2 {
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  static readonly ZERO = new Vec2(0, 0)
  static readonly ONE = new Vec2(1, 1)

  add(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y)
  }

  sub(other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y)
  }

  scale(factor: number): Vec2 {
    return new Vec2(this.x * factor, this.y * factor)
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  normalize(): Vec2 {
    const len = this.length()
    if (len === 0) return Vec2.ZERO
    return new Vec2(this.x / len, this.y / len)
  }

  dot(other: Vec2): number {
    return this.x * other.x + this.y * other.y
  }

  distanceTo(other: Vec2): number {
    return this.sub(other).length()
  }

  equals(other: Vec2, epsilon = 1e-10): boolean {
    return Math.abs(this.x - other.x) < epsilon && Math.abs(this.y - other.y) < epsilon
  }

  toArray(): [number, number] {
    return [this.x, this.y]
  }

  toString(): string {
    return `Vec2(${this.x}, ${this.y})`
  }
}
