import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@globlesearch/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  build: {
    rollupOptions: {
      external: ['cesium'],
      output: {
        globals: { cesium: 'Cesium' },
      },
    },
  },
  optimizeDeps: {
    exclude: ['cesium'],
  },
  server: {
    port: 5173,
    open: true,
  },
});
