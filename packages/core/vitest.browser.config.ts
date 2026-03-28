import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

/**
 * Browser-mode vitest config for visual regression (pixel snapshot) tests.
 *
 * These tests render actual CanvasKit/WebGL output in Chromium (via Playwright)
 * and compare it against committed PNG baselines. They are separate from unit
 * tests because they:
 *   - Need a real browser (no jsdom)
 *   - Load the CanvasKit WASM (~2 MB)
 *   - Are slower and only need to run on CI or locally when touching rendering code
 *
 * First run: generates baselines in tests/visual/__snapshots__/.
 * Subsequent runs: fail on pixel regression.
 * Update baselines: pnpm -F @nexvas/core test:visual:update
 */
export default defineConfig({
  test: {
    name: '@nexvas/core:visual',
    browser: {
      enabled: true,
      provider: playwright({}),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    include: ['tests/visual/**/*.test.ts'],
    // Visual tests are slower — give them more time to load CanvasKit WASM
    testTimeout: 30_000,
  },
  // Allow Vite dev server to serve canvaskit-wasm from node_modules
  server: {
    fs: {
      allow: ['../../'],
    },
  },
})
