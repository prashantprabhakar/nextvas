# Transforms

Every object has a **local transform** that positions and shapes it within its parent's coordinate space (the layer, or a parent Group).

## Transform properties

```ts
rect.x        = 100    // position X in parent space
rect.y        = 100    // position Y in parent space
rect.width    = 200
rect.height   = 120
rect.rotation = 45     // degrees, clockwise, around origin
rect.scaleX   = 1.5    // horizontal scale
rect.scaleY   = 1.5    // vertical scale
rect.skewX    = 0      // horizontal skew
rect.skewY    = 0      // vertical skew
```

## Rotation origin

Rotation is applied around the object's **top-left corner** by default (i.e., around `(x, y)`). To rotate around the center, use the `getWorldTransform()` matrix and offset accordingly, or set `x`/`y` to the center and use negative offsets.

## Getting the world transform

For any object — including children nested inside Groups — you can retrieve the full world-space matrix:

```ts
const matrix = obj.getWorldTransform()  // Matrix3x3
```

This multiplies the parent chain's matrices together. A child inside a rotated group gets the group's rotation composed into its own.

## Transform composition in Groups

When an object is inside a `Group`, its transform is **relative to the group**:

```ts
const group = new Group({ x: 100, y: 100, rotation: 30 })

const child = new Rect({ x: 0, y: 0, width: 50, height: 50 })
group.add(child)

// child's world position = group(100, 100) rotated 30° + child(0, 0)
console.log(child.getWorldTransform())
```

## Matrix3x3 API

The transform matrix is a 3×3 affine matrix. You rarely need to work with it directly, but it is exposed for advanced use cases (e.g. implementing a custom hit test):

```ts
import { Matrix3x3 } from '@nexvas/core'

const m = Matrix3x3.identity()
const translated = m.translate(100, 50)
const rotated = translated.rotate(Math.PI / 4)

// Transform a point
const [wx, wy] = rotated.transformPoint(10, 20)
```
