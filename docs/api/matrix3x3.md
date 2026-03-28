# Matrix3x3

A 3×3 affine transformation matrix. Used internally for composing object transforms.

```ts
import { Matrix3x3 } from '@nexvas/core'

const m = Matrix3x3.identity()

// Chain transforms (each returns a new matrix)
const t = m
  .translate(100, 50)
  .rotate(Math.PI / 4)
  .scale(2, 2)

// Transform a point
const [x, y] = t.transformPoint(10, 20)

// Multiply two matrices
const combined = a.multiply(b)

// Get the inverse
const inv = t.invert()
```
