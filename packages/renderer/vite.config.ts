import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'CanvasFwRenderer',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['canvaskit-wasm', '@nexvas/core'],
    },
    sourcemap: true,
    target: 'es2020',
  },
})
