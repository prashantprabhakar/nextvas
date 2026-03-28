# loadCanvasKit

Loads and initializes the CanvasKit WebAssembly module. This must be called before creating a `Stage`.

## Package

```ts
import { loadCanvasKit, checkSupport } from '@nexvas/renderer'
```

## loadCanvasKit

```ts
async function loadCanvasKit(wasmUrl?: string): Promise<CanvasKit>
```

Loads the CanvasKit WASM module and returns the initialized instance. The result is **cached** — calling it multiple times returns the same instance. Safe to call from multiple places without worrying about double-loading.

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `wasmUrl` | `string` | URL of the `canvaskit.wasm` file. Defaults to jsDelivr CDN for the pinned version. |

### Throws

If the WASM fails to load (network error, unsupported browser), the promise rejects with a descriptive error. There is no silent fallback to Canvas 2D.

### Example

```ts
// Default — loads from CDN
const ck = await loadCanvasKit()

// Self-hosted WASM (copy canvaskit.wasm to your public directory)
const ck = await loadCanvasKit('/assets/canvaskit.wasm')

const stage = new Stage({ canvas, canvasKit: ck })
```

## checkSupport

```ts
function checkSupport(): { supported: boolean; reason?: string }
```

Checks whether the current browser supports CanvasKit (WebAssembly SIMD + WebGL2) without loading the WASM. Use this to show a graceful "unsupported browser" message before attempting to initialize.

```ts
const { supported, reason } = checkSupport()
if (!supported) {
  document.body.innerHTML = `<p>Your browser is not supported: ${reason}</p>`
} else {
  const ck = await loadCanvasKit()
  // ...
}
```
