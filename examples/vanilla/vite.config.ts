import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';
import { resolve } from 'path';

export default defineConfig({
  plugins: [cesium()],
  resolve: {
    alias: {
      // Resolve workspace package to its TypeScript source directly
      // so Cesium is bundled once through this vite instance
      '@globlesearch/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
