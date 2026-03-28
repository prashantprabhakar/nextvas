# Vec2

A 2D vector with common math operations.

```ts
import { Vec2 } from '@nexvas/core'

const a = new Vec2(3, 4)
const b = new Vec2(1, 2)

a.add(b)          // Vec2(4, 6)
a.sub(b)          // Vec2(2, 2)
a.scale(2)        // Vec2(6, 8)
a.dot(b)          // 11
a.length()        // 5
a.normalize()     // Vec2(0.6, 0.8)
a.distanceTo(b)   // distance

Vec2.lerp(a, b, 0.5)   // midpoint
```
