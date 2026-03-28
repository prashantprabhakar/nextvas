# SelectionPlugin

Click to select, marquee to multi-select, drag handles to move/scale/rotate. The foundation of any design tool.

## Install

```ts
import { SelectionPlugin } from '@nexvas/plugin-selection'

stage.use(SelectionPlugin)
```

## Interactions

| Gesture | Result |
|---|---|
| Click an object | Select it (deselects previous) |
| Shift+click | Add to / remove from selection |
| Click empty space | Deselect all |
| Click+drag on empty space | Marquee (rubber-band) select |
| Drag a selected object | Move it |
| Drag a corner handle | Scale |
| Drag the rotation handle | Rotate |
| `Delete` / `Backspace` | Remove selected objects |

## Getting the selection

```ts
import type { SelectionPluginAPI } from '@nexvas/plugin-selection'

const sel = (stage as SelectionPluginAPI).selection

sel.selected        // readonly BaseObject[]
sel.select(obj)
sel.deselect(obj)
sel.selectAll()
sel.deselectAll()
```

## Events

```ts
stage.on('selection:change', ({ selected }) => {
  console.log('selected objects:', selected)
})
```

## Options

```ts
stage.use(SelectionPlugin, {
  handleSize:   8,     // px — resize handle size
  rotateOffset: 24,    // px — distance of rotation handle from corner
  multiKey: 'shift',   // modifier key for multi-select
})
```

## Locking objects

Objects with `locked: true` are excluded from selection and hit testing:

```ts
backgroundRect.locked = true   // not selectable
```
