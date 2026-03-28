import { BaseObject, type BaseObjectProps } from './BaseObject.js'
import type { RenderContext, ObjectJSON } from '../types.js'
import type { PaintCK } from '../renderer/paint.js'

interface SkImage {
  width(): number
  height(): number
  delete(): void
}

interface SkCanvas {
  save(): number
  restore(): void
  concat(matrix: number[]): void
  drawImageRect(
    img: SkImage,
    src: number[],
    dst: number[],
    paint: unknown,
    fastSample?: boolean,
  ): void
}

interface ImageCK extends PaintCK {
  MakeImageFromEncoded(data: Uint8Array): SkImage | null
  FilterMode: { Linear: unknown }
  MipmapMode: { Linear: unknown }
}

export interface ImageProps extends BaseObjectProps {
  /** URL of the image to load. */
  src?: string
  /** Optional crop in source image pixel coordinates: { x, y, width, height }. */
  crop?: { x: number; y: number; width: number; height: number } | null
  /** How to fit the image inside its bounds. Default: 'fill'. */
  objectFit?: 'fill' | 'contain' | 'cover'
  /**
   * Callback invoked after the image finishes loading so the stage can
   * schedule a redraw. Pass `() => stage.markDirty()`.
   */
  onLoad?: () => void
}

/** Raster image object (PNG, JPEG, WebP). Loaded via URL and decoded by CanvasKit. */
export class CanvasImage extends BaseObject {
  src: string
  crop: { x: number; y: number; width: number; height: number } | null
  objectFit: 'fill' | 'contain' | 'cover'
  onLoad: (() => void) | null

  private _skImage: SkImage | null = null
  private _loadingSrc = ''
  private _loading = false

  constructor(props: ImageProps = {}) {
    super(props)
    this.src = props.src ?? ''
    this.crop = props.crop ?? null
    this.objectFit = props.objectFit ?? 'fill'
    this.onLoad = props.onLoad ?? null
  }

  getType(): string {
    return 'Image'
  }

  private _startLoad(ck: ImageCK): void {
    if (this._loading || this._loadingSrc === this.src) return
    this._loading = true
    this._loadingSrc = this.src

    void fetch(this.src)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        const img = ck.MakeImageFromEncoded(new Uint8Array(buf))
        if (img) {
          this._skImage?.delete()
          this._skImage = img
          this.onLoad?.()
        } else {
          console.warn(`[nexvas] CanvasImage: CanvasKit could not decode image "${this.src}"`)
        }
      })
      .catch((err: unknown) => {
        console.warn(
          `[nexvas] CanvasImage: failed to load "${this.src}": ${err instanceof Error ? err.message : String(err)}`,
        )
      })
      .finally(() => {
        this._loading = false
      })
  }

  /**
   * Compute the source rect (within the image) and destination rect (on canvas)
   * according to the objectFit setting.
   */
  private _computeRects(imgW: number, imgH: number): { src: number[]; dst: number[] } {
    const dstW = this.width
    const dstH = this.height

    if (this.crop) {
      const { x, y, width, height } = this.crop
      return {
        src: [x, y, x + width, y + height],
        dst: [0, 0, dstW, dstH],
      }
    }

    if (this.objectFit === 'fill') {
      return {
        src: [0, 0, imgW, imgH],
        dst: [0, 0, dstW, dstH],
      }
    }

    const imgRatio = imgW / imgH
    const dstRatio = dstW / dstH

    if (this.objectFit === 'contain') {
      // Letterbox — fit entirely, preserve aspect ratio
      if (imgRatio > dstRatio) {
        const h = dstW / imgRatio
        const offY = (dstH - h) / 2
        return {
          src: [0, 0, imgW, imgH],
          dst: [0, offY, dstW, offY + h],
        }
      } else {
        const w = dstH * imgRatio
        const offX = (dstW - w) / 2
        return {
          src: [0, 0, imgW, imgH],
          dst: [offX, 0, offX + w, dstH],
        }
      }
    }

    // cover — fill entirely, crop excess
    if (imgRatio > dstRatio) {
      const srcW = imgH * dstRatio
      const offX = (imgW - srcW) / 2
      return {
        src: [offX, 0, offX + srcW, imgH],
        dst: [0, 0, dstW, dstH],
      }
    } else {
      const srcH = imgW / dstRatio
      const offY = (imgH - srcH) / 2
      return {
        src: [0, offY, imgW, offY + srcH],
        dst: [0, 0, dstW, dstH],
      }
    }
  }

  render(ctx: RenderContext): void {
    if (!this.visible || !ctx.skCanvas || !this.src) return
    const ck = ctx.canvasKit as ImageCK
    const canvas = ctx.skCanvas as SkCanvas

    // If not loaded, kick off the load and skip this frame
    if (!this._skImage) {
      this._startLoad(ck)
      return
    }

    canvas.save()
    canvas.concat(Array.from(this.getLocalTransform().values))

    const { src, dst } = this._computeRects(this._skImage.width(), this._skImage.height())

    const paint = new ck.Paint()
    paint.setAntiAlias(true)
    paint.setAlphaf(this.opacity)
    canvas.drawImageRect(this._skImage, src, dst, paint)
    paint.delete()

    canvas.restore()
  }

  toJSON(): ObjectJSON {
    return {
      ...super.toJSON(),
      src: this.src,
      crop: this.crop,
      objectFit: this.objectFit,
    }
  }

  static fromJSON(json: ObjectJSON): CanvasImage {
    const obj = new CanvasImage()
    obj.applyBaseJSON(json)
    if (json['src'] !== undefined) obj.src = json['src'] as string
    if (json['crop'] !== undefined) {
      obj.crop = (json['crop'] as { x: number; y: number; width: number; height: number }) ?? null
    }
    if (json['objectFit'] !== undefined)
      obj.objectFit = json['objectFit'] as 'fill' | 'contain' | 'cover'
    return obj
  }

  destroy(): void {
    this._skImage?.delete()
    this._skImage = null
    super.destroy()
  }
}
