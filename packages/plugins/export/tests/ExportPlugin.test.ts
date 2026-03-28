import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExportPlugin } from '../src/ExportPlugin.js'
import type { StageInterface, Layer, BoundingBox } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeImageBytes(): Uint8Array {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47]) // PNG magic bytes (mock)
}

function makeMockSurface() {
  const canvas = {
    clear: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
  }
  const img = {
    encodeToBytes: vi.fn(() => makeImageBytes()),
    delete: vi.fn(),
  }
  return {
    getCanvas: vi.fn(() => canvas),
    makeImageSnapshot: vi.fn(() => img),
    flush: vi.fn(),
    delete: vi.fn(),
    width: vi.fn(() => 100),
    height: vi.fn(() => 100),
    _canvas: canvas,
    _img: img,
  }
}

function makeMockCK() {
  const surface = makeMockSurface()
  const pdfDoc = {
    beginPage: vi.fn(() => ({
      clear: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
    })),
    endPage: vi.fn(),
    close: vi.fn(() => new Uint8Array([0x25, 0x50, 0x44, 0x46])), // %PDF
  }
  return {
    MakeSurface: vi.fn(() => surface),
    MakePDFDocument: vi.fn(() => pdfDoc),
    Color4f: vi.fn((r: number, g: number, b: number, a: number) => new Float32Array([r, g, b, a])),
    ColorSpace: { SRGB: 'srgb' },
    ImageFormat: { PNG: 'png', JPEG: 'jpeg', WEBP: 'webp' },
    _surface: surface,
    _pdfDoc: pdfDoc,
  }
}

function makeStage(): StageInterface & { _ck: ReturnType<typeof makeMockCK> } {
  const ck = makeMockCK()
  const stage: StageInterface & { _ck: typeof ck } = {
    id: 'test',
    canvasKit: ck,
    _ck: ck,
    get layers() {
      return [] as unknown as readonly Layer[]
    },
    on: vi.fn(),
    off: vi.fn(),
    addRenderPass: vi.fn(),
    removeRenderPass: vi.fn(),
    getBoundingBox() {
      const { BoundingBox } = require('@nexvas/core') as {
        BoundingBox: new (x: number, y: number, w: number, h: number) => BoundingBox
      }
      return new BoundingBox(0, 0, 800, 600)
    },
    render: vi.fn(),
    markDirty: vi.fn(),
  } as unknown as StageInterface & { _ck: typeof ck }
  return stage
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExportPlugin', () => {
  let plugin: ExportPlugin
  let stage: ReturnType<typeof makeStage>

  beforeEach(() => {
    plugin = new ExportPlugin()
    stage = makeStage()
    plugin.install(stage)
  })

  it('installs and uninstalls without error', () => {
    plugin.uninstall(stage)
  })

  it('exportPNG returns a Blob with image/png type', async () => {
    const blob = await plugin.exportPNG({ region: { x: 0, y: 0, width: 100, height: 100 } })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
  })

  it('exportJPEG returns a Blob with image/jpeg type', async () => {
    const blob = await plugin.exportJPEG({ region: { x: 0, y: 0, width: 100, height: 100 } })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/jpeg')
  })

  it('exportWebP returns a Blob with image/webp type', async () => {
    const blob = await plugin.exportWebP({ region: { x: 0, y: 0, width: 100, height: 100 } })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/webp')
  })

  it('exportPDF returns a Blob with application/pdf type', async () => {
    const blob = await plugin.exportPDF({ region: { x: 0, y: 0, width: 100, height: 100 } })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/pdf')
  })

  it('creates an offscreen surface for PNG export', async () => {
    await plugin.exportPNG({ region: { x: 0, y: 0, width: 200, height: 150 } })
    expect(stage._ck.MakeSurface).toHaveBeenCalledWith(200, 150)
  })

  it('respects scale factor for PNG export', async () => {
    await plugin.exportPNG({ region: { x: 0, y: 0, width: 100, height: 50 }, scale: 2 })
    expect(stage._ck.MakeSurface).toHaveBeenCalledWith(200, 100)
  })

  it('surface.delete is called after export', async () => {
    await plugin.exportPNG({ region: { x: 0, y: 0, width: 100, height: 100 } })
    expect(stage._ck._surface.delete).toHaveBeenCalled()
  })

  it('throws when not installed', async () => {
    const bare = new ExportPlugin()
    await expect(bare.exportPNG()).rejects.toThrow('not installed')
  })

  it('uses stage bounding box when no region specified', async () => {
    await plugin.exportPNG()
    // Should have called MakeSurface with stage bbox dimensions (800x600)
    expect(stage._ck.MakeSurface).toHaveBeenCalledWith(800, 600)
  })
})
