# Objects

Every drawable item in the scene is an object. All objects extend `BaseObject` and share a common set of properties and methods.

## Common properties

Every object accepts these in its constructor and has them as mutable properties:

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto-generated | Unique identifier |
| `name` | `string` | `''` | Human-readable label |
| `x` | `number` | `0` | X position in parent space |
| `y` | `number` | `0` | Y position in parent space |
| `width` | `number` | `0` | Width in parent space |
| `height` | `number` | `0` | Height in parent space |
| `rotation` | `number` | `0` | Rotation in degrees, around origin |
| `scaleX` | `number` | `1` | Horizontal scale |
| `scaleY` | `number` | `1` | Vertical scale |
| `skewX` | `number` | `0` | Horizontal skew |
| `skewY` | `number` | `0` | Vertical skew |
| `opacity` | `number` | `1` | 0 = transparent, 1 = opaque |
| `visible` | `boolean` | `true` | If `false`, skipped in rendering and hit testing |
| `locked` | `boolean` | `false` | If `true`, excluded from hit testing |
| `fill` | `Fill \| null` | `null` | Fill style |
| `stroke` | `StrokeStyle \| null` | `null` | Stroke style |

---

## Built-in types

### Rect

A rectangle with optional rounded corners.

```ts
import { Rect } from '@nexvas/core'

const rect = new Rect({
  x: 100, y: 100,
  width: 200, height: 120,
  cornerRadius: 12,
  fill: { type: 'solid', color: { r: 0.36, g: 0.44, b: 1, a: 1 } },
  stroke: { color: { r: 0.2, g: 0.2, b: 0.8, a: 1 }, width: 2 },
})
```

### Circle

An ellipse or circle. Set equal `width` and `height` for a perfect circle.

```ts
import { Circle } from '@nexvas/core'

const circle = new Circle({
  x: 200, y: 200,
  width: 100, height: 100,
  fill: { type: 'solid', color: { r: 1, g: 0.4, b: 0.4, a: 1 } },
})
```

### Line

A straight line between two points.

```ts
import { Line } from '@nexvas/core'

const line = new Line({
  x: 50, y: 50,
  width: 300, height: 0,   // x2 = x + width, y2 = y + height
  stroke: {
    color: { r: 0, g: 0, b: 0, a: 1 },
    width: 2,
    lineCap: 'round',
  },
})
```

### Path

An arbitrary SVG-compatible path string.

```ts
import { Path } from '@nexvas/core'

const path = new Path({
  x: 0, y: 0, width: 100, height: 100,
  d: 'M 10 80 Q 95 10 180 80',   // SVG path data
  fill: { type: 'solid', color: { r: 0.5, g: 0, b: 0.5, a: 0.5 } },
  stroke: { color: { r: 0.5, g: 0, b: 0.5, a: 1 }, width: 1.5 },
})
```

Hit testing for `Path` uses Skia's `path.contains()` — pixel-perfect, not just a bounding box check.

### Text

Single or multi-line text.

```ts
import { Text } from '@nexvas/core'

const label = new Text({
  x: 50, y: 50,
  width: 400, height: 100,
  content: 'Hello world',
  fontSize: 20,
  fontFamily: 'Noto Sans',   // must be loaded via FontManager
  fontWeight: 700,
  align: 'center',           // 'left' | 'center' | 'right'
  fill: { type: 'solid', color: { r: 0.1, g: 0.1, b: 0.1, a: 1 } },
})
```

The default font (Noto Sans) is bundled and loaded automatically. See [Fonts](/guide/fonts) to load custom fonts.

### CanvasImage

A raster image (PNG, JPEG, WebP).

```ts
import { CanvasImage } from '@nexvas/core'

const img = new CanvasImage({
  x: 0, y: 0, width: 300, height: 200,
  src: 'https://example.com/photo.jpg',
})
```

### Group

A container that composes its transform onto all children. See [Groups](/guide/groups).

```ts
import { Group, Rect, Text } from '@nexvas/core'

const card = new Group({
  x: 100, y: 100,
  width: 200, height: 120,
})

card.add(new Rect({ x: 0, y: 0, width: 200, height: 120, ... }))
card.add(new Text({ x: 10, y: 10, content: 'Card title', ... }))
layer.add(card)
```

---

## Fills

```ts
// Solid color
fill: { type: 'solid', color: { r: 0.36, g: 0.44, b: 1, a: 1 } }

// Linear gradient
fill: {
  type: 'linear-gradient',
  start: { x: 0, y: 0 },
  end:   { x: 1, y: 1 },
  stops: [
    { offset: 0,   color: { r: 0.36, g: 0.44, b: 1, a: 1 } },
    { offset: 1,   color: { r: 0.8,  g: 0.2,  b: 1, a: 1 } },
  ],
}
```

## Strokes

```ts
stroke: {
  color: { r: 0, g: 0, b: 0, a: 1 },
  width: 2,
  lineCap: 'round',      // 'butt' | 'round' | 'square'
  lineJoin: 'round',     // 'miter' | 'round' | 'bevel'
  dash: [8, 4],          // dash pattern
  dashOffset: 0,
}
```

---

## Mutating objects

All properties are mutable. Mutations automatically mark the stage dirty:

```ts
rect.x = 200
rect.fill = { type: 'solid', color: { r: 1, g: 0, b: 0, a: 1 } }
rect.visible = false
```

## World transform

Get the final world-space transform matrix for any object (including Group nesting):

```ts
const matrix = obj.getWorldTransform()    // Matrix3x3
const bbox   = obj.getWorldBoundingBox()  // BoundingBox
```
