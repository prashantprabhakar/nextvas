import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@nexvas/plugin-grid',
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
})
