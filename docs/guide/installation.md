# Installation

NexVas is split into focused packages. Install only what you need.

## Packages

| Package | Description |
|---|---|
| `@nexvas/core` | Scene graph, objects, events, viewport, plugin registry |
| `@nexvas/renderer` | CanvasKit loader (`loadCanvasKit`) and surface management |
| `@nexvas/plugin-selection` | Click-to-select, marquee, transform handles |
| `@nexvas/plugin-drag` | Draggable objects with constraints |
| `@nexvas/plugin-history` | Undo / redo stack |
| `@nexvas/plugin-grid` | Background grid with snap-to-grid |
| `@nexvas/plugin-guides` | Smart alignment guides during drag |
| `@nexvas/plugin-export` | Export to PNG, JPEG, WebP, PDF |

## Install

::: code-group

```sh [npm]
npm install @nexvas/core @nexvas/renderer
```

```sh [pnpm]
pnpm add @nexvas/core @nexvas/renderer
```

```sh [yarn]
yarn add @nexvas/core @nexvas/renderer
```

:::

Add any plugins you need:

::: code-group

```sh [npm]
npm install @nexvas/plugin-selection @nexvas/plugin-drag @nexvas/plugin-history
```

```sh [pnpm]
pnpm add @nexvas/plugin-selection @nexvas/plugin-drag @nexvas/plugin-history
```

:::

## CanvasKit WASM

CanvasKit ships as a `.wasm` file (~2 MB, cached after first load). By default, `loadCanvasKit()` fetches it from jsDelivr CDN. If you want to self-host it:

```ts
import { loadCanvasKit } from '@nexvas/renderer'

const ck = await loadCanvasKit('/assets/canvaskit.wasm')
```

The `.wasm` file is included in the `canvaskit-wasm` npm package and can be copied to your public directory as part of your build.

## TypeScript

The packages ship full `.d.ts` declarations. No `@types` package needed. TypeScript 5.0+ is recommended.

Add `"moduleResolution": "Bundler"` (or `"node16"`) in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "Bundler",
    "strict": true
  }
}
```

## Vite / Webpack / Rollup

The packages are ES modules with a `exports` field. They work with any modern bundler that supports ES modules. No extra configuration is needed for Vite. For webpack, ensure `experiments.asyncWebAssembly` is enabled if you self-host the WASM.
