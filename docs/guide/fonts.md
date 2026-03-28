# Fonts

CanvasKit does not use the browser's system fonts. All fonts must be explicitly loaded and registered with the `FontManager` before any `Text` object can render them.

## Default font

NexVas bundles **Noto Sans** covering Latin and common Unicode ranges. It is loaded automatically. Any `Text` object that does not specify `fontFamily` (or specifies `'Noto Sans'`) will render with the default font, no setup required.

## Loading a custom font

```ts
// By URL (fetched at runtime)
await stage.fonts.load('Inter', 'https://example.com/fonts/Inter-Regular.woff2')

// By ArrayBuffer (if you already have the font data)
const buffer = await fetch('/fonts/Inter-Regular.woff2').then(r => r.arrayBuffer())
await stage.fonts.load('Inter', buffer)
```

Then use it in a `Text` object:

```ts
layer.add(new Text({
  x: 50, y: 50,
  width: 400, height: 60,
  content: 'Loaded with Inter',
  fontSize: 24,
  fontFamily: 'Inter',
  fill: { type: 'solid', color: { r: 0.1, g: 0.1, b: 0.1, a: 1 } },
}))
```

## Preloading before first render

If you want to guarantee all fonts are ready before starting the render loop:

```ts
await stage.fonts.load('Inter', '/fonts/Inter-Regular.woff2')
await stage.fonts.load('Inter-Bold', '/fonts/Inter-Bold.woff2')

// Wait for all registered fonts to be ready
await stage.fonts.waitForReady()

stage.startLoop()
```

## Missing fonts

If a `Text` object tries to render with a font that hasn't been loaded:

- A **warning is emitted** to the console
- The text object is **skipped** (not rendered) — the frame continues
- The stage does not crash

Once the font is loaded, the next frame will render the text correctly.

## Font variants

Load each variant (regular, bold, italic) as a separate named font:

```ts
await stage.fonts.load('Inter',       '/fonts/Inter-Regular.woff2')
await stage.fonts.load('Inter-Bold',  '/fonts/Inter-Bold.woff2')
await stage.fonts.load('Inter-Italic','/fonts/Inter-Italic.woff2')
```

Then reference the name in `Text.fontFamily`:

```ts
new Text({ fontFamily: 'Inter-Bold', fontWeight: 700, ... })
```
