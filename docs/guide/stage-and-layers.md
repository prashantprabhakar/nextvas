# Stage & Layers

## Stage

The `Stage` is the root of everything. It owns the `<canvas>` element, the CanvasKit WebGL surface, the viewport, the event system, and the plugin registry.

```ts
import { loadCanvasKit } from '@nexvas/renderer'
import { Stage } from '@nexvas/core'

const ck = await loadCanvasKit()
const stage = new Stage({
  canvas,       // HTMLCanvasElement
  canvasKit: ck,
  pixelRatio: window.devicePixelRatio, // optional, defaults to window.devicePixelRatio
})
```

### Render loop

```ts
stage.startLoop()   // start requestAnimationFrame loop
stage.stopLoop()    // stop the loop
stage.render()      // render one frame synchronously (useful for tests/screenshots)
```

The loop uses a **dirty flag**: if nothing changed since the last frame, it skips the render. Mutations to any object automatically mark the stage dirty.

### Cleanup

Always call `destroy()` when you're done to release the WebGL surface and remove event listeners:

```ts
stage.destroy()
```

---

## Layers

Layers control **render order (z-index)**. Objects on later layers render on top of objects on earlier layers. A typical app has 2–3 layers:

```ts
const contentLayer = stage.addLayer({ name: 'content' })
const uiLayer     = stage.addLayer({ name: 'ui' })      // renders on top
```

### Adding and removing layers

```ts
const layer = stage.addLayer({ name: 'background' })

stage.removeLayer(layer)
```

### Layer properties

```ts
layer.visible = false    // hide the entire layer
layer.locked  = true     // prevent hit-testing on all objects in this layer
```

### Finding objects

```ts
// Find by ID across all layers
const obj = stage.getObjectById('my-object-id')

// Find by ID within a layer
const obj = layer.getById('my-object-id')

// All objects in a layer
const objects = layer.objects   // readonly BaseObject[]
```

---

## Scene graph

The full tree looks like this:

```
Stage
├── Layer (background)
│   └── Rect (sky gradient)
├── Layer (content)
│   ├── Group (diagram nodes)
│   │   ├── Rect
│   │   └── Text
│   └── Circle
└── Layer (ui-overlay)
    └── Rect (selection box)
```

Rendering traverses this tree back-to-front. Plugins can add pre-render and post-render passes (e.g. grid behind content, selection handles in front).
