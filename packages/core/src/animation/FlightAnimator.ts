import * as Cesium from 'cesium';
import type { GlobeMapConfig } from '../types/config';
import type { LatLng } from '../types/geo';
import { getEasing } from './Easing';
import { buildSpiralPath, buildDirectPath, PathPoint } from './SplinePath';

type ProgressCallback = (progress: number, point: PathPoint) => void;
type CompleteCallback = () => void;

export class FlightAnimator {
  private viewer: Cesium.Viewer;
  private config: GlobeMapConfig;
  private preRenderHandler: (() => void) | null = null;
  private isCancelled = false;

  constructor(viewer: Cesium.Viewer, config: GlobeMapConfig) {
    this.viewer = viewer;
    this.config = config;
  }

  cancel() {
    this.isCancelled = true;
    if (this.preRenderHandler) {
      this.viewer.scene.preRender.removeEventListener(this.preRenderHandler);
      this.preRenderHandler = null;
    }
  }

  flyTo(
    destination: LatLng,
    onProgress?: ProgressCallback,
    onComplete?: CompleteCallback
  ): Promise<void> {
    this.cancel();
    this.isCancelled = false;

    return new Promise(resolve => {
      const camera = this.viewer.camera;
      const startCarto = Cesium.Cartographic.fromCartesian(camera.position);

      const startPoint: PathPoint = {
        lat: Cesium.Math.toDegrees(startCarto.latitude),
        lng: Cesium.Math.toDegrees(startCarto.longitude),
        altitude: startCarto.height,
      };

      const endPoint: PathPoint = {
        lat: destination.lat,
        lng: destination.lng,
        altitude: this.config.flight.minimumAltitude,
      };

      const flightConfig = this.config.flight;
      const steps = Math.max(60, Math.round((flightConfig.duration / 1000) * 60));
      const easing = getEasing(flightConfig.easing);

      const path =
        flightConfig.mode === 'spiral'
          ? buildSpiralPath(startPoint, endPoint, steps, flightConfig.spiralTightness, easing)
          : buildDirectPath(startPoint, endPoint, steps, easing);

      const startTime = performance.now();
      const totalDuration = flightConfig.duration;

      this.preRenderHandler = () => {
        if (this.isCancelled) return;

        const elapsed = performance.now() - startTime;
        const rawProgress = Math.min(elapsed / totalDuration, 1);
        const idx = Math.min(Math.round(rawProgress * steps), steps);
        const point = path[idx];

        camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(point.lng, point.lat, point.altitude),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-75),
            roll: 0,
          },
        });

        onProgress?.(rawProgress, point);

        if (rawProgress >= 1) {
          this.cancel();
          onComplete?.();
          resolve();
        }
      };

      this.viewer.scene.preRender.addEventListener(this.preRenderHandler);
    });
  }
}
