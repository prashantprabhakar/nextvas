import { describe, it, expect } from 'vitest'
import { Viewport } from '../src/Viewport.js'

describe('Viewport', () => {
  it('default state', () => {
    const vp = new Viewport()
    const s = vp.getState()
    expect(s.x).toBe(0)
    expect(s.y).toBe(0)
    expect(s.scale).toBe(1)
  })

  it('pan moves offset', () => {
    const vp = new Viewport()
    vp.pan(50, 30)
    expect(vp.x).toBe(50)
    expect(vp.y).toBe(30)
  })

  it('panTo sets absolute offset', () => {
    const vp = new Viewport()
    vp.pan(100, 100)
    vp.panTo(10, 20)
    expect(vp.x).toBe(10)
    expect(vp.y).toBe(20)
  })

  it('reset returns to origin', () => {
    const vp = new Viewport()
    vp.pan(100, 200)
    vp.zoom(2, 0, 0)
    vp.reset()
    expect(vp.x).toBe(0)
    expect(vp.y).toBe(0)
    expect(vp.scale).toBe(1)
  })

  it('zoom around origin scales correctly', () => {
    const vp = new Viewport()
    vp.zoom(2, 0, 0)
    expect(vp.scale).toBe(2)
    expect(vp.x).toBe(0)
    expect(vp.y).toBe(0)
  })

  it('zoom around center adjusts offset', () => {
    const vp = new Viewport()
    vp.zoom(2, 100, 100)
    expect(vp.scale).toBe(2)
    // zooming 2× around (100,100): x = 100 - (100-0)*2 = -100
    expect(vp.x).toBe(-100)
    expect(vp.y).toBe(-100)
  })

  it('zoom clamps to minScale', () => {
    const vp = new Viewport({ minScale: 0.5 })
    vp.zoom(0.01, 0, 0)
    expect(vp.scale).toBe(0.5)
  })

  it('zoom clamps to maxScale', () => {
    const vp = new Viewport({ maxScale: 4 })
    vp.zoom(100, 0, 0)
    expect(vp.scale).toBe(4)
  })

  it('screenToWorld converts correctly', () => {
    const vp = new Viewport()
    // Use zoom around (0,0) so pan stays at 0, then manually set pan
    vp.zoom(2, 0, 0) // scale=2, pan stays 0
    vp.panTo(50, 100) // override pan
    // screen (100, 200) → world: x = (100 - 50) / 2 = 25, y = (200 - 100) / 2 = 50
    const w = vp.screenToWorld(100, 200)
    expect(w.x).toBeCloseTo(25)
    expect(w.y).toBeCloseTo(50)
  })

  it('worldToScreen is inverse of screenToWorld', () => {
    const vp = new Viewport()
    vp.panTo(30, 40)
    vp.setScale(1.5)
    const world = vp.screenToWorld(200, 300)
    const screen = vp.worldToScreen(world.x, world.y)
    expect(screen.x).toBeCloseTo(200)
    expect(screen.y).toBeCloseTo(300)
  })

  it('getMatrix produces correct transform', () => {
    const vp = new Viewport()
    vp.panTo(10, 20)
    const m = vp.getMatrix()
    const p = m.transformPoint(0, 0)
    expect(p.x).toBeCloseTo(10)
    expect(p.y).toBeCloseTo(20)
  })

  it('setSize updates width/height', () => {
    const vp = new Viewport()
    vp.setSize(800, 600)
    expect(vp.width).toBe(800)
    expect(vp.height).toBe(600)
  })

  // ---------------------------------------------------------------------------
  // fitToRect
  // ---------------------------------------------------------------------------

  it('fitToRect centers and scales to fill viewport', () => {
    const vp = new Viewport()
    vp.setSize(800, 600)
    // Fit a 400x300 rect at (0,0) — should fill exactly with no padding
    vp.fitToRect({ x: 0, y: 0, width: 400, height: 300 }, 0)
    expect(vp.scale).toBeCloseTo(2) // 800/400 = 2, 600/300 = 2 → min = 2
    expect(vp.x).toBeCloseTo(0) // centered: 800/2 - 200*2 = 0
    expect(vp.y).toBeCloseTo(0)
  })

  it('fitToRect respects padding', () => {
    const vp = new Viewport()
    vp.setSize(800, 600)
    // 20px padding each side → available 760x560
    vp.fitToRect({ x: 0, y: 0, width: 400, height: 300 }, 20)
    // scale = min(760/400, 560/300) = min(1.9, 1.866) = 1.866
    expect(vp.scale).toBeCloseTo(560 / 300, 2)
  })

  it('fitToRect clamps to maxScale', () => {
    const vp = new Viewport({ maxScale: 1 })
    vp.setSize(800, 600)
    // Tiny rect would normally produce huge scale
    vp.fitToRect({ x: 0, y: 0, width: 10, height: 10 }, 0)
    expect(vp.scale).toBe(1)
  })

  it('fitToRect no-ops on zero-size rect', () => {
    const vp = new Viewport()
    vp.setSize(800, 600)
    vp.fitToRect({ x: 0, y: 0, width: 0, height: 0 })
    expect(vp.scale).toBe(1)
  })

  it('fitToContent delegates to fitToRect', () => {
    const vp = new Viewport()
    vp.setSize(800, 600)
    vp.fitToContent({ x: 100, y: 100, width: 200, height: 200 }, 0)
    // scale = min(800/200, 600/200) = 3
    expect(vp.scale).toBeCloseTo(3)
    // newX = 800/2 - (100 + 200/2) * 3 = 400 - 600 = -200
    // newY = 600/2 - (100 + 200/2) * 3 = 300 - 600 = -300
    expect(vp.x).toBeCloseTo(-200)
    expect(vp.y).toBeCloseTo(-300)
  })

  // ---------------------------------------------------------------------------
  // setOnChange
  // ---------------------------------------------------------------------------

  it('onChange fires on pan', () => {
    const vp = new Viewport()
    let fired = 0
    vp.setOnChange(() => {
      fired++
    })
    vp.pan(10, 10)
    expect(fired).toBe(1)
  })

  it('onChange fires on zoom', () => {
    const vp = new Viewport()
    let fired = 0
    vp.setOnChange(() => {
      fired++
    })
    vp.zoom(2, 0, 0)
    expect(fired).toBe(1)
  })

  it('onChange fires on reset', () => {
    const vp = new Viewport()
    let fired = 0
    vp.setOnChange(() => {
      fired++
    })
    vp.reset()
    expect(fired).toBe(1)
  })

  it('isAnimating is false when no animation running', () => {
    const vp = new Viewport()
    expect(vp.isAnimating()).toBe(false)
  })
})
