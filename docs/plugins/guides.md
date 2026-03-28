# GuidesPlugin

Smart alignment guides that appear while dragging, snapping to other objects' edges and centers.

## Install

```ts
import { GuidesPlugin } from '@nexvas/plugin-guides'

stage.use(GuidesPlugin)
```

Install after DragPlugin and SelectionPlugin so guides apply during drag operations.

## Behavior

While dragging an object:

- Guide lines appear when the dragged object's **edges** or **center** align with another object's edges or center
- The dragged object **snaps** to the guide position
- Guides disappear when the drag ends

Guides are rendered as thin colored lines in a post-render pass — they sit on top of all scene content without being part of the scene graph.

## Options

```ts
stage.use(GuidesPlugin, {
  tolerance: 6,    // snap when within this many screen pixels (default: 8)
  color: { r: 0.36, g: 0.44, b: 1, a: 1 },  // guide line color
  lineWidth: 1,    // guide line width in screen pixels
})
```

## Runtime configuration

```ts
import type { GuidesPluginAPI } from '@nexvas/plugin-guides'

const guides = (stage as GuidesPluginAPI).guides

guides.tolerance = 4
guides.enabled   = false   // temporarily disable
```
