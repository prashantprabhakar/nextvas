/**
 * Lightweight CanvasKit mock for unit tests.
 * Tracks draw calls so tests can assert what was drawn.
 */

export interface DrawCall {
  method: string
  args: unknown[]
}

export function createMockCanvas() {
  const calls: DrawCall[] = []

  const canvas = {
    calls,
    clear: (...args: unknown[]) => calls.push({ method: 'clear', args }),
    save: () => {
      calls.push({ method: 'save', args: [] })
      return 0
    },
    restore: () => calls.push({ method: 'restore', args: [] }),
    concat: (...args: unknown[]) => calls.push({ method: 'concat', args }),
    translate: (...args: unknown[]) => calls.push({ method: 'translate', args }),
    scale: (...args: unknown[]) => calls.push({ method: 'scale', args }),
    drawRect: (...args: unknown[]) => calls.push({ method: 'drawRect', args }),
    drawRRect: (...args: unknown[]) => calls.push({ method: 'drawRRect', args }),
    drawOval: (...args: unknown[]) => calls.push({ method: 'drawOval', args }),
    drawLine: (...args: unknown[]) => calls.push({ method: 'drawLine', args }),
    drawPath: (...args: unknown[]) => calls.push({ method: 'drawPath', args }),
    drawParagraph: (...args: unknown[]) => calls.push({ method: 'drawParagraph', args }),
    drawImageRect: (...args: unknown[]) => calls.push({ method: 'drawImageRect', args }),
    clipRect: (...args: unknown[]) => calls.push({ method: 'clipRect', args }),
  }
  return canvas
}

export function createMockPaint() {
  return {
    setStyle: () => {},
    setColor: () => {},
    setAntiAlias: () => {},
    setStrokeWidth: () => {},
    setStrokeCap: () => {},
    setStrokeJoin: () => {},
    setStrokeMiter: () => {},
    setShader: () => {},
    setAlphaf: () => {},
    delete: () => {},
  }
}

export function createMockPath(containsResult = false) {
  return {
    contains: (_x: number, _y: number) => containsResult,
    getBounds: () => new Float32Array([0, 0, 100, 100]),
    delete: () => {},
  }
}

export function createMockSurface() {
  const canvas = createMockCanvas()
  return {
    canvas,
    getCanvas: () => canvas,
    flush: () => {},
    dispose: () => {},
  }
}

export function createMockParagraph(height = 20) {
  return {
    layout: () => {},
    getHeight: () => height,
    delete: () => {},
  }
}

export function createMockParagraphBuilder() {
  const para = createMockParagraph()
  return {
    pushStyle: () => {},
    addText: () => {},
    build: () => para,
    delete: () => {},
  }
}

/** Full mock CanvasKit instance matching the interface used in render() methods. */
export function createMockCK() {
  const surface = createMockSurface()

  return {
    surface,
    MakeWebGLCanvasSurface: () => surface,
    Color4f: (r: number, g: number, b: number, a: number) => new Float32Array([r, g, b, a]),
    ColorSpace: { SRGB: {} },
    Paint: class { constructor() { return createMockPaint() } } as unknown as new () => ReturnType<typeof createMockPaint>,
    PaintStyle: { Fill: 'Fill', Stroke: 'Stroke' },
    StrokeCap: { Butt: 'Butt', Round: 'Round', Square: 'Square' },
    StrokeJoin: { Miter: 'Miter', Round: 'Round', Bevel: 'Bevel' },
    TileMode: { Clamp: 'Clamp' },
    Shader: {
      MakeLinearGradient: () => null,
    },
    ClipOp: { Intersect: 'Intersect', Difference: 'Difference' },
    LTRBRect: (l: number, t: number, r: number, b: number) => new Float32Array([l, t, r, b]),
    RRectXY: (rect: Float32Array, rx: number, ry: number) =>
      new Float32Array([...rect, rx, ry, rx, ry, rx, ry, rx, ry]),
    Path: {
      MakeFromSVGString: (_svg: string) => createMockPath(),
    },
    TextAlign: { Left: 'Left', Center: 'Center', Right: 'Right' },
    FontWeight: { Normal: 400, Bold: 700, 400: 400, 700: 700 },
    FontSlant: { Upright: 'Upright', Italic: 'Italic' },
    ParagraphStyle: (_opts: unknown) => ({}),
    TextStyle: () => ({
      color: new Float32Array([0, 0, 0, 1]),
      fontFamilies: [] as string[],
      fontSize: 16,
      fontStyle: { weight: 400, slant: 'Upright' },
      heightMultiplier: 1.2,
    }),
    ParagraphBuilder: {
      Make: () => createMockParagraphBuilder(),
    },
    TypefaceFontProvider: {
      Make: () => ({
        registerFont: () => {},
      }),
    },
    MakeImageFromEncoded: () => null,
    FilterMode: { Linear: 'Linear' },
    MipmapMode: { Linear: 'Linear' },
  }
}

/** Create a minimal mock HTMLCanvasElement for tests. */
export function createMockHTMLCanvas(width = 800, height = 600): HTMLCanvasElement {
  return {
    width,
    height,
    clientWidth: width,
    clientHeight: height,
    getContext: () => null,
    getBoundingClientRect: () =>
      ({ left: 0, top: 0, right: width, bottom: height, width, height, x: 0, y: 0 }) as DOMRect,
    addEventListener: () => {},
    removeEventListener: () => {},
    style: {} as CSSStyleDeclaration,
  } as unknown as HTMLCanvasElement
}
