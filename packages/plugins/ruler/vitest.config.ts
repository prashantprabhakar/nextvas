import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@nexvas/plugin-ruler',
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
  },
})
