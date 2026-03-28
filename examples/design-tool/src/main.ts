import { checkSupport, loadCanvasKit } from '@nexvas/renderer'
import { Stage, Rect, Circle, Text, Layer, type Fill } from '@nexvas/core'
import { SelectionPlugin } from '@nexvas/plugin-selection'
import { HistoryPlugin, type HistoryCommand } from '@nexvas/plugin-history'
import { GridPlugin } from '@nexvas/plugin-grid'
import { GuidesPlugin } from '@nexvas/plugin-guides'

// ---------------------------------------------------------------------------
// Support check
// ---------------------------------------------------------------------------

const support = checkSupport()
if (!support.supported) {
  document.body.innerHTML = `<p style="color:red;padding:2rem;font-size:1rem">${support.reason}</p>`
  throw new Error(support.reason)
}

// ---------------------------------------------------------------------------
// Canvas sizing
// ---------------------------------------------------------------------------

const wrap = document.getElementById('canvas-wrap')!
const canvas = document.getElementById('canvas') as HTMLCanvasElement

function resize(): void {
  canvas.width = Math.floor(wrap.clientWidth * devicePixelRatio)
  canvas.height = Math.floor(wrap.clientHeight * devicePixelRatio)
}
resize()
window.addEventListener('resize', () => {
  resize()
  stage.resize(canvas.width, canvas.height)
})

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const ck = await loadCanvasKit()
const stage = new Stage({ canvas, canvasKit: ck })
const layer = stage.addLayer({ name: 'main' })

// Plugins
const selection = new SelectionPlugin()
const history = new HistoryPlugin()
const grid = new GridPlugin({ type: 'dots', cellSize: 24, color: { r: 1, g: 1, b: 1, a: 0.12 } })
const guides = new GuidesPlugin({ snapThreshold: 8 })

stage.use(selection)
stage.use(history)
stage.use(guides)
// Grid off by default — toggled by button
let gridEnabled = false

stage.startLoop()

// ---------------------------------------------------------------------------
// Seed content
// ---------------------------------------------------------------------------

const colors: Fill[] = [
  { type: 'solid', color: { r: 0.18, g: 0.47, b: 1, a: 1 } },
  { type: 'solid', color: { r: 1, g: 0.35, b: 0.25, a: 1 } },
  { type: 'solid', color: { r: 0.15, g: 0.78, b: 0.44, a: 1 } },
  { type: 'solid', color: { r: 0.96, g: 0.8, b: 0.1, a: 1 } },
]

function randomFill(): Fill {
  return colors[Math.floor(Math.random() * colors.length)]!
}

