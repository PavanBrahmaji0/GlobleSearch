import type { GeocodingResult } from '../types/geo';
import type { GlobeMapConfig } from '../types/config';
import { NominatimProvider } from './NominatimProvider';

export interface GeocoderProvider {
  search(query: string): Promise<GeocodingResult[]>;
}

export class Geocoder {
  private provider: GeocoderProvider;

  constructor(config: GlobeMapConfig) {
    if (config.geocoding.provider === 'nominatim') {
      this.provider = new NominatimProvider(config.geocoding.rateLimitMs, config.geocoding.cacheTTL);
    } else {
      throw new Error('Custom geocoding provider must be supplied via config.geocoding.customProvider');
    }
  }

  async search(query: string): Promise<GeocodingResult[]> {
    if (!query.trim()) return [];
    return this.provider.search(query.trim());
  }
}
