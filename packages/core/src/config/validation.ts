import type { GlobeMapConfig, DeepPartial } from '../types/config';
import { DEFAULT_CONFIG } from './defaults';

function deepMerge<T extends object>(defaults: T, overrides: DeepPartial<T>): T {
  const result = { ...defaults } as T;
  for (const key in overrides) {
    const val = overrides[key as keyof typeof overrides];
    if (val !== undefined && val !== null) {
      if (typeof val === 'object' && !Array.isArray(val) && typeof defaults[key as keyof T] === 'object') {
        (result as Record<string, unknown>)[key] = deepMerge(
          defaults[key as keyof T] as object,
          val as DeepPartial<object>
        );
      } else {
        (result as Record<string, unknown>)[key] = val;
      }
    }
  }
  return result;
}

export function buildConfig(partial?: DeepPartial<GlobeMapConfig>): GlobeMapConfig {
  if (!partial) return { ...DEFAULT_CONFIG };
  return deepMerge(DEFAULT_CONFIG, partial);
}
