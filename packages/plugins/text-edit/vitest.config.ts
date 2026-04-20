import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@nexvas/plugin-text-edit',
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
})
