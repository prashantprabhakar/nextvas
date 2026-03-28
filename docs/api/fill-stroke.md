# Fill & Stroke

Types for styling objects.

## Fill

```ts
type Fill = SolidFill | LinearGradientFill
```

### SolidFill

```ts
interface SolidFill {
  type: 'solid'
  color: ColorRGBA
}
```

```ts
fill: { type: 'solid', color: { r: 0.36, g: 0.44, b: 1, a: 1 } }
```

### LinearGradientFill

```ts
interface LinearGradientFill {
  type: 'linear-gradient'
  stops: Array<{ offset: number; color: ColorRGBA }>
  start: { x: number; y: number }
  end:   { x: number; y: number }
}
```

```ts
fill: {
  type: 'linear-gradient',
  start: { x: 0, y: 0 },
  end:   { x: 0, y: 1 },
  stops: [
    { offset: 0, color: { r: 0.36, g: 0.44, b: 1,  a: 1 } },
    { offset: 1, color: { r: 0.8,  g: 0.2,  b: 0.9, a: 1 } },
  ],
}
```

`start` and `end` are in **object-local space** (0–1 maps across the object's bounds).

## ColorRGBA

```ts
interface ColorRGBA {
  r: number   // 0–1
  g: number   // 0–1
  b: number   // 0–1
  a: number   // 0–1 (alpha)
}
```

## StrokeStyle

```ts
interface StrokeStyle {
  color:       ColorRGBA
  width:       number
  lineCap?:    'butt' | 'round' | 'square'
  lineJoin?:   'miter' | 'round' | 'bevel'
  dash?:       number[]    // e.g. [8, 4] for dashed, [2, 4] for dotted
  dashOffset?: number
}
```

```ts
stroke: {
  color: { r: 0.2, g: 0.2, b: 0.8, a: 1 },
  width: 2,
  lineCap: 'round',
  dash: [8, 4],
}
```
