# Viewport (Pan & Zoom)

The viewport controls how the world-space scene maps to screen pixels. All object coordinates are in **world space**; the viewport applies a pan+zoom transform to render them on screen.

## State

```ts
const state = stage.viewport.getState()
// { x: number, y: number, scale: number, width: number, height: number }
```

`x` and `y` are the pan offsets in screen pixels. `scale` is the zoom level (1 = 100%).

## Pan and zoom

```ts
// Programmatically set pan and zoom
stage.viewport.setPosition(x, y)
stage.viewport.setScale(1.5)
stage.viewport.setState({ x, y, scale })

// Constraints (optional)
stage.viewport.setOptions({
  minScale: 0.1,
  maxScale: 10,
})
```

## Fit to content

```ts
// Zoom and pan to fit all visible objects
stage.viewport.fitToContent()

// Zoom to a specific rectangle (world space)
stage.viewport.fitToRect({ x: 0, y: 0, width: 500, height: 300 })
```

## Animated transitions

```ts
import type { AnimateToOptions } from '@nexvas/core'

const options: AnimateToOptions = {
  x: 0,
  y: 0,
  scale: 1,
  duration: 300,        // ms
  easing: 'ease-out',   // 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

stage.viewport.animateTo(options)
```

## Coordinate conversion

Pointer events give you both screen and world coordinates automatically (see [Events](/guide/events)). But you can also convert manually:

```ts
const vp = stage.viewport.getState()

// Screen → World
const worldX = (screenX - vp.x) / vp.scale
const worldY = (screenY - vp.y) / vp.scale

// World → Screen
const screenX = worldX * vp.scale + vp.x
const screenY = worldY * vp.scale + vp.y
```

## Mouse-wheel zoom

Wire up the browser wheel event to zoom toward the cursor:

```ts
canvas.addEventListener('wheel', (e) => {
  e.preventDefault()
  const vp = stage.viewport.getState()
  const factor = e.deltaY < 0 ? 1.1 : 0.9
  const newScale = Math.min(10, Math.max(0.1, vp.scale * factor))

  // Zoom toward mouse position
  const mouseX = e.offsetX
  const mouseY = e.offsetY
  const newX = mouseX - (mouseX - vp.x) * (newScale / vp.scale)
  const newY = mouseY - (mouseY - vp.y) * (newScale / vp.scale)

  stage.viewport.setState({ x: newX, y: newY, scale: newScale })
}, { passive: false })
```

::: tip
The [SelectionPlugin](/plugins/selection) handles pan-on-space-drag automatically when installed.
:::
