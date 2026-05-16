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
  private rafId: number | null = null;
  private isCancelled = false;

  constructor(viewer: Cesium.Viewer, config: GlobeMapConfig) {
    this.viewer = viewer;
    this.config = config;
  }

  cancel() {
    this.isCancelled = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
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

      const endAlt = this.config.flight.minimumAltitude;
      const endPoint: PathPoint = {
        lat: destination.lat,
        lng: destination.lng,
        altitude: endAlt,
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

      const animate = () => {
        if (this.isCancelled) return;

        const elapsed = performance.now() - startTime;
        const rawProgress = Math.min(elapsed / totalDuration, 1);

        // Map rawProgress to path index
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

        if (rawProgress < 1) {
          this.rafId = requestAnimationFrame(animate);
        } else {
          this.rafId = null;
          onComplete?.();
          resolve();
        }
      };

      this.rafId = requestAnimationFrame(animate);
    });
  }
}
