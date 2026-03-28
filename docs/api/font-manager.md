# FontManager

Manages font loading for CanvasKit. Accessible via `stage.fonts`.

## Methods

```ts
// Load a font by URL or ArrayBuffer
stage.fonts.load(name: string, source: string | ArrayBuffer): Promise<void>

// Wait for all registered fonts to finish loading
stage.fonts.waitForReady(): Promise<void>
```

## Example

```ts
await stage.fonts.load('Inter', '/fonts/Inter-Regular.woff2')
await stage.fonts.load('Inter-Bold', '/fonts/Inter-Bold.woff2')
await stage.fonts.waitForReady()

stage.startLoop()
```

See the [Fonts guide](/guide/fonts) for full details.
