# BoundingBox

An axis-aligned bounding box in world space.

```ts
import { BoundingBox } from '@nexvas/core'

const box = new BoundingBox(x, y, width, height)

// Properties
box.x       // left edge
box.y       // top edge
box.width
box.height
box.right   // x + width
box.bottom  // y + height
box.centerX
box.centerY

// Operations (return new BoundingBox)
box.union(other)         // smallest box containing both
box.intersect(other)     // overlap region, or null if no overlap
box.expand(amount)       // grow by amount on all sides
box.contains(x, y)       // point containment test
box.containsBox(other)   // full box containment

// Transform
box.transform(matrix: Matrix3x3): BoundingBox
```
