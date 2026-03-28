# GridPlugin

Renders a background grid (dots or lines) and optionally snaps objects to grid intersections.

## Install

```ts
import { GridPlugin } from '@nexvas/plugin-grid'

stage.use(GridPlugin, {
  type: 'lines',     // 'lines' | 'dots'
  cellSize: 20,      // grid spacing in world units
  snap: true,        // snap objects to grid when dragging
})
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `type` | `'lines' \| 'dots'` | `'lines'` | Visual style |
| `cellSize` | `number` | `20` | Grid cell size in world units |
| `snap` | `boolean` | `false` | Snap dragged objects to grid |
| `snapTolerance` | `number` | `8` | Snap within this many screen pixels |
| `color` | `ColorRGBA` | `{ r:0.85, g:0.85, b:0.85, a:1 }` | Grid line / dot color |
| `dotRadius` | `number` | `1.5` | Dot size when `type: 'dots'` |

## Runtime configuration

```ts
import type { GridPluginAPI } from '@nexvas/plugin-grid'

const grid = (stage as GridPluginAPI).grid

grid.cellSize = 40
grid.snap = false
grid.color = { r: 0.9, g: 0.9, b: 1, a: 1 }
```

## Toggling visibility

```ts
grid.visible = false   // hide the grid but keep snap behavior
```
