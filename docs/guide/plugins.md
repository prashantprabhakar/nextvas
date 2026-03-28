# Plugin System

Plugins are the primary extension mechanism. Core stays small and stable — everything optional is a plugin, including all official features.

## Installing plugins

```ts
import { SelectionPlugin } from '@nexvas/plugin-selection'
import { DragPlugin }      from '@nexvas/plugin-drag'
import { HistoryPlugin }   from '@nexvas/plugin-history'

// Chainable
stage
  .use(SelectionPlugin)
  .use(DragPlugin)
  .use(HistoryPlugin, { maxSize: 100 })
```

## Uninstalling plugins

```ts
stage.unuse(SelectionPlugin)
// or by name:
stage.unuse('selection')
```

`uninstall()` fully reverses everything `install()` did — event listeners, render passes, keyboard shortcuts.

## Plugin interface

```ts
interface Plugin {
  readonly name: string     // unique kebab-case, e.g. 'selection'
  readonly version: string  // semver
  install(stage: StageInterface, options?: Record<string, unknown>): void
  uninstall(stage: StageInterface): void
}
```

## Writing a plugin

```ts
import type { Plugin, StageInterface } from '@nexvas/core'

export const HighlightPlugin: Plugin = {
  name: 'highlight',
  version: '1.0.0',

  install(stage) {
    stage.on('object:added', onAdded)
  },

  uninstall(stage) {
    stage.off('object:added', onAdded)
  },
}

function onAdded({ object }) {
  console.log('new object:', object)
}
```

## Render passes

Plugins can add rendering passes that run before or after the main scene:

```ts
install(stage) {
  this._pass = {
    phase: 'post',
    order: 10,
    render(ctx) {
      // Draw something on top of the scene using ctx.skCanvas
    },
  }
  stage.addRenderPass(this._pass)
},

uninstall(stage) {
  stage.removeRenderPass(this._pass)
},
```

`phase: 'pre'` runs before the scene (e.g. a grid background). `phase: 'post'` runs after (e.g. selection handles, guides).

## Official plugins

| Plugin | Package |
|---|---|
| [SelectionPlugin](/plugins/selection) | `@nexvas/plugin-selection` |
| [DragPlugin](/plugins/drag) | `@nexvas/plugin-drag` |
| [HistoryPlugin](/plugins/history) | `@nexvas/plugin-history` |
| [GridPlugin](/plugins/grid) | `@nexvas/plugin-grid` |
| [GuidesPlugin](/plugins/guides) | `@nexvas/plugin-guides` |
| [ExportPlugin](/plugins/export) | `@nexvas/plugin-export` |

See [Writing a Plugin](/plugins/writing-plugins) for the full guide.
