import { describe, it, expect } from 'vitest'
import { Rect } from '../../src/objects/Rect.js'

describe('BaseObject — getLocalTransform() caching (NV-021)', () => {
  it('returns the same reference on consecutive calls', () => {
    const r = new Rect({ x: 10, y: 20, width: 100, height: 50, rotation: 45 })
    const m1 = r.getLocalTransform()
    const m2 = r.getLocalTransform()
    expect(m1).toBe(m2) // same instance, not just equal values
  })

  it('invalidates cache when x changes', () => {
    const r = new Rect({ x: 0, y: 0, width: 10, height: 10 })
    const before = r.getLocalTransform()
    r.x = 5
    const after = r.getLocalTransform()
    expect(after).not.toBe(before)
    expect(after.values[2]).toBe(5) // tx
  })

  it('invalidates cache when y changes', () => {
    const r = new Rect({ x: 0, y: 0, width: 10, height: 10 })
    const before = r.getLocalTransform()
    r.y = 7
    const after = r.getLocalTransform()
    expect(after).not.toBe(before)
    expect(after.values[5]).toBe(7) // ty
  })

  it('invalidates cache when rotation changes', () => {
    const r = new Rect({ x: 0, y: 0, width: 10, height: 10 })
    const before = r.getLocalTransform()
    r.rotation = 90
    const after = r.getLocalTransform()
    expect(after).not.toBe(before)
  })

  it('invalidates cache when scaleX changes', () => {
    const r = new Rect({ x: 0, y: 0, width: 10, height: 10 })
    const before = r.getLocalTransform()
    r.scaleX = 2
    const after = r.getLocalTransform()
    expect(after).not.toBe(before)
    // For identity rotation, scale matrix a = scaleX
    expect(after.values[0]).toBe(2)
  })

  it('invalidates cache when scaleY changes', () => {
    const r = new Rect({ x: 0, y: 0, width: 10, height: 10 })
    const before = r.getLocalTransform()
    r.scaleY = 3
    const after = r.getLocalTransform()
    expect(after).not.toBe(before)
    expect(after.values[4]).toBe(3)
  })

  it('invalidates cache when skewX changes', () => {
    const r = new Rect({ x: 0, y: 0, width: 10, height: 10 })
    const before = r.getLocalTransform()
    r.skewX = 0.5
    const after = r.getLocalTransform()
    expect(after).not.toBe(before)
  })

  it('invalidates cache when skewY changes', () => {
    const r = new Rect({ x: 0, y: 0, width: 10, height: 10 })
    const before = r.getLocalTransform()
    r.skewY = 0.5
    const after = r.getLocalTransform()
    expect(after).not.toBe(before)
  })

  it('returns correct matrix values after invalidation', () => {
    const r = new Rect({ x: 10, y: 20, width: 50, height: 50, scaleX: 2, scaleY: 3 })
    const m1 = r.getLocalTransform()
    expect(m1.values[2]).toBe(10) // tx
    expect(m1.values[5]).toBe(20) // ty
    expect(m1.values[0]).toBe(2)  // scaleX (no rotation)
    expect(m1.values[4]).toBe(3)  // scaleY (no rotation)

    r.x = 50
    r.scaleX = 4
    const m2 = r.getLocalTransform()
    expect(m2.values[2]).toBe(50) // updated tx
    expect(m2.values[0]).toBe(4)  // updated scaleX
    expect(m2.values[5]).toBe(20) // ty unchanged
    expect(m2.values[4]).toBe(3)  // scaleY unchanged
  })
})
