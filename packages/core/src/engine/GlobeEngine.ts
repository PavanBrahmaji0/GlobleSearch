import * as Cesium from 'cesium';
import type { GlobeMapConfig } from '../types/config';

export class GlobeEngine {
  readonly viewer: Cesium.Viewer;

  constructor(container: HTMLElement, config: GlobeMapConfig) {
    // Disable Ion so we don't need a token for basic usage
    Cesium.Ion.defaultAccessToken = '';

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
      // Use OSM as the base imagery (no token needed)
      baseLayer: new Cesium.ImageryLayer(
        new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' })
      ),
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    });

    this.applyGlobeConfig(config);
  }

  private applyGlobeConfig(config: GlobeMapConfig) {
    const scene = this.viewer.scene;
    const globe = scene.globe;

    // Sky / background
    scene.backgroundColor = Cesium.Color.fromCssColorString(config.globe.backgroundColor);
    scene.skyBox = config.globe.showStars ? undefined : (null as unknown as Cesium.SkyBox);
    scene.sun = new Cesium.Sun();
    scene.moon = new Cesium.Moon();

    // Atmosphere
    globe.showGroundAtmosphere = config.globe.atmosphereEnabled;
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = config.globe.atmosphereEnabled;
    }

    // Lighting
    globe.enableLighting = true;
    scene.highDynamicRange = false;
  }

  destroy() {
    if (!this.viewer.isDestroyed()) {
      this.viewer.destroy();
    }
  }
}
