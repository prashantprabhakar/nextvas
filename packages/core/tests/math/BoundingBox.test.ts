import { describe, it, expect } from 'vitest'
import { BoundingBox } from '../../src/math/BoundingBox.js'
import { Matrix3x3 } from '../../src/math/Matrix3x3.js'

describe('BoundingBox', () => {
  it('contains a point inside', () => {
    const b = new BoundingBox(0, 0, 100, 100)
    expect(b.contains(50, 50)).toBe(true)
  })

  it('does not contain a point outside', () => {
    const b = new BoundingBox(0, 0, 100, 100)
    expect(b.contains(150, 50)).toBe(false)
  })

  it('contains with tolerance expands bounds', () => {
    const b = new BoundingBox(0, 0, 100, 100)
    expect(b.contains(103, 50, 4)).toBe(true)
    expect(b.contains(105, 50, 4)).toBe(false)
  })

  it('intersects with overlapping box', () => {
    const a = new BoundingBox(0, 0, 100, 100)
    const b = new BoundingBox(50, 50, 100, 100)
    expect(a.intersects(b)).toBe(true)
  })

  it('does not intersect non-overlapping box', () => {
    const a = new BoundingBox(0, 0, 50, 50)
    const b = new BoundingBox(100, 100, 50, 50)
    expect(a.intersects(b)).toBe(false)
  })

  it('union returns bounding box covering both', () => {
    const a = new BoundingBox(0, 0, 50, 50)
    const b = new BoundingBox(30, 30, 50, 50)
    const u = a.union(b)
    expect(u.x).toBe(0)
    expect(u.y).toBe(0)
    expect(u.width).toBe(80)
    expect(u.height).toBe(80)
  })

  it('expand grows box by amount', () => {
    const b = new BoundingBox(10, 10, 50, 50)
    const e = b.expand(5)
    expect(e.x).toBe(5)
    expect(e.y).toBe(5)
    expect(e.width).toBe(60)
    expect(e.height).toBe(60)
  })

  it('transform with translation', () => {
    const b = new BoundingBox(0, 0, 100, 50)
    const m = Matrix3x3.translation(20, 10)
    const t = b.transform(m)
    expect(t.x).toBeCloseTo(20)
    expect(t.y).toBeCloseTo(10)
    expect(t.width).toBeCloseTo(100)
    expect(t.height).toBeCloseTo(50)
  })
})
