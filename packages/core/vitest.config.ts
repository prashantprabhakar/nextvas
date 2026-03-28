import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@nexvas/core',
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/visual/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      reporter: ['text', 'lcov'],
    },
  },
})
