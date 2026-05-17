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
  // Once a flight or search happens, hover must NOT restart rotation
  // (prevents the globe spinning around the destination at low altitude)
  private hasFlown = false;
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
      const results = await this.geocoder.search(location);
      this.emit('searchResults', { results });
      if (results.length === 0) return;
      dest = { lat: results[0].lat, lng: results[0].lng };
    } else {
      dest = { lat: location.lat, lng: location.lng };
    }

    // Stop rotation for the flight and mark that a flight occurred
    this.camera.stopRotation();
    this.hasFlown = true;
    this.emit('rotationPause', {});

    if (options?.mode) this.config.flight.mode = options.mode;
    if (options?.duration) this.config.flight.duration = options.duration;
    if (options?.altitude) this.config.flight.minimumAltitude = options.altitude;

    this.isFlying = true;
    this.animator.cancel();
    this.emit('flightStart', { destination: dest });

    await this.animator.flyTo(
      dest,
      (progress, point) => {
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
    // Returning to globe resets the flight flag and restores rotation
    this.hasFlown = false;
    if (this.config.rotation.enabled) {
      this.camera.startRotation();
      this.emit('rotationStart', {});
    }
  }

  // ─── Camera ─────────────────────────────────────────────────────────────────

  getCamera(): CameraPosition {
    return this.camera.getPosition();
  }

  setCamera(position: CameraPosition): void {
    this.camera.setPosition(position);
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

  // ─── Hover pause (only active before any flight) ─────────────────────────

  private setupHoverPause() {
    if (!this.config.rotation.pauseOnHover) return;
    const canvas = this.engine.viewer.canvas;

    const onEnter = () => {
      // Don't interfere once a flight has happened — rotation stays off
      if (this.hasFlown || this.isFlying) return;
      this.camera.stopRotation();
    };

    const onLeave = () => {
      // Resume hover-pause only if no flight has occurred
      if (this.hasFlown || this.isFlying) return;
      if (this.config.rotation.enabled && this.scene.mode === 'globe') {
        this.camera.startRotation();
      }
    };

    canvas.addEventListener('mouseenter', onEnter);
    canvas.addEventListener('mouseleave', onLeave);

    this.hoverUnlisten = () => {
      canvas.removeEventListener('mouseenter', onEnter);
      canvas.removeEventListener('mouseleave', onLeave);
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
