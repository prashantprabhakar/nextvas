/**
 * Shared helpers for visual regression tests.
 * These run in a real Chromium browser via @vitest/browser + Playwright.
 */

// Vite resolves the ?url import to a path the dev server can serve.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — virtual URL import, resolved by Vite at test time
import canvasKitWasmUrl from 'canvaskit-wasm/bin/canvaskit.wasm?url'

import { Stage } from '../../src/Stage.js'
import type { StageOptions } from '../../src/Stage.js'
import type { Layer } from '../../src/Layer.js'
import type { BaseObject } from '../../src/objects/BaseObject.js'

// ---------------------------------------------------------------------------
// CanvasKit singleton — loaded once per browser test session
// ---------------------------------------------------------------------------

let _ck: unknown = null

export async function getCanvasKit(): Promise<unknown> {
  if (_ck) return _ck

  // CanvasKitInit is the default export of canvaskit-wasm/bin/canvaskit.js
  const CanvasKitInit = (await import('canvaskit-wasm/bin/canvaskit.js')).default as (
    opts: Record<string, unknown>,
  ) => Promise<unknown>

  _ck = await CanvasKitInit({ locateFile: () => canvasKitWasmUrl as string })
  return _ck
}

// ---------------------------------------------------------------------------
// Stage + canvas factory
// ---------------------------------------------------------------------------

export interface TestStage {
  stage: Stage
  canvas: HTMLCanvasElement
  layer: Layer
  /** Call after adding objects to take the snapshot. */
  snapshot: () => HTMLCanvasElement
}

/**
 * Create a test stage mounted in the live DOM (required for WebGL).
 * The canvas is appended to `document.body` and removed after the test.
 *
 * @param width  Canvas CSS width (default 400)
 * @param height Canvas CSS height (default 300)
 */
export async function createTestStage(width = 400, height = 300): Promise<TestStage> {
  const ck = await getCanvasKit()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.style.display = 'block'
  // data-testid lets tests select this element via page.getByTestId('canvas')
  canvas.dataset['testid'] = 'canvas'
  document.body.appendChild(canvas)

  const options: StageOptions = { canvas, canvasKit: ck }
  const stage = new Stage(options)
  const layer = stage.addLayer({ name: 'main' })

  return {
    stage,
    canvas,
    layer,
    snapshot: () => {
      stage.render()
      return canvas
    },
  }
}

/**
 * Clean up a test stage.  Call in afterEach to keep the DOM tidy.
 */
export function destroyTestStage({ stage, canvas }: TestStage): void {
  stage.destroy()
  canvas.remove()
}

// ---------------------------------------------------------------------------
// Common object builder shorthand
// ---------------------------------------------------------------------------

/**
 * Render a single object on a fresh 400×300 stage and return the canvas.
 * Handles setup and teardown automatically (stage destroyed after snapshot).
 */
export async function renderObject(
  obj: BaseObject,
  opts?: { width?: number; height?: number },
): Promise<HTMLCanvasElement> {
  const ts = await createTestStage(opts?.width ?? 400, opts?.height ?? 300)
  ts.layer.add(obj)
  const result = ts.snapshot()
  ts.stage.destroy()
  // Keep canvas in DOM for Playwright screenshot — caller removes it.
  return result
}
