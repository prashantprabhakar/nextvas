# HistoryPlugin

Full undo/redo stack using the command pattern. Ctrl+Z / Ctrl+Y work out of the box.

## Install

```ts
import { HistoryPlugin } from '@nexvas/plugin-history'

stage.use(HistoryPlugin, { maxSize: 100 })
```

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Y` / `Cmd+Shift+Z` | Redo |

## Programmatic control

```ts
import type { HistoryPluginAPI } from '@nexvas/plugin-history'

const history = (stage as HistoryPluginAPI).history

history.undo()
history.redo()
history.clear()

history.canUndo   // boolean
history.canRedo   // boolean
```

## Recording commands

The plugin records all object mutations automatically when used with SelectionPlugin (move, scale, rotate, delete). To record your own operations, push a command manually:

```ts
history.push({
  execute() {
    obj.fill = newFill
  },
  undo() {
    obj.fill = oldFill
  },
})
```

## Options

```ts
stage.use(HistoryPlugin, {
  maxSize: 50,   // maximum number of undoable steps (default: 100)
})
```

When the stack exceeds `maxSize`, the oldest entry is dropped.

## Events

```ts
stage.on('history:change', ({ canUndo, canRedo }) => {
  undoButton.disabled = !canUndo
  redoButton.disabled = !canRedo
})
```
