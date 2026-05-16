export interface LatLng {
  lat: number;
  lng: number;
}

export interface CameraPosition {
  lat: number;
  lng: number;
  altitude: number;
  heading?: number;
  pitch?: number;
  roll?: number;
}

export interface GeocodingResult {
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  bounds?: { north: number; south: number; east: number; west: number };
  country?: string;
  city?: string;
  type: 'country' | 'city' | 'region' | 'poi' | 'address';
  confidence: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}
