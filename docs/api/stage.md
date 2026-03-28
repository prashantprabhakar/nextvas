# Stage

The root of NexVas. Owns the `<canvas>` element, the CanvasKit WebGL surface, the viewport, the event system, and the plugin registry.

## Constructor

```ts
new Stage(options: StageOptions)
```

### StageOptions

| Property | Type | Required | Description |
|---|---|---|---|
| `canvas` | `HTMLCanvasElement` | ✓ | The canvas element to render into |
| `canvasKit` | `unknown` | ✓ | CanvasKit instance from `loadCanvasKit()` |
| `viewport` | `ViewportOptions` | — | Initial viewport constraints |
| `pixelRatio` | `number` | — | Defaults to `window.devicePixelRatio` |

**Throws** if the CanvasKit WebGL surface cannot be created (e.g. WebGL2 not available or canvas not attached to DOM).

## Properties

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Auto-generated unique ID |
| `canvas` | `HTMLCanvasElement` | The canvas element |
| `canvasKit` | `unknown` | CanvasKit instance |
| `viewport` | `Viewport` | Pan/zoom controller |
| `plugins` | `PluginRegistry` | Installed plugins |
| `fonts` | `FontManager` | Font loading and lookup |
| `layers` | `readonly Layer[]` | All layers, back to front |

## Layer management

```ts
stage.addLayer(options?: { name?: string; visible?: boolean; locked?: boolean }): Layer
stage.removeLayer(layer: Layer): void
stage.getObjectById(id: string): BaseObject | undefined
```

## Plugin management

```ts
stage.use(plugin: Plugin, options?: Record<string, unknown>): this
stage.unuse(pluginOrName: Plugin | string): this
```

## Events

```ts
stage.on<K extends keyof StageEventMap>(event: K, handler: (e: StageEventMap[K]) => void): void
stage.off<K extends keyof StageEventMap>(event: K, handler: (e: StageEventMap[K]) => void): void
```

See [Events](/api/events) for the full `StageEventMap`.

## Rendering

```ts
stage.startLoop(): void    // start requestAnimationFrame loop
stage.stopLoop(): void     // stop the loop
stage.render(): void       // render one frame synchronously
stage.markDirty(): void    // flag a redraw needed on next loop tick
```

## Render passes

```ts
stage.addRenderPass(pass: RenderPass): void
stage.removeRenderPass(pass: RenderPass): void
```

## Serialization

```ts
stage.toJSON(): SceneJSON
stage.loadJSON(json: SceneJSON): void
```

`loadJSON` removes all existing layers before loading.

## Utilities

```ts
stage.getBoundingBox(): BoundingBox   // union of all visible objects' bounding boxes
```

## Cleanup

```ts
stage.destroy(): void
```

Releases the WebGL surface, stops the render loop, removes all event listeners, and destroys all plugins. Always call this when removing the stage from the page.
