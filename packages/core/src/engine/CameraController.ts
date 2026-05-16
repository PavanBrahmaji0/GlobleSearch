import * as Cesium from 'cesium';
import type { CameraPosition } from '../types/geo';
import type { GlobeMapConfig } from '../types/config';

export class CameraController {
  private viewer: Cesium.Viewer;
  private config: GlobeMapConfig;
  private rotationAngle = 0;
  private rotationRAF: number | null = null;
  private lastTime: number | null = null;
  private rotatingEnabled = false;
  private currentAltitude = 20_000_000;

  constructor(viewer: Cesium.Viewer, config: GlobeMapConfig) {
    this.viewer = viewer;
    this.config = config;

    // Start at a wide orbit view
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, this.currentAltitude),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
    });
  }

  startRotation() {
    if (this.rotatingEnabled) return;
    this.rotatingEnabled = true;
    this.lastTime = null;
    this.tick();
  }

  stopRotation() {
    this.rotatingEnabled = false;
    if (this.rotationRAF !== null) {
      cancelAnimationFrame(this.rotationRAF);
      this.rotationRAF = null;
    }
    this.lastTime = null;
  }

  private tick = () => {
    if (!this.rotatingEnabled) return;
    this.rotationRAF = requestAnimationFrame(this.tick);

    const now = performance.now();
    if (this.lastTime === null) {
      this.lastTime = now;
      return;
    }
    const dt = (now - this.lastTime) / 1000; // seconds
    this.lastTime = now;

    // Speed proportional to altitude so it slows as we zoom in
    const altRatio = Math.min(this.currentAltitude / 20_000_000, 1);
    const speed = this.config.rotation.speed * Math.sqrt(altRatio);
    const delta = this.config.rotation.direction === 'east' ? speed * dt : -speed * dt;
    this.rotationAngle += delta;

    const camera = this.viewer.camera;
    const carto = Cesium.Cartographic.fromCartesian(camera.position);
    const lng = Cesium.Math.toDegrees(carto.longitude) + delta;
    const lat = Cesium.Math.toDegrees(carto.latitude);
    const alt = carto.height;

    this.currentAltitude = alt;

    camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, alt),
      orientation: {
        heading: camera.heading,
        pitch: camera.pitch,
        roll: 0,
      },
    });
  };

  setAltitude(altitude: number) {
    this.currentAltitude = altitude;
  }

  getPosition(): CameraPosition {
    const carto = Cesium.Cartographic.fromCartesian(this.viewer.camera.position);
    return {
      lat: Cesium.Math.toDegrees(carto.latitude),
      lng: Cesium.Math.toDegrees(carto.longitude),
      altitude: carto.height,
      heading: Cesium.Math.toDegrees(this.viewer.camera.heading),
      pitch: Cesium.Math.toDegrees(this.viewer.camera.pitch),
    };
  }

  setPosition(pos: CameraPosition, duration = 0) {
    if (duration === 0) {
      this.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(pos.lng, pos.lat, pos.altitude),
        orientation: {
          heading: Cesium.Math.toRadians(pos.heading ?? 0),
          pitch: Cesium.Math.toRadians(pos.pitch ?? -90),
          roll: 0,
        },
      });
      this.currentAltitude = pos.altitude;
    }
  }
}
