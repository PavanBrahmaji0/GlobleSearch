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
      // Use OSM tiles via baseLayer — no Ion token required
      baseLayer: new Cesium.ImageryLayer(
        new Cesium.OpenStreetMapImageryProvider({
          url: 'https://tile.openstreetmap.org/',
        })
      ),
    });

    this.applyGlobeConfig(config);
  }

  private applyGlobeConfig(config: GlobeMapConfig) {
    const scene = this.viewer.scene;
    const globe = scene.globe;

    scene.backgroundColor = Cesium.Color.fromCssColorString(config.globe.backgroundColor);

    if (!config.globe.showStars && scene.skyBox) {
      scene.skyBox.show = false;
    }

    globe.showGroundAtmosphere = config.globe.atmosphereEnabled;
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = config.globe.atmosphereEnabled;
    }

    globe.enableLighting = true;
    scene.highDynamicRange = false;

    // Hide default credit container
    (this.viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';
  }

  destroy() {
    if (!this.viewer.isDestroyed()) {
      this.viewer.destroy();
    }
  }
}
