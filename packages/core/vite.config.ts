import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'GlobleSearchCore',
      fileName: 'globlesearch-core',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['cesium', 'leaflet'],
      output: {
        globals: {
          cesium: 'Cesium',
          leaflet: 'L',
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
});
