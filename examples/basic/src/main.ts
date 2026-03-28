import { loadCanvasKit, checkSupport } from '@nexvas/renderer'
import { Stage, Rect, Circle, Text } from '@nexvas/core'

const support = checkSupport()
if (!support.supported) {
  document.body.innerHTML = `<p style="color:red;padding:2rem">${support.reason}</p>`
  throw new Error(support.reason)
}

const canvas = document.getElementById('canvas') as HTMLCanvasElement

// Load CanvasKit (cached after first call)
const ck = await loadCanvasKit()

// Create the stage
const stage = new Stage({ canvas, canvasKit: ck })
const layer = stage.addLayer({ name: 'main' })

// Add some objects
layer.add(
  new Rect({
    x: 50,
    y: 50,
    width: 200,
    height: 120,
    fill: { type: 'solid', color: { r: 0.2, g: 0.5, b: 1, a: 1 } },
    stroke: { color: { r: 0, g: 0, b: 0, a: 1 }, width: 2 },
    cornerRadius: 8,
  }),
)

layer.add(
  new Circle({
    x: 350,
    y: 80,
    width: 100,
    height: 100,
    fill: { type: 'solid', color: { r: 1, g: 0.4, b: 0.2, a: 1 } },
  }),
)

layer.add(
  new Text({
    x: 50,
    y: 220,
    width: 400,
    height: 40,
    text: 'NexVas — powered by CanvasKit (Skia)',
    fontSize: 18,
    fill: { type: 'solid', color: { r: 0.1, g: 0.1, b: 0.1, a: 1 } },
  }),
)

// Start the render loop
stage.startLoop()
