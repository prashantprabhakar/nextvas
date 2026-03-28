import { BaseObject, type BaseObjectProps } from './BaseObject.js'
import { makeFillPaint, makeStrokePaint, type PaintCK } from '../renderer/paint.js'
import type { RenderContext, ObjectJSON } from '../types.js'

interface SkCanvas {
  save(): number
  restore(): void
  concat(matrix: number[]): void
  drawOval(oval: number[], paint: unknown): void
}

interface CircleCK extends PaintCK {
  LTRBRect(l: number, t: number, r: number, b: number): Float32Array
}

/**
 * Ellipse / circle. `width` is the horizontal diameter, `height` is the vertical diameter.
 * Set equal width/height for a perfect circle.
 */
export class Circle extends BaseObject {
  constructor(props: BaseObjectProps = {}) {
    super(props)
  }

  getType(): string {
    return 'Circle'
  }

  render(ctx: RenderContext): void {
    if (!this.visible || !ctx.skCanvas) return
    const ck = ctx.canvasKit as CircleCK
    const canvas = ctx.skCanvas as SkCanvas

    canvas.save()
    canvas.concat(Array.from(this.getLocalTransform().values))

    const oval = Array.from(ck.LTRBRect(0, 0, this.width, this.height))

    if (this.fill) {
      const paint = makeFillPaint(ck, this.fill, this.opacity)
      canvas.drawOval(oval, paint)
      paint.delete()
    }

    if (this.stroke) {
      const paint = makeStrokePaint(ck, this.stroke, this.opacity)
      canvas.drawOval(oval, paint)
      paint.delete()
    }

    canvas.restore()
  }

  static fromJSON(json: ObjectJSON): Circle {
    const obj = new Circle()
    obj.applyBaseJSON(json)
    return obj
  }
}
