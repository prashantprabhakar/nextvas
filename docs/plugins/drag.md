# DragPlugin

Makes objects draggable. Emits `dragstart`, `drag`, and `dragend` events. Works standalone or alongside SelectionPlugin.

## Install

```ts
import { DragPlugin } from '@nexvas/plugin-drag'

stage.use(DragPlugin)
```

## Basic usage

Once installed, any object that is not `locked` can be dragged by the user.

```ts
rect.on('dragstart', (e) => console.log('drag started', e.world))
rect.on('drag',      (e) => console.log('dragging at', e.world))
rect.on('dragend',   (e) => console.log('drag ended', e.world))
```

## Options

```ts
stage.use(DragPlugin, {
  clampToStage: true,    // prevent dragging outside stage bounds
  threshold: 4,          // px movement before drag starts (avoids accidental drags on click)
})
```

## Snap targets

Register snap targets that the dragged object will snap to:

```ts
import type { DragPluginAPI } from '@nexvas/plugin-drag'

const drag = (stage as DragPluginAPI).drag

drag.addSnapTarget({
  snapX: [0, 100, 200, 300],   // world-space X positions to snap to
  snapY: [0, 100, 200],
  tolerance: 8,                // px — snap if within this distance
})
```

## Making specific objects non-draggable

```ts
obj.locked = true   // not draggable
```

Or handle the `dragstart` event and stop propagation:

```ts
obj.on('dragstart', (e) => {
  e.stopPropagation()
})
```
