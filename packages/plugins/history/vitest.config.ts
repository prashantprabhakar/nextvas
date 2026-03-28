import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@nexvas/plugin-history',
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
})
