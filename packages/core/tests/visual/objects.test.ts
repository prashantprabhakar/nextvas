/**
 * Visual regression tests for all built-in object types.
 *
 * Each test renders an object to a real WebGL canvas in Chromium and compares
 * the pixel output against a committed PNG baseline.
 *
 * First run: baselines are generated in __snapshots__/.
 * To update baselines: pnpm -F @nexvas/core test:visual:update
 */

import { describe, it, afterEach, expect } from 'vitest'
import { page } from 'vitest/browser'
import { Rect } from '../../src/objects/Rect.js'
import { Circle } from '../../src/objects/Circle.js'
import { Line } from '../../src/objects/Line.js'
import { Path } from '../../src/objects/Path.js'
import { Text } from '../../src/objects/Text.js'
import { Group } from '../../src/objects/Group.js'
import { createTestStage, destroyTestStage, type TestStage } from './helpers.js'
import type { Fill, StrokeStyle } from '../../src/types.js'

// ---------------------------------------------------------------------------
// Common styles
// ---------------------------------------------------------------------------

const RED: Fill    = { type: 'solid', color: { r: 0.84, g: 0.22, b: 0.22, a: 1 } }
const BLUE: Fill   = { type: 'solid', color: { r: 0.22, g: 0.44, b: 0.9,  a: 1 } }
const GREEN: Fill  = { type: 'solid', color: { r: 0.2,  g: 0.72, b: 0.38, a: 1 } }
const BLACK: Fill  = { type: 'solid', color: { r: 0.1,  g: 0.1,  b: 0.1,  a: 1 } }
const STROKE: StrokeStyle = { color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, width: 2 }
const GRAD: Fill = {
  type: 'linear-gradient',
  start: { x: 0, y: 0 },
  end:   { x: 1, y: 0 },
  stops: [
    { offset: 0, color: { r: 0.36, g: 0.44, b: 1,  a: 1 } },
    { offset: 1, color: { r: 0.8,  g: 0.2,  b: 0.9, a: 1 } },
  ],
}

// ---------------------------------------------------------------------------
// Test lifecycle
// ---------------------------------------------------------------------------

let ts: TestStage

afterEach(() => {
  if (ts) destroyTestStage(ts)
})

// ---------------------------------------------------------------------------
// Rect
// ---------------------------------------------------------------------------

