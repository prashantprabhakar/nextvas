import CanvasKitInit from 'canvaskit-wasm'
import type { CanvasKit } from 'canvaskit-wasm'

// Pinned to the version installed — update when upgrading canvaskit-wasm
const CANVASKIT_VERSION = '0.41.0'
const DEFAULT_WASM_URL = `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${CANVASKIT_VERSION}/bin/canvaskit.wasm`

let _instance: CanvasKit | null = null
let _loading: Promise<CanvasKit> | null = null

export interface LoadCanvasKitOptions {
  /**
   * URL to the canvaskit.wasm file.
   * Defaults to jsDelivr CDN at the pinned canvaskit-wasm version.
   * Override this to self-host the WASM binary.
   */
  wasmUrl?: string
}

/**
 * Load and initialize CanvasKit (Skia compiled to WebAssembly).
 *
 * The result is cached — subsequent calls return the same instance immediately.
 * Safe to call multiple times concurrently; only one load will be initiated.
 *
 * @throws {CanvasKitLoadError} if the WASM file cannot be fetched or initialized.
 *
 * @example
 * ```ts
 * const ck = await loadCanvasKit()
 * const stage = new Stage({ canvas, canvasKit: ck })
 * ```
 *
 * @example Self-hosted WASM:
 * ```ts
 * const ck = await loadCanvasKit({ wasmUrl: '/assets/canvaskit.wasm' })
 * ```
 */
export async function loadCanvasKit(options: LoadCanvasKitOptions = {}): Promise<CanvasKit> {
  if (_instance !== null) return _instance
  if (_loading !== null) return _loading

  const wasmUrl = options.wasmUrl ?? DEFAULT_WASM_URL

  _loading = CanvasKitInit({
    locateFile: (file: string) => {
      if (file.endsWith('.wasm')) return wasmUrl
      return file
    },
  }).then(
    (ck) => {
      _instance = ck
      _loading = null
      return ck
    },
    (err: unknown) => {
      _loading = null
      throw new CanvasKitLoadError(
        `Failed to load CanvasKit WASM from "${wasmUrl}". ` +
          `Ensure the URL is accessible and the browser supports WebAssembly. ` +
          `Original error: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      )
    },
  )

  return _loading
}

/**
 * Returns the already-loaded CanvasKit instance, or null if not yet loaded.
 * Useful for synchronous code that needs to check availability.
 */
export function getCanvasKit(): CanvasKit | null {
  return _instance
}

/**
 * Check whether the current browser supports CanvasKit (WebAssembly + WebGL).
 * Call this before `loadCanvasKit()` to give a clear error to users on
 * unsupported browsers instead of a cryptic WASM load failure.
 */
export function checkSupport(): { supported: boolean; reason?: string } {
  if (typeof WebAssembly === 'undefined') {
    return { supported: false, reason: 'WebAssembly is not supported in this browser.' }
  }
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
  if (gl === null) {
    return { supported: false, reason: 'WebGL is not available in this browser.' }
  }
  return { supported: true }
}

/** Thrown when CanvasKit fails to load. */
export class CanvasKitLoadError extends Error {
  readonly cause: unknown
  constructor(message: string, options?: { cause?: unknown }) {
    super(message)
    this.name = 'CanvasKitLoadError'
    this.cause = options?.cause
  }
}

/**
 * Reset the cached CanvasKit instance. Primarily for testing.
 * @internal
 */
export function _resetCanvasKitCache(): void {
  _instance = null
  _loading = null
}
