import * as Cesium from 'cesium';
import type { CameraPosition } from '../types/geo';
import type { GlobeMapConfig } from '../types/config';

export const INITIAL_ALTITUDE = 20_000_000; // 20,000 km — full globe visible

export class CameraController {
  private viewer: Cesium.Viewer;
  private config: GlobeMapConfig;
  private rotatingEnabled = false;
  private lastRenderTime: number | null = null;
  // Bound listener stored so we can remove it
  private preRenderHandler: (() => void) | null = null;

  constructor(viewer: Cesium.Viewer, config: GlobeMapConfig) {
    this.viewer = viewer;
    this.config = config;

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(0, 20, INITIAL_ALTITUDE),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
    });
  }

  get isRotating(): boolean {
    return this.rotatingEnabled;
  }

  startRotation() {
    if (this.rotatingEnabled) return;
    this.rotatingEnabled = true;
    this.lastRenderTime = null;

    this.preRenderHandler = () => this.onPreRender();
    // scene.preRender fires every frame just before Cesium draws — safe for camera updates
    this.viewer.scene.preRender.addEventListener(this.preRenderHandler);
    // Force at least one render so the loop starts
    this.viewer.scene.requestRender();
  }

  stopRotation() {
    if (!this.rotatingEnabled) return;
    this.rotatingEnabled = false;
    if (this.preRenderHandler) {
      this.viewer.scene.preRender.removeEventListener(this.preRenderHandler);
      this.preRenderHandler = null;
    }
    this.lastRenderTime = null;
  }

  private onPreRender() {
    if (!this.rotatingEnabled) return;

    const now = performance.now();
    if (this.lastRenderTime === null) {
      this.lastRenderTime = now;
      return;
    }
    const dt = Math.min((now - this.lastRenderTime) / 1000, 0.05); // cap at 50ms to avoid jump on tab re-focus
    this.lastRenderTime = now;

    // Slow down rotation as camera zooms in (proportional to sqrt of altitude ratio)
    const alt = Cesium.Cartographic.fromCartesian(this.viewer.camera.position).height;
    const altRatio = Math.min(alt / INITIAL_ALTITUDE, 1);
    const speedDeg = this.config.rotation.speed * Math.sqrt(altRatio);
    const angleRad = Cesium.Math.toRadians(speedDeg * dt);

    // Rotate camera around Earth's polar axis (UNIT_Z = north pole direction in ECEF)
    // Positive angle = camera moves westward = globe appears to spin eastward
    const sign = this.config.rotation.direction === 'east' ? 1 : -1;
    this.viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, sign * angleRad);
  }

  getPosition(): CameraPosition {
    const cam = this.viewer.camera;
    const carto = Cesium.Cartographic.fromCartesian(cam.position);
    return {
      lat: Cesium.Math.toDegrees(carto.latitude),
      lng: Cesium.Math.toDegrees(carto.longitude),
      altitude: carto.height,
      heading: Cesium.Math.toDegrees(cam.heading),
      pitch: Cesium.Math.toDegrees(cam.pitch),
    };
  }

  setPosition(pos: CameraPosition) {
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(pos.lng, pos.lat, pos.altitude),
      orientation: {
        heading: Cesium.Math.toRadians(pos.heading ?? 0),
        pitch: Cesium.Math.toRadians(pos.pitch ?? -90),
        roll: 0,
      },
    });
  }
}
