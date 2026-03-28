# Quick Start

Draw your first shape in under 5 minutes.

## 1. Set up the canvas

Add a `<canvas>` element to your HTML:

```html
<canvas id="canvas" width="800" height="600"></canvas>
```

## 2. Initialize CanvasKit

CanvasKit must be loaded once before creating a Stage. Call `loadCanvasKit()` and await it:

```ts
import { loadCanvasKit } from '@nexvas/renderer'
import { Stage, Rect } from '@nexvas/core'

const ck = await loadCanvasKit()
```

## 3. Create a Stage

```ts
const canvas = document.getElementById('canvas') as HTMLCanvasElement

const stage = new Stage({ canvas, canvasKit: ck })
```

## 4. Add a layer and draw a rectangle

```ts
const layer = stage.addLayer()

const rect = new Rect({
  x: 100,
  y: 100,
  width: 200,
  height: 120,
  fill: { type: 'solid', color: { r: 0.36, g: 0.44, b: 1, a: 1 } },
  stroke: { color: { r: 0.2, g: 0.2, b: 0.8, a: 1 }, width: 2 },
  cornerRadius: 8,
})

layer.add(rect)
```

## 5. Start the render loop

```ts
stage.startLoop()
```

That's it. You should see a rounded blue rectangle on the canvas.

## Full example

```ts
import { loadCanvasKit } from '@nexvas/renderer'
import { Stage, Rect, Circle, Text } from '@nexvas/core'

const ck = await loadCanvasKit()
const canvas = document.getElementById('canvas') as HTMLCanvasElement
const stage = new Stage({ canvas, canvasKit: ck })

const layer = stage.addLayer({ name: 'main' })

// Rectangle
layer.add(new Rect({
  x: 50, y: 50, width: 200, height: 100,
  fill: { type: 'solid', color: { r: 0.36, g: 0.44, b: 1, a: 1 } },
  cornerRadius: 8,
}))

// Circle
layer.add(new Circle({
  x: 320, y: 50, width: 100, height: 100,
  fill: { type: 'solid', color: { r: 1, g: 0.4, b: 0.4, a: 1 } },
}))

// Text
layer.add(new Text({
  x: 50, y: 200, width: 400, height: 40,
  content: 'Hello, NexVas!',
  fontSize: 24,
  fill: { type: 'solid', color: { r: 0.1, g: 0.1, b: 0.1, a: 1 } },
}))

stage.startLoop()
```

## Next: add interactivity

Install the selection and drag plugins to make objects interactive:

```ts
import { SelectionPlugin } from '@nexvas/plugin-selection'
import { DragPlugin } from '@nexvas/plugin-drag'

stage.use(SelectionPlugin).use(DragPlugin)
```

Objects are now clickable, draggable, and resizable. See the [Events guide](/guide/events) and [SelectionPlugin docs](/plugins/selection) for more.
