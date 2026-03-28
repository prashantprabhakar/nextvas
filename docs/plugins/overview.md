# Plugins Overview

All official plugins are opt-in. Install only what your app needs — unused plugins add zero weight to your bundle.

## Install

::: code-group

```sh [npm]
npm install @nexvas/plugin-selection @nexvas/plugin-drag \
            @nexvas/plugin-history   @nexvas/plugin-grid \
            @nexvas/plugin-guides    @nexvas/plugin-export
```

```sh [pnpm]
pnpm add @nexvas/plugin-selection @nexvas/plugin-drag \
         @nexvas/plugin-history   @nexvas/plugin-grid \
         @nexvas/plugin-guides    @nexvas/plugin-export
```

:::

## Typical design-tool setup

```ts
import { SelectionPlugin } from '@nexvas/plugin-selection'
import { DragPlugin }      from '@nexvas/plugin-drag'
import { HistoryPlugin }   from '@nexvas/plugin-history'
import { GridPlugin }      from '@nexvas/plugin-grid'
import { GuidesPlugin }    from '@nexvas/plugin-guides'
import { ExportPlugin }    from '@nexvas/plugin-export'

stage
  .use(GridPlugin,     { cellSize: 20, type: 'lines' })
  .use(SelectionPlugin)
  .use(DragPlugin)
  .use(GuidesPlugin)
  .use(HistoryPlugin,  { maxSize: 100 })
  .use(ExportPlugin)
```

## Official plugins

| Plugin | What it does |
|---|---|
| [SelectionPlugin](/plugins/selection) | Click, Shift+click, marquee select. Move/scale/rotate handles. Delete key. |
| [DragPlugin](/plugins/drag) | Make objects draggable. Optional stage clamping, snap targets. |
| [HistoryPlugin](/plugins/history) | Full undo/redo stack. Ctrl+Z / Ctrl+Y. Configurable max size. |
| [GridPlugin](/plugins/grid) | Lines or dot grid. Configurable cell size. Snap-to-grid. |
| [GuidesPlugin](/plugins/guides) | Smart alignment guides during drag. Snaps to object edges and centers. |
| [ExportPlugin](/plugins/export) | Export stage or region to PNG, JPEG, WebP, or PDF. |