layer.add(
  new Rect({
    x: 80,
    y: 80,
    width: 220,
    height: 140,
    fill: { type: 'solid', color: { r: 0.18, g: 0.47, b: 1, a: 1 } },
    cornerRadius: 12,
    name: 'Blue card',
  }),
)
layer.add(
  new Circle({
    x: 380,
    y: 90,
    width: 130,
    height: 130,
    fill: { type: 'solid', color: { r: 1, g: 0.35, b: 0.25, a: 1 } },
    name: 'Red circle',
  }),
)
layer.add(
  new Rect({
    x: 200,
    y: 290,
    width: 180,
    height: 100,
    fill: {
      type: 'linear-gradient',
      stops: [
        { offset: 0, color: { r: 0.55, g: 0.2, b: 1, a: 1 } },
        { offset: 1, color: { r: 1, g: 0.4, b: 0.8, a: 1 } },
      ],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
    cornerRadius: 8,
    name: 'Gradient rect',
  }),
)
layer.add(
  new Text({
    x: 80,
    y: 450,
    width: 460,
    height: 36,
    text: 'NexVas — click, drag, delete, undo',
    fontSize: 16,
    fill: { type: 'solid', color: { r: 0.8, g: 0.8, b: 0.8, a: 1 } },
    name: 'Hint text',
  }),
)

// ---------------------------------------------------------------------------
// Tool state
// ---------------------------------------------------------------------------

type Tool = 'select' | 'rect' | 'circle' | 'text'
let activeTool: Tool = 'select'

function setTool(t: Tool): void {
  activeTool = t
  document.querySelectorAll('.tool-btn').forEach((b) => b.classList.remove('active'))
  document.getElementById(`btn-${t}`)?.classList.add('active')
}

// ---------------------------------------------------------------------------
// Drawing new objects on click (when a shape tool is active)
// ---------------------------------------------------------------------------

let drawStart: { x: number; y: number } | null = null

canvas.addEventListener('mousedown', (e) => {
  if (activeTool === 'select') return
  const vp = stage.viewport
  const world = vp.screenToWorld(e.clientX * devicePixelRatio, e.clientY * devicePixelRatio)
  drawStart = world
})

canvas.addEventListener('mouseup', (e) => {
  if (activeTool === 'select' || !drawStart) return
  const vp = stage.viewport
  const world = vp.screenToWorld(e.clientX * devicePixelRatio, e.clientY * devicePixelRatio)
  const x = Math.min(drawStart.x, world.x)
  const y = Math.min(drawStart.y, world.y)
  const w = Math.max(20, Math.abs(world.x - drawStart.x))
  const h = Math.max(20, Math.abs(world.y - drawStart.y))
  drawStart = null

  const fill = randomFill()

  let obj: Rect | Circle | Text
  if (activeTool === 'rect') {
    obj = new Rect({ x, y, width: w, height: h, fill, cornerRadius: 6 })
  } else if (activeTool === 'circle') {
    obj = new Circle({ x, y, width: w, height: h, fill })
  } else {
    obj = new Text({ x, y, width: w, height: Math.max(h, 30), text: 'Label', fontSize: 18, fill })
  }

  const addCmd: HistoryCommand = {
    label: `Add ${activeTool}`,
    apply() {
      layer.add(obj)
    },
    undo() {
      layer.remove(obj)
    },
  }
  history.record(addCmd)
  selection.select(obj)
  setTool('select')
})

// ---------------------------------------------------------------------------
// Scroll to zoom, space+drag to pan
// ---------------------------------------------------------------------------

let spaceDown = false

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
    const vp = stage.viewport
    vp.zoom(factor, e.clientX * devicePixelRatio, e.clientY * devicePixelRatio)
    stage.markDirty()
  },
  { passive: false },
)

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    spaceDown = true
    canvas.style.cursor = 'grab'
  }
  if (e.key === 'v' || e.key === 'V') setTool('select')
  if (e.key === 'r' || e.key === 'R') setTool('rect')
  if (e.key === 'c' || e.key === 'C') setTool('circle')
  if (e.key === 't' || e.key === 'T') setTool('text')
  if (e.key === 'f' || e.key === 'F') fitAll()
  if (e.key === 'g' || e.key === 'G') toggleGrid()
})
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    spaceDown = false
    canvas.style.cursor = ''
  }
})

let panStart: { x: number; y: number; vpX: number; vpY: number } | null = null
canvas.addEventListener('mousedown', (e) => {
  if (!spaceDown) return
  panStart = { x: e.clientX, y: e.clientY, vpX: stage.viewport.x, vpY: stage.viewport.y }
  canvas.style.cursor = 'grabbing'
})
canvas.addEventListener('mousemove', (e) => {
  if (!panStart) return
  const dx = (e.clientX - panStart.x) * devicePixelRatio
  const dy = (e.clientY - panStart.y) * devicePixelRatio
  stage.viewport.panTo(panStart.vpX + dx, panStart.vpY + dy)
  stage.markDirty()
})
canvas.addEventListener('mouseup', () => {
  panStart = null
  canvas.style.cursor = spaceDown ? 'grab' : ''
})

// ---------------------------------------------------------------------------
// Toolbar buttons
// ---------------------------------------------------------------------------

document.getElementById('btn-select')!.addEventListener('click', () => setTool('select'))
document.getElementById('btn-rect')!.addEventListener('click', () => setTool('rect'))
document.getElementById('btn-circle')!.addEventListener('click', () => setTool('circle'))
document.getElementById('btn-text')!.addEventListener('click', () => setTool('text'))

document.getElementById('btn-undo')!.addEventListener('click', () => history.undo())
document.getElementById('btn-redo')!.addEventListener('click', () => history.redo())
document.getElementById('btn-fit')!.addEventListener('click', fitAll)
document.getElementById('btn-grid')!.addEventListener('click', toggleGrid)

function fitAll(): void {
  const bb = stage.getBoundingBox()
  stage.viewport.fitToContent(bb, 60, true)
  stage.markDirty()
}

function toggleGrid(): void {
  gridEnabled = !gridEnabled
  if (gridEnabled) {
    stage.use(grid)
    document.getElementById('btn-grid')?.classList.add('active')
  } else {
    stage.unuse(grid)
    document.getElementById('btn-grid')?.classList.remove('active')
  }
}
