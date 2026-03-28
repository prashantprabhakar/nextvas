import { loadCanvasKit } from '@nexvas/renderer'
import { Stage, Path, Color } from '@nexvas/core'
import type { ColorRGBA } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Canvas + stage setup
// ---------------------------------------------------------------------------

const canvasEl  = document.getElementById('canvas')  as HTMLCanvasElement
const loadingEl = document.getElementById('loading')  as HTMLElement
const toolbarEl = document.getElementById('toolbar')  as HTMLElement

function resizeCanvas(): void {
  canvasEl.width  = window.innerWidth
  canvasEl.height = window.innerHeight
}

resizeCanvas()

const ck    = await loadCanvasKit()
const stage = new Stage({ canvas: canvasEl, canvasKit: ck, pixelRatio: window.devicePixelRatio ?? 1 })
const layer = stage.addLayer()
stage.startLoop()

loadingEl.style.display = 'none'
toolbarEl.style.display = 'flex'

// ---------------------------------------------------------------------------
// Drawing state
// ---------------------------------------------------------------------------

let isDrawing    = false
let currentPath: Path | null = null
let currentD     = ''

let strokeColor: ColorRGBA = Color.toRGBA('#1a1a2e')
let strokeWidth  = 3

/** Every finished path, in order — for undo. */
const pathHistory: Path[] = []

// ---------------------------------------------------------------------------
// Drawing logic
// ---------------------------------------------------------------------------

stage.on('mousedown', (e) => {
  isDrawing = true
  const { x, y } = e.world
  currentD = `M ${x.toFixed(1)} ${y.toFixed(1)}`
  currentPath = new Path({
    d: currentD,
    stroke: { color: strokeColor, width: strokeWidth, lineCap: 'round', lineJoin: 'round' },
  })
  layer.add(currentPath)
  stage.markDirty()
})

stage.on('mousemove', (e) => {
  if (!isDrawing || !currentPath) return
  const { x, y } = e.world
  currentD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
  currentPath.d = currentD
  stage.markDirty()
})

stage.on('mouseup', () => {
  if (!isDrawing || !currentPath) return
  isDrawing   = false
  pathHistory.push(currentPath)
  currentPath = null
  currentD    = ''
})

// Keep drawing if pointer leaves canvas mid-stroke
window.addEventListener('pointerup', () => {
  if (isDrawing && currentPath) {
    isDrawing   = false
    pathHistory.push(currentPath)
    currentPath = null
    currentD    = ''
  }
})

// ---------------------------------------------------------------------------
// Undo
// ---------------------------------------------------------------------------

function undo(): void {
  const last = pathHistory.pop()
  if (!last) return
  layer.remove(last)
  last.destroy()
  stage.markDirty()
}

document.getElementById('undo-btn')!.addEventListener('click', undo)

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo() }
})

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

document.getElementById('clear-btn')!.addEventListener('click', () => {
  for (const p of pathHistory) { layer.remove(p); p.destroy() }
  pathHistory.length = 0
  stage.markDirty()
})

// ---------------------------------------------------------------------------
// Toolbar — color swatches
// ---------------------------------------------------------------------------

const swatches = document.querySelectorAll<HTMLButtonElement>('.color-swatch')

swatches.forEach((btn) => {
  btn.addEventListener('click', () => {
    swatches.forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    strokeColor = Color.toRGBA(btn.dataset.color!)
  })
})

// ---------------------------------------------------------------------------
// Toolbar — stroke widths
// ---------------------------------------------------------------------------

const widthBtns = document.querySelectorAll<HTMLButtonElement>('.width-btn')

widthBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    widthBtns.forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    strokeWidth = Number(btn.dataset.width)
  })
})

// ---------------------------------------------------------------------------
// Resize
// ---------------------------------------------------------------------------

window.addEventListener('resize', () => {
  resizeCanvas()
  stage.markDirty()
})
