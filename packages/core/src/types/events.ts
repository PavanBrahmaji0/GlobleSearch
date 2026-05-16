import type { GeocodingResult } from './geo';
import type { CameraPosition } from './geo';

export type GlobeMapEvent =
  | 'flightStart'
  | 'flightProgress'
  | 'flightComplete'
  | 'flightCancelled'
  | 'morphStart'
  | 'morphProgress'
  | 'morphComplete'
  | 'markerClick'
  | 'markerHover'
  | 'locationSelect'
  | 'searchStart'
  | 'searchResults'
  | 'searchError'
  | 'rotationStart'
  | 'rotationPause'
  | 'altitudeChange'
  | 'modeChange';

export interface GlobeMapEventMap {
  flightStart: { destination: GeocodingResult | { lat: number; lng: number } };
  flightProgress: { progress: number; position: CameraPosition };
  flightComplete: { destination: GeocodingResult | { lat: number; lng: number } };
  flightCancelled: Record<string, never>;
  morphStart: Record<string, never>;
  morphProgress: { progress: number; globeOpacity: number; mapOpacity: number };
  morphComplete: Record<string, never>;
  markerClick: { markerId: string; position: { lat: number; lng: number } };
  markerHover: { markerId: string };
  locationSelect: { lat: number; lng: number };
  searchStart: { query: string };
  searchResults: { results: GeocodingResult[] };
  searchError: { error: Error };
  rotationStart: Record<string, never>;
  rotationPause: Record<string, never>;
  altitudeChange: { altitude: number };
  modeChange: { mode: 'globe' | 'morphing' | 'map' };
}
