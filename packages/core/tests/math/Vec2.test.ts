import { describe, it, expect } from 'vitest'
import { Vec2 } from '../../src/math/Vec2.js'

describe('Vec2', () => {
  it('add', () => {
    expect(new Vec2(1, 2).add(new Vec2(3, 4))).toEqual(new Vec2(4, 6))
  })

  it('sub', () => {
    expect(new Vec2(5, 3).sub(new Vec2(2, 1))).toEqual(new Vec2(3, 2))
  })

  it('scale', () => {
    expect(new Vec2(3, 4).scale(2)).toEqual(new Vec2(6, 8))
  })

  it('length', () => {
    expect(new Vec2(3, 4).length()).toBe(5)
  })

  it('normalize', () => {
    const n = new Vec2(3, 4).normalize()
    expect(n.length()).toBeCloseTo(1)
  })

  it('dot product', () => {
    expect(new Vec2(1, 0).dot(new Vec2(0, 1))).toBe(0)
    expect(new Vec2(1, 0).dot(new Vec2(1, 0))).toBe(1)
  })

  it('distanceTo', () => {
    expect(new Vec2(0, 0).distanceTo(new Vec2(3, 4))).toBe(5)
  })

  it('equals', () => {
    expect(new Vec2(1, 2).equals(new Vec2(1, 2))).toBe(true)
    expect(new Vec2(1, 2).equals(new Vec2(1, 3))).toBe(false)
  })
})
