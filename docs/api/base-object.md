# BaseObject

The base class for all scene objects. Every built-in type (`Rect`, `Circle`, `Text`, etc.) extends `BaseObject`.

## Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto | Unique identifier |
| `name` | `string` | `''` | Human-readable label |
| `x` | `number` | `0` | X position in parent space |
| `y` | `number` | `0` | Y position in parent space |
| `width` | `number` | `0` | Width |
| `height` | `number` | `0` | Height |
| `rotation` | `number` | `0` | Rotation in degrees |
| `scaleX` | `number` | `1` | Horizontal scale |
| `scaleY` | `number` | `1` | Vertical scale |
| `skewX` | `number` | `0` | Horizontal skew |
| `skewY` | `number` | `0` | Vertical skew |
| `opacity` | `number` | `1` | 0–1 |
| `visible` | `boolean` | `true` | Rendered and hit-tested when `true` |
| `locked` | `boolean` | `false` | Excluded from hit testing when `true` |
| `fill` | `Fill \| null` | `null` | Fill style |
| `stroke` | `StrokeStyle \| null` | `null` | Stroke style |
| `hitTolerance` | `number` | `4` | Hit test padding in screen pixels |

## Methods

### Transform

```ts
obj.getWorldTransform(): Matrix3x3
obj.getWorldBoundingBox(): BoundingBox
```

### Events

```ts
obj.on<K extends keyof ObjectEventMap>(event: K, handler: (e: ObjectEventMap[K]) => void): void
obj.off<K extends keyof ObjectEventMap>(event: K, handler: (e: ObjectEventMap[K]) => void): void
```

### Hit testing

```ts
obj.hitTest(worldX: number, worldY: number): boolean
```

Override this in a custom object for pixel-perfect hit testing. The default checks the bounding box. `Path` and `Line` override to use Skia's `path.contains()`.

### Serialization

```ts
obj.toJSON(): ObjectJSON
```

Static method on each subclass:

```ts
Rect.fromJSON(json: ObjectJSON): Rect
```
