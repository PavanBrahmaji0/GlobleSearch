import type { GlobeMapConfig } from '../types/config';

export const DEFAULT_CONFIG: GlobeMapConfig = {
  globe: {
    baseColor: '#1a3b5c',
    atmosphereEnabled: true,
    atmosphereGlow: 0.6,
    terrainProvider: 'none',
    terrainExaggeration: 1.0,
    showStars: true,
    backgroundColor: '#000011',
  },
  rotation: {
    enabled: true,
    speed: 0.5,
    direction: 'east',
    pauseOnHover: true,
    pauseOnSearch: true,
  },
  flight: {
    mode: 'spiral',
    duration: 3000,
    easing: 'globeFlight',
    spiralTightness: 2.0,
    maintainRotationFluidity: true,
    altitudeDrop: 20_000_000,
    minimumAltitude: 5000,
  },
  morph: {
    autoMorphOnArrival: false,
    morphThresholdAltitude: 50000,
    morphDuration: 2000,
    mapProvider: 'cesium2d',
    mapStyle: 'streets',
  },
  geocoding: {
    provider: 'nominatim',
    cacheResults: true,
    cacheTTL: 86_400_000,
    rateLimitMs: 1100,
  },
  interaction: {
    enableZoom: true,
    enablePan: true,
    enableRotate: true,
    enableTilt: true,
    zoomSpeed: 1.0,
  },
  performance: {
    targetFPS: 60,
    lowPowerMode: false,
    detailLevel: 'high',
  },
};
