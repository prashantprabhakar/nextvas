/**
 * Visual regression tests for Stage-level rendering behaviours:
 * viewport pan/zoom, multiple layers, opacity, visibility.
 */

import { describe, it, afterEach, expect } from 'vitest'
import { page } from 'vitest/browser'
import { Rect } from '../../src/objects/Rect.js'
import { Circle } from '../../src/objects/Circle.js'
import { createTestStage, destroyTestStage, type TestStage } from './helpers.js'
import type { Fill } from '../../src/types.js'

const RED:   Fill = { type: 'solid', color: { r: 0.84, g: 0.22, b: 0.22, a: 1 } }
const BLUE:  Fill = { type: 'solid', color: { r: 0.22, g: 0.44, b: 0.9,  a: 1 } }
const GREEN: Fill = { type: 'solid', color: { r: 0.2,  g: 0.72, b: 0.38, a: 1 } }

let ts: TestStage

afterEach(() => {
  if (ts) destroyTestStage(ts)
})

describe('Stage — multi-layer rendering', () => {
  it('later layers render on top', async () => {
    ts = await createTestStage()
    const bottom = ts.stage.addLayer({ name: 'bottom' })
    const top    = ts.stage.addLayer({ name: 'top' })

    // Two overlapping rects — top layer should cover bottom
    bottom.add(new Rect({ x: 50,  y: 75,  width: 200, height: 150, fill: RED  }))
    top.add(   new Rect({ x: 150, y: 75,  width: 200, height: 150, fill: BLUE }))

    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('stage-layer-order.png')
  })

  it('hidden layer is not rendered', async () => {
    ts = await createTestStage()
    const visible = ts.stage.addLayer({ name: 'visible' })
    const hidden  = ts.stage.addLayer({ name: 'hidden', visible: false })

    visible.add(new Rect({ x: 50,  y: 75,  width: 300, height: 150, fill: GREEN }))
    hidden.add( new Rect({ x: 100, y: 100, width: 200, height: 100, fill: RED   }))

    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('stage-hidden-layer.png')
  })
})

describe('Viewport — visual', () => {
  it('panned viewport shifts all objects', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({ x: 0, y: 0, width: 100, height: 80, fill: BLUE }))
    ts.layer.add(new Circle({ x: 50, y: 100, width: 80, height: 80, fill: RED }))

    ts.stage.viewport.setPosition(100, 60)
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('viewport-panned.png')
  })

  it('zoomed viewport scales all objects', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({ x: 50, y: 50, width: 150, height: 100, fill: GREEN }))

    ts.stage.viewport.setScale(1.5)
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('viewport-zoomed-in.png')
  })

  it('zoomed out shows more scene', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({ x: 0,  y: 0,   width: 400, height: 150, fill: BLUE  }))
    ts.layer.add(new Rect({ x: 0,  y: 150, width: 400, height: 150, fill: GREEN }))

    ts.stage.viewport.setScale(0.5)
    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('viewport-zoomed-out.png')
  })
})

describe('Object visibility and opacity', () => {
  it('invisible object is not drawn', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({ x: 50, y: 50, width: 200, height: 150, fill: BLUE }))
    ts.layer.add(new Rect({ x: 100, y: 75, width: 200, height: 150, fill: RED, visible: false }))

    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('visibility-hidden-object.png')
  })

  it('opacity 0.5 produces semi-transparent object', async () => {
    ts = await createTestStage()
    ts.layer.add(new Rect({ x: 50,  y: 75, width: 300, height: 150, fill: RED  }))
    ts.layer.add(new Rect({ x: 100, y: 75, width: 200, height: 150, fill: BLUE, opacity: 0.5 }))

    ts.snapshot()
    await expect(page.getByTestId('canvas')).toMatchScreenshot('opacity-half.png')
  })
})
