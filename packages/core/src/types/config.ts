export interface GlobeMapConfig {
  globe: {
    baseColor: string;
    atmosphereEnabled: boolean;
    atmosphereGlow: number;
    terrainProvider: 'none' | 'cesium' | 'custom';
    terrainExaggeration: number;
    showStars: boolean;
    backgroundColor: string;
  };
  rotation: {
    enabled: boolean;
    speed: number;
    direction: 'east' | 'west';
    pauseOnHover: boolean;
    pauseOnSearch: boolean;
  };
  flight: {
    mode: 'spiral' | 'direct';
    duration: number;
    easing: 'easeInOutCubic' | 'easeOutQuart' | 'linear' | 'globeFlight';
    spiralTightness: number;
    maintainRotationFluidity: boolean;
    altitudeDrop: number;
    minimumAltitude: number;
  };
  morph: {
    autoMorphOnArrival: boolean;
    morphThresholdAltitude: number;
    morphDuration: number;
    mapProvider: 'cesium2d' | 'leaflet' | 'mapbox';
    mapStyle: string;
  };
  geocoding: {
    provider: 'nominatim' | 'custom';
    apiKey?: string;
    cacheResults: boolean;
    cacheTTL: number;
    rateLimitMs: number;
  };
  interaction: {
    enableZoom: boolean;
    enablePan: boolean;
    enableRotate: boolean;
    enableTilt: boolean;
    zoomSpeed: number;
  };
  performance: {
    targetFPS: number;
    lowPowerMode: boolean;
    detailLevel: 'high' | 'medium' | 'low';
  };
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
