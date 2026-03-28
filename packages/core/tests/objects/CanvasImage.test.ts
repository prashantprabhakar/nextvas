import { describe, it, expect, vi } from 'vitest'
import { CanvasImage } from '../../src/objects/CanvasImage.js'
import { createMockCK, createMockCanvas } from '../__mocks__/canvaskit.js'
import type { RenderContext } from '../../src/types.js'
import type { FontManager } from '../../src/FontManager.js'

function makeCtx() {
  const ck = createMockCK()
  const canvas = createMockCanvas()
  const ctx: RenderContext = {
    skCanvas: canvas,
    canvasKit: ck,
    fontManager: {} as unknown as FontManager,
    pixelRatio: 1,
    viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
  }
  return { ctx, canvas, ck }
}

describe('CanvasImage', () => {
  it('skips render on first call (starts async load)', () => {
    const { ctx, canvas } = makeCtx()
    // Mock fetch to return a valid response but never resolve in this test
    const fetchMock = vi.fn().mockReturnValue(new Promise(() => {}))
    vi.stubGlobal('fetch', fetchMock)

    const img = new CanvasImage({ src: 'https://example.com/img.png', width: 100, height: 100 })
    img.render(ctx)
    // First render: no skImage yet → kick off load and skip drawing
    expect(canvas.calls.some((c) => c.method === 'drawImageRect')).toBe(false)
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/img.png')

    vi.unstubAllGlobals()
  })

  it('toJSON roundtrip', () => {
    const img = new CanvasImage({
      src: 'https://example.com/photo.jpg',
      objectFit: 'cover',
      crop: { x: 10, y: 10, width: 80, height: 80 },
    })
    const json = img.toJSON()
    expect(json['src']).toBe('https://example.com/photo.jpg')
    expect(json['objectFit']).toBe('cover')
    const restored = CanvasImage.fromJSON(json)
    expect(restored.objectFit).toBe('cover')
    expect(restored.crop).toEqual({ x: 10, y: 10, width: 80, height: 80 })
  })

  it('skips render when invisible', () => {
    const { ctx, canvas } = makeCtx()
    const img = new CanvasImage({ src: 'x.png', visible: false })
    img.render(ctx)
    expect(canvas.calls).toHaveLength(0)
  })

  it('hitTest inside bounds', () => {
    const img = new CanvasImage({ x: 0, y: 0, width: 100, height: 100 })
    expect(img.hitTest(50, 50)).toBe(true)
    expect(img.hitTest(200, 200)).toBe(false)
  })

  it('onLoad is called after image loads', async () => {
    const { ctx } = makeCtx()
    const ck = ctx.canvasKit as ReturnType<typeof createMockCK>
    const mockImgData = new Uint8Array([1, 2, 3, 4])
    // Make MakeImageFromEncoded return a mock image
    const mockSkImg = { width: () => 100, height: () => 100, delete: () => {} }
    ck.MakeImageFromEncoded = (_data: Uint8Array) => mockSkImg

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockImgData.buffer),
    })
    vi.stubGlobal('fetch', fetchMock)

    const onLoad = vi.fn()
    const img = new CanvasImage({
      src: 'https://example.com/img.png',
      width: 100,
      height: 100,
      onLoad,
    })
    img.render(ctx) // starts load
    // Wait for async operations
    await new Promise((r) => setTimeout(r, 0))
    expect(onLoad).toHaveBeenCalled()

    vi.unstubAllGlobals()
  })
})
