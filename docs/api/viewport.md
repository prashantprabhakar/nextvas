# Viewport

Controls pan and zoom. Accessible via `stage.viewport`.

## State

```ts
stage.viewport.getState(): ViewportState
// { x: number, y: number, scale: number, width: number, height: number }
```

`x` and `y` are pan offsets in screen pixels. `scale` is the zoom level (1.0 = 100%).

## Methods

```ts
setPosition(x: number, y: number): void
setScale(scale: number): void
setState(state: Partial<ViewportState>): void

fitToContent(): void
fitToRect(rect: { x: number; y: number; width: number; height: number }): void

animateTo(options: AnimateToOptions): void
```

### AnimateToOptions

| Property | Type | Default | Description |
|---|---|---|---|
| `x` | `number` | — | Target pan X |
| `y` | `number` | — | Target pan Y |
| `scale` | `number` | — | Target zoom level |
| `duration` | `number` | `300` | Animation duration in ms |
| `easing` | `'linear' \| 'ease-in' \| 'ease-out' \| 'ease-in-out'` | `'ease-out'` | Easing function |

## Options

```ts
new Stage({
  canvas,
  canvasKit: ck,
  viewport: {
    minScale: 0.1,
    maxScale: 20,
  },
})
```
