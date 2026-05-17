import * as Cesium from 'cesium';
import type { CameraPosition } from '../types/geo';
import type { GlobeMapConfig } from '../types/config';

export const INITIAL_LAT = 20;       // degrees
export const INITIAL_LNG = 0;        // degrees
export const INITIAL_ALTITUDE = 20_000_000; // 20,000 km

export class CameraController {
  private viewer: Cesium.Viewer;
  private config: GlobeMapConfig;
  private rotatingEnabled = false;
  private lastRenderTime: number | null = null;
  private preRenderHandler: (() => void) | null = null;

  // Track current lat/lng/alt explicitly to avoid floating-point drift
  private currentLat = INITIAL_LAT;
  private currentLng = INITIAL_LNG;
  private currentAlt = INITIAL_ALTITUDE;

  constructor(viewer: Cesium.Viewer, config: GlobeMapConfig) {
    this.viewer = viewer;
    this.config = config;
    this.snapToPosition(INITIAL_LNG, INITIAL_LAT, INITIAL_ALTITUDE);
  }

  get isRotating(): boolean {
    return this.rotatingEnabled;
  }

  startRotation() {
    if (this.rotatingEnabled) return;
    this.rotatingEnabled = true;
    this.lastRenderTime = null;

    // Sync our state from camera's actual position before starting
    this.syncFromCamera();

    this.preRenderHandler = () => this.onPreRender();
    this.viewer.scene.preRender.addEventListener(this.preRenderHandler);
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
    // Cap dt at 50 ms to avoid a large jump when the browser tab regains focus
    const dt = Math.min((now - this.lastRenderTime) / 1000, 0.05);
    this.lastRenderTime = now;

    // Slow rotation as the camera zooms in (proportional to sqrt of altitude ratio)
    const altRatio = Math.min(this.currentAlt / INITIAL_ALTITUDE, 1);
    const speedDeg = this.config.rotation.speed * Math.sqrt(altRatio);
    const delta = speedDeg * dt; // degrees per step
    const sign = this.config.rotation.direction === 'east' ? 1 : -1;

    this.currentLng += sign * delta;

    // setView with explicit values prevents any altitude or pitch drift
    this.snapToPosition(this.currentLng, this.currentLat, this.currentAlt);
  }

  /** Move camera instantly to a position, always looking straight down. */
  private snapToPosition(lng: number, lat: number, alt: number) {
    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, alt),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
    });
  }

  /** Read the camera's actual position back into our tracked state. */
  private syncFromCamera() {
    const carto = Cesium.Cartographic.fromCartesian(this.viewer.camera.position);
    this.currentLat = Cesium.Math.toDegrees(carto.latitude);
    this.currentLng = Cesium.Math.toDegrees(carto.longitude);
    this.currentAlt = carto.height;
  }

  // Called by FlightAnimator after each flight frame so altitude-proportional
  // rotation speed is always based on the flight's current altitude
  updateAltitude(alt: number) {
    this.currentAlt = alt;
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
    this.snapToPosition(pos.lng, pos.lat, pos.altitude);
    this.currentLat = pos.lat;
    this.currentLng = pos.lng;
    this.currentAlt = pos.altitude;
  }
}
