import * as Cesium from 'cesium';
import type { GlobeMapConfig } from '../types/config';

export class GlobeEngine {
  readonly viewer: Cesium.Viewer;

  constructor(container: HTMLElement, config: GlobeMapConfig) {
    this.viewer = new Cesium.Viewer(container, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      // skyBox: false disables stars, Sun, and Moon (all load external textures)
      skyBox: false,
      // Use OSM tiles — no Ion token required
      baseLayer: new Cesium.ImageryLayer(
        new Cesium.OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/',
        })
      ),
    });

    this.applyGlobeConfig(config);
    this.setupErrorHandling();
  }

  private applyGlobeConfig(config: GlobeMapConfig) {
    const scene = this.viewer.scene;
    const globe = scene.globe;

    // Don't stop rendering if a non-fatal error occurs (e.g. a tile decode failure)
    scene.rethrowRenderErrors = false;

    scene.backgroundColor = Cesium.Color.fromCssColorString(config.globe.backgroundColor);

    // Disable atmosphere (shader-based, safe) based on config
    globe.showGroundAtmosphere = config.globe.atmosphereEnabled;
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = config.globe.atmosphereEnabled;
    }

    // Keep lighting off — no Sun object means dynamic lighting would be black
    globe.enableLighting = false;
    scene.highDynamicRange = false;

    // Hide Cesium's credit banner
    (this.viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';
  }

  private setupErrorHandling() {
    // Log render errors without crashing the app
    this.viewer.scene.renderError.addEventListener((_scene: unknown, error: unknown) => {
      console.warn('[GlobeMap] render error (non-fatal):', error);
    });
  }

  destroy() {
    if (!this.viewer.isDestroyed()) {
      this.viewer.destroy();
    }
  }
}
