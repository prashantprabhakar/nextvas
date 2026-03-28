import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@nexvas/plugin-drag',
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
})
