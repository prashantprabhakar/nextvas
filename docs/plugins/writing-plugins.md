# Writing a Plugin

Plugins are the primary extension mechanism. They have full access to the stage API and can add event listeners, render passes, keyboard shortcuts, and new object types — without touching core.

## The Plugin interface

```ts
interface Plugin {
  readonly name: string     // unique kebab-case, e.g. 'my-plugin'
  readonly version: string  // semver
  install(stage: StageInterface, options?: Record<string, unknown>): void
  uninstall(stage: StageInterface): void
}
```

`uninstall` must fully reverse `install`. If you add an event listener in `install`, you must remove it in `uninstall`.

## Minimal example

```ts
import type { Plugin, StageInterface, CanvasPointerEvent } from '@nexvas/core'

export const LogPlugin: Plugin = {
  name: 'log',
  version: '1.0.0',

  install(stage) {
    stage.on('click', this._onClick)
  },

  uninstall(stage) {
    stage.off('click', this._onClick)
  },

  _onClick(e: CanvasPointerEvent) {
    console.log('clicked at world:', e.world)
  },
}
```

## Accessing options

```ts
export const GridPlugin: Plugin = {
  name: 'grid',
  version: '1.0.0',

  install(stage, options = {}) {
    const cellSize = (options.cellSize as number) ?? 20
    // ...
  },

  uninstall(stage) { /* ... */ },
}

// Usage:
stage.use(GridPlugin, { cellSize: 40 })
```

## Adding a render pass

Render passes execute before or after the main scene each frame.

```ts
import type { RenderPass, RenderContext } from '@nexvas/core'

export const OverlayPlugin: Plugin = {
  name: 'overlay',
  version: '1.0.0',

  _pass: null as RenderPass | null,

  install(stage) {
    this._pass = {
      phase: 'post',   // 'pre' | 'post'
      order: 100,      // higher = renders later within the same phase
      render(ctx: RenderContext) {
        // ctx.skCanvas  — CanvasKit SkCanvas
        // ctx.canvasKit — CanvasKit instance
        // ctx.viewport  — current viewport state
        // ctx.pixelRatio
      },
    }
    stage.addRenderPass(this._pass)
  },

  uninstall(stage) {
    if (this._pass) {
      stage.removeRenderPass(this._pass)
      this._pass = null
    }
  },
}
```

## Exposing a plugin API

Expose your plugin's runtime API via TypeScript module augmentation:

```ts
// my-plugin.ts
declare module '@nexvas/core' {
  interface StageInterface {
    myPlugin: MyPluginAPI
  }
}

export interface MyPluginAPI {
  doSomething(): void
}

export const MyPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',

  install(stage) {
    ;(stage as unknown as { myPlugin: MyPluginAPI }).myPlugin = {
      doSomething() { console.log('doing something') },
    }
  },

  uninstall(stage) {
    delete (stage as unknown as { myPlugin?: MyPluginAPI }).myPlugin
  },
}
```

Then callers get type-safe access:

```ts
stage.use(MyPlugin)
stage.myPlugin.doSomething()
```

## Package layout

For a publishable plugin, use this structure:

```
packages/plugins/my-plugin/
├── src/
│   └── MyPlugin.ts
├── tests/
│   └── MyPlugin.test.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

The `package.json` should reference `@nexvas/core` as a peer dependency:

```json
{
  "name": "@nexvas/plugin-my-plugin",
  "peerDependencies": {
    "@nexvas/core": "workspace:*"
  }
}
```

Use `/new-plugin` in Claude Code to scaffold this automatically.
