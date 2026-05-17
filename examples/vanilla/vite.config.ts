import { defineConfig, Plugin } from 'vite';
import { resolve } from 'path';

/**
 * Intercepts every `import * as Cesium from 'cesium'` (or any named import)
 * and redirects it to a virtual module that re-exports from window.Cesium
 * (loaded synchronously via the CDN <script> tag in index.html).
 * This completely prevents Vite from touching the npm cesium package at runtime,
 * avoiding CJS/ESM conflicts in its internal dependencies (mersenne-twister etc).
 * TypeScript still gets proper types from the npm package at compile time.
 */
function cesiumCDNPlugin(): Plugin {
  const VIRTUAL = '\0virtual:cesium-cdn';
  return {
    name: 'cesium-cdn-global',
    resolveId(id) {
      if (id === 'cesium') return VIRTUAL;
    },
    load(id) {
      if (id !== VIRTUAL) return;
      // Export the specific Cesium names used in @globlesearch/core
      // import * as Cesium from 'cesium' → Cesium.Viewer, Cesium.Cartesian3, etc.
      return `
const _C = globalThis.Cesium;
export default _C;
export const Viewer                       = _C.Viewer;
export const Cartesian3                   = _C.Cartesian3;
export const Cartographic                 = _C.Cartographic;
export const Math                         = _C.Math;
export const Color                        = _C.Color;
export const Ion                          = _C.Ion;
export const ImageryLayer                 = _C.ImageryLayer;
export const OpenStreetMapImageryProvider = _C.OpenStreetMapImageryProvider;
export const EllipsoidTerrainProvider     = _C.EllipsoidTerrainProvider;
export const Sun                          = _C.Sun;
export const Moon                         = _C.Moon;
export const SkyBox                       = _C.SkyBox;
export const SkyAtmosphere                = _C.SkyAtmosphere;
export const SceneMode                    = _C.SceneMode;
export const HeadingPitchRange            = _C.HeadingPitchRange;
`;
    },
  };
}

export default defineConfig({
  plugins: [cesiumCDNPlugin()],
  resolve: {
    alias: {
      '@globlesearch/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
