# Events

Objects and the Stage emit pointer events that are hit-tested against the scene graph. All handlers receive both screen-space and world-space coordinates.

## Object events

```ts
rect.on('click', (e) => {
  console.log('clicked', e.world.x, e.world.y)
})

rect.on('mouseenter', (e) => {
  rect.fill = { type: 'solid', color: { r: 1, g: 0.5, b: 0, a: 1 } }
})

rect.on('mouseleave', (e) => {
  rect.fill = { type: 'solid', color: { r: 0.36, g: 0.44, b: 1, a: 1 } }
})
```

## Available events

| Event | Description |
|---|---|
| `click` | Single click / tap |
| `dblclick` | Double click / double-tap |
| `mousedown` | Pointer pressed |
| `mouseup` | Pointer released |
| `mousemove` | Pointer moved over object |
| `mouseenter` | Pointer entered object bounds |
| `mouseleave` | Pointer left object bounds |
| `dragstart` | Drag began (requires DragPlugin) |
| `drag` | Dragging in progress |
| `dragend` | Drag ended |
| `tap` | Touch tap |
| `doubletap` | Touch double-tap |

## Event object

Every handler receives a `CanvasPointerEvent`:

```ts
rect.on('click', (e) => {
  e.screen.x      // X in canvas pixel space
  e.screen.y      // Y in canvas pixel space
  e.world.x       // X in world space (accounting for viewport pan/zoom)
  e.world.y       // Y in world space
  e.originalEvent // The native PointerEvent / MouseEvent / TouchEvent
  e.stopPropagation()  // stop bubbling up the scene graph
})
```

## Event bubbling

Events bubble up the scene graph: **object → group → layer → stage**. Call `e.stopPropagation()` to stop at any level.

```ts
// Listen at stage level for any click anywhere
stage.on('click', (e) => {
  console.log('stage clicked at world:', e.world)
})

// Stop a child from propagating to the stage
child.on('click', (e) => {
  e.stopPropagation()
})
```

## Stage-level events

```ts
// Fired after every rendered frame
stage.on('render', ({ timestamp }) => { })

// Fired when any object is added to any layer
stage.on('object:added', ({ object }) => { })

// Fired when any object is removed from any layer
stage.on('object:removed', ({ object }) => { })

// Mouse wheel on the canvas
stage.on('wheel', (e) => {
  console.log(e.deltaX, e.deltaY)
})
```

## Removing listeners

```ts
const handler = (e: CanvasPointerEvent) => { ... }
rect.on('click', handler)

// Later:
rect.off('click', handler)
```

## Hit testing

Hit testing traverses the scene graph from **top to bottom** (highest z-order first):

1. Bounding box quick-reject (O(1))
2. If bounding box passes — precise check:
   - `Rect`, `Circle`, `Text`, `Image`, `Group`: bounding box is sufficient
   - `Path`, `Line`: uses Skia's `path.contains()` for pixel-perfect testing

Default hit tolerance is **4 px in screen space** — useful for thin lines and small handles. You can override per-object:

```ts
line.hitTolerance = 8   // wider hit area
```
