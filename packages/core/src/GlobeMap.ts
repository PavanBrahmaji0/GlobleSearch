import type { GlobeMapConfig, DeepPartial } from './types/config';
import type { LatLng, GeocodingResult, CameraPosition } from './types/geo';
import type { GlobeMapEvent, GlobeMapEventMap } from './types/events';
import type { FlightOptions, MorphOptions } from './types/ux';
import { buildConfig } from './config/validation';
import { GlobeEngine } from './engine/GlobeEngine';
import { CameraController } from './engine/CameraController';
import { SceneManager } from './engine/SceneManager';
import { FlightAnimator } from './animation/FlightAnimator';
import { Geocoder } from './search/Geocoder';

type EventHandler<K extends GlobeMapEvent> = (payload: GlobeMapEventMap[K]) => void;
type AnyHandler = (payload: unknown) => void;

export class GlobeMap {
  private engine: GlobeEngine;
  private camera: CameraController;
  private scene: SceneManager;
  private animator: FlightAnimator;
  private geocoder: Geocoder;
  private config: GlobeMapConfig;
  private handlers = new Map<GlobeMapEvent, Set<AnyHandler>>();
  private isFlying = false;
  private hoverUnlisten: (() => void) | null = null;

  constructor(container: HTMLElement, config?: DeepPartial<GlobeMapConfig>) {
    this.config = buildConfig(config);
    this.engine = new GlobeEngine(container, this.config);
    this.camera = new CameraController(this.engine.viewer, this.config);
    this.scene = new SceneManager(this.engine.viewer);
    this.animator = new FlightAnimator(this.engine.viewer, this.config);
    this.geocoder = new Geocoder(this.config);

    this.setupHoverPause();

    if (this.config.rotation.enabled) {
      this.camera.startRotation();
      this.emit('rotationStart', {});
    }
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  async flyTo(
    location: string | LatLng | GeocodingResult,
    options?: FlightOptions
  ): Promise<void> {
    let dest: LatLng;

    if (typeof location === 'string') {
      this.emit('searchStart', { query: location });
      if (this.config.rotation.pauseOnSearch) {
        this.camera.stopRotation();
        this.emit('rotationPause', {});
      }
      const results = await this.geocoder.search(location);
      this.emit('searchResults', { results });
      if (results.length === 0) return;
      dest = { lat: results[0].lat, lng: results[0].lng };
    } else {
      dest = { lat: location.lat, lng: location.lng };
    }

    if (options) {
      // Temporarily patch config for this flight
      if (options.mode) this.config.flight.mode = options.mode;
      if (options.duration) this.config.flight.duration = options.duration;
      if (options.altitude) this.config.flight.minimumAltitude = options.altitude;
    }

    this.isFlying = true;
    this.animator.cancel();

    if (!this.config.rotation.pauseOnSearch) {
      this.camera.stopRotation();
    }

    this.emit('flightStart', { destination: dest });

    await this.animator.flyTo(
      dest,
      (progress, point) => {
        this.camera.setAltitude(point.altitude);
        this.emit('flightProgress', {
          progress,
          position: { lat: point.lat, lng: point.lng, altitude: point.altitude },
        });
        this.emit('altitudeChange', { altitude: point.altitude });
      },
      () => {
        this.isFlying = false;
        this.emit('flightComplete', { destination: dest });

        if (this.config.morph.autoMorphOnArrival) {
          this.morphToMap().catch(() => undefined);
        }
      }
    );
  }

  async search(query: string): Promise<GeocodingResult[]> {
    this.emit('searchStart', { query });
    try {
      const results = await this.geocoder.search(query);
      this.emit('searchResults', { results });
      return results;
    } catch (err) {
      this.emit('searchError', { error: err instanceof Error ? err : new Error(String(err)) });
      return [];
    }
  }

  // ─── Morph ─────────────────────────────────────────────────────────────────

  async morphToMap(options?: MorphOptions): Promise<void> {
    this.emit('morphStart', {});
    this.emit('modeChange', { mode: 'morphing' });
    await this.scene.morphToMap(options?.duration ?? this.config.morph.morphDuration);
    this.emit('morphComplete', {});
    this.emit('modeChange', { mode: 'map' });
  }

  async morphToGlobe(options?: MorphOptions): Promise<void> {
    this.emit('modeChange', { mode: 'morphing' });
    await this.scene.morphToGlobe(options?.duration ?? this.config.morph.morphDuration);
    this.emit('modeChange', { mode: 'globe' });
    if (this.config.rotation.enabled) {
      this.camera.startRotation();
      this.emit('rotationStart', {});
    }
  }

  // ─── Camera ─────────────────────────────────────────────────────────────────

  getCamera(): CameraPosition {
    return this.camera.getPosition();
  }

  setCamera(position: CameraPosition, duration = 0): void {
    this.camera.setPosition(position, duration);
  }

  // ─── Events ─────────────────────────────────────────────────────────────────

  on<K extends GlobeMapEvent>(event: K, handler: EventHandler<K>): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler as AnyHandler);
  }

  off<K extends GlobeMapEvent>(event: K, handler: EventHandler<K>): void {
    this.handlers.get(event)?.delete(handler as AnyHandler);
  }

  private emit<K extends GlobeMapEvent>(event: K, payload: GlobeMapEventMap[K]): void {
    this.handlers.get(event)?.forEach(h => h(payload));
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  private setupHoverPause() {
    if (!this.config.rotation.pauseOnHover) return;
    const canvas = this.engine.viewer.canvas;

    const pause = () => {
      if (!this.isFlying) {
        this.camera.stopRotation();
        this.emit('rotationPause', {});
      }
    };
    const resume = () => {
      if (!this.isFlying && this.config.rotation.enabled && this.scene.mode === 'globe') {
        this.camera.startRotation();
        this.emit('rotationStart', {});
      }
    };

    canvas.addEventListener('mouseenter', pause);
    canvas.addEventListener('mouseleave', resume);

    this.hoverUnlisten = () => {
      canvas.removeEventListener('mouseenter', pause);
      canvas.removeEventListener('mouseleave', resume);
    };
  }

  destroy(): void {
    this.animator.cancel();
    this.camera.stopRotation();
    this.hoverUnlisten?.();
    this.engine.destroy();
    this.handlers.clear();
  }
}
