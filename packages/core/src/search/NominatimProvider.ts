import type { GeocodingResult } from '../types/geo';
import { LRUCache } from './Cache';

export class NominatimProvider {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';
  private lastRequestTime = 0;
  private cache: LRUCache<GeocodingResult[]>;
  private readonly rateLimitMs: number;

  constructor(rateLimitMs = 1100, ttl = 86_400_000) {
    this.rateLimitMs = rateLimitMs;
    this.cache = new LRUCache<GeocodingResult[]>(200, ttl);
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.rateLimitMs) {
      await new Promise(r => setTimeout(r, this.rateLimitMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  async search(query: string): Promise<GeocodingResult[]> {
    const cacheKey = query.toLowerCase().trim();
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    await this.enforceRateLimit();

    const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'GlobleSearch/0.1 (https://github.com/PavanBrahmaji0/GlobleSearch)' },
    });

    if (!resp.ok) throw new Error(`Nominatim error: ${resp.status}`);

    const raw = await resp.json() as NominatimRaw[];
    const results = raw.map(this.parseResult);
    this.cache.set(cacheKey, results);
    return results;
  }

  private parseResult(r: NominatimRaw): GeocodingResult {
    const type = resolveType(r.type, r.class);
    return {
      name: r.display_name.split(',')[0].trim(),
      formattedAddress: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      country: r.address?.country,
      city: r.address?.city ?? r.address?.town ?? r.address?.village,
      type,
      confidence: parseFloat(r.importance ?? '0.5'),
      bounds: r.boundingbox
        ? {
            south: parseFloat(r.boundingbox[0]),
            north: parseFloat(r.boundingbox[1]),
            west: parseFloat(r.boundingbox[2]),
            east: parseFloat(r.boundingbox[3]),
          }
        : undefined,
    };
  }
}

function resolveType(type: string, cls: string): GeocodingResult['type'] {
  if (cls === 'boundary' || type === 'administrative') return 'region';
  if (type === 'city' || type === 'town' || type === 'village') return 'city';
  if (cls === 'place' && (type === 'country')) return 'country';
  if (cls === 'amenity' || cls === 'tourism' || cls === 'historic') return 'poi';
  if (cls === 'highway' || type === 'house' || type === 'road') return 'address';
  return 'city';
}

interface NominatimRaw {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
  importance?: string;
  boundingbox?: [string, string, string, string];
  address?: {
    country?: string;
    city?: string;
    town?: string;
    village?: string;
  };
}