describe('Rect — visual', () => {
  it('solid fill', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({ x: 50, y: 50, width: 300, height: 200, fill: BLUE }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('rect-solid-fill.png')
  })

  it('rounded corners', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({ x: 50, y: 50, width: 300, height: 200, cornerRadius: 24, fill: RED }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('rect-rounded.png')
  })

  it('stroke only', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({ x: 50, y: 50, width: 300, height: 200, stroke: STROKE }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('rect-stroke-only.png')
  })

  it('fill + stroke + corner radius', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({
      x: 50, y: 50, width: 300, height: 200,
      cornerRadius: 16,
      fill: GREEN,
      stroke: { color: { r: 0.1, g: 0.4, b: 0.2, a: 1 }, width: 3 },
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('rect-fill-stroke-corners.png')
  })

  it('linear gradient fill', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({ x: 50, y: 50, width: 300, height: 200, fill: GRAD }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('rect-gradient.png')
  })

  it('rotated 30°', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({
      x: 100, y: 75, width: 200, height: 120,
      rotation: 30,
      fill: BLUE,
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('rect-rotated.png')
  })

  it('semi-transparent', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({ x: 30, y: 30, width: 200, height: 200, fill: RED }))
    ts.layer.add(new Rect({
      x: 130, y: 130, width: 200, height: 200,
      fill: { type: 'solid', color: { r: 0.22, g: 0.44, b: 0.9, a: 0.5 } },
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('rect-transparency.png')
  })
})

// ---------------------------------------------------------------------------
// Circle
// ---------------------------------------------------------------------------

describe('Circle — visual', () => {
  it('solid fill', async () => {
    ts = await createTestStage()
    ts.layer.add(new Circle({ x: 100, y: 50, width: 200, height: 200, fill: RED }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('circle-solid-fill.png')
  })

  it('ellipse (non-equal dimensions)', async () => {
    ts = await createTestStage()
    ts.layer.add(new Circle({ x: 50, y: 100, width: 300, height: 100, fill: GREEN, stroke: STROKE }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('circle-ellipse.png')
  })

  it('stroke only', async () => {
    ts = await createTestStage()
    ts.layer.add(new Circle({
      x: 100, y: 50, width: 200, height: 200,
      stroke: { color: { r: 0.84, g: 0.22, b: 0.22, a: 1 }, width: 4 },
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('circle-stroke-only.png')
  })
})

// ---------------------------------------------------------------------------
// Line
// ---------------------------------------------------------------------------

describe('Line — visual', () => {
  it('horizontal line', async () => {
    ts = await createTestStage()
    ts.layer.add(new Line({
      x: 50, y: 150, width: 300, height: 0,
      stroke: { color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, width: 3 },
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('line-horizontal.png')
  })

  it('diagonal line', async () => {
    ts = await createTestStage()
    ts.layer.add(new Line({
      x: 50, y: 50, width: 300, height: 200,
      stroke: { color: { r: 0.22, g: 0.44, b: 0.9, a: 1 }, width: 2 },
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('line-diagonal.png')
  })

  it('dashed line', async () => {
    ts = await createTestStage()
    ts.layer.add(new Line({
      x: 50, y: 150, width: 300, height: 0,
      stroke: { color: { r: 0.1, g: 0.1, b: 0.1, a: 1 }, width: 2, dash: [12, 6] },
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('line-dashed.png')
  })

  it('round cap thick line', async () => {
    ts = await createTestStage()
    ts.layer.add(new Line({
      x: 50, y: 150, width: 300, height: 0,
      stroke: { color: { r: 0.84, g: 0.22, b: 0.22, a: 1 }, width: 16, lineCap: 'round' },
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('line-round-cap.png')
  })
})

// ---------------------------------------------------------------------------
// Path
// ---------------------------------------------------------------------------

describe('Path — visual', () => {
  it('bezier curve', async () => {
    ts = await createTestStage()
    ts.layer.add(new Path({
      x: 0, y: 0, width: 400, height: 300,
      d: 'M 50 250 C 100 50 300 50 350 250',
      stroke: { color: { r: 0.22, g: 0.44, b: 0.9, a: 1 }, width: 3 },
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('path-bezier.png')
  })

  it('filled polygon', async () => {
    ts = await createTestStage()
    ts.layer.add(new Path({
      x: 0, y: 0, width: 400, height: 300,
      d: 'M 200 40 L 350 220 L 50 220 Z',
      fill: GREEN,
      stroke: { color: { r: 0.1, g: 0.4, b: 0.2, a: 1 }, width: 2 },
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('path-filled-polygon.png')
  })

  it('star shape', async () => {
    ts = await createTestStage()
    ts.layer.add(new Path({
      x: 0, y: 0, width: 400, height: 300,
      d: 'M 200 30 L 230 120 L 320 120 L 250 175 L 275 260 L 200 210 L 125 260 L 150 175 L 80 120 L 170 120 Z',
      fill: { type: 'solid', color: { r: 0.97, g: 0.77, b: 0.12, a: 1 } },
      stroke: { color: { r: 0.8, g: 0.6, b: 0.05, a: 1 }, width: 2 },
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('path-star.png')
  })
})

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

describe('Text — visual', () => {
  it('single line', async () => {
    ts = await createTestStage()
    ts.layer.add(new Text({
      x: 40, y: 120, width: 320, height: 60,
      content: 'Hello, NexVas!',
      fontSize: 28,
      fill: BLACK,
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('text-single-line.png')
  })

  it('multiline wrapping', async () => {
    ts = await createTestStage()
    ts.layer.add(new Text({
      x: 40, y: 30, width: 320, height: 240,
      content: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.',
      fontSize: 18,
      fill: BLACK,
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('text-multiline.png')
  })

  it('bold + center aligned', async () => {
    ts = await createTestStage()
    ts.layer.add(new Text({
      x: 40, y: 120, width: 320, height: 60,
      content: 'Bold Centered Text',
      fontSize: 28,
      fontWeight: 700,
      align: 'center',
      fill: BLUE,
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('text-bold-center.png')
  })

  it('large font size', async () => {
    ts = await createTestStage()
    ts.layer.add(new Text({
      x: 20, y: 80, width: 360, height: 140,
      content: 'Big Text',
      fontSize: 72,
      fill: RED,
    }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('text-large.png')
  })
})

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------

describe('Group — visual', () => {
  it('group with child rect and circle', async () => {
    ts = await createTestStage()
    const group = new Group({ x: 50, y: 50, width: 300, height: 200 })
    group.add(new Rect({ x: 0, y: 0, width: 300, height: 200, fill: BLUE }))
    group.add(new Circle({ x: 100, y: 50, width: 100, height: 100, fill: RED }))
    ts.layer.add(group)
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('group-basic.png')
  })

  it('rotated group', async () => {
    ts = await createTestStage()
    const group = new Group({ x: 100, y: 50, width: 200, height: 100, rotation: 20 })
    group.add(new Rect({ x: 0, y: 0, width: 200, height: 100, fill: GREEN }))
    group.add(new Rect({ x: 150, y: 10, width: 40, height: 80, fill: RED }))
    ts.layer.add(group)
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('group-rotated.png')
  })

  it('clipped group', async () => {
    ts = await createTestStage()
    const group = new Group({ x: 100, y: 75, width: 200, height: 150, clip: true })
    group.add(new Rect({ x: 0, y: 0, width: 200, height: 150, fill: BLUE }))
    // This circle extends outside the group bounds — should be clipped
    group.add(new Circle({ x: 120, y: 80, width: 160, height: 160, fill: RED }))
    ts.layer.add(group)
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('group-clipped.png')
  })
})

// ---------------------------------------------------------------------------
// Transforms — shared across types
// ---------------------------------------------------------------------------

describe('Transforms — visual', () => {
  it('scaled rect', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({ x: 100, y: 75, width: 100, height: 75, scaleX: 2, scaleY: 2, fill: BLUE }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('transform-scaled.png')
  })

  it('skewed rect', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({ x: 100, y: 100, width: 200, height: 100, skewX: 20, fill: GREEN }))
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('transform-skewed.png')
  })

  it('nested group transforms compose', async () => {
    ts = await createTestStage()
    const outer = new Group({ x: 50, y: 50, width: 300, height: 200, rotation: 10 })
    const inner = new Group({ x: 50, y: 25, width: 200, height: 100, rotation: 15 })
    inner.add(new Rect({ x: 0, y: 0, width: 200, height: 100, fill: BLUE }))
    outer.add(inner)
    ts.layer.add(outer)
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('transform-nested-groups.png')
  })
})
