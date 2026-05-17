# @globlesearch/core

An interactive 3D globe npm library — auto-rotating Earth that spirals down to any searched location and morphs into a 2D flat map.

[![npm](https://img.shields.io/npm/v/@globlesearch/core)](https://www.npmjs.com/package/@globlesearch/core)
[![license](https://img.shields.io/npm/l/@globlesearch/core)](https://github.com/PavanBrahmaji0/GlobleSearch/blob/main/LICENSE)

## Features

- 3D globe with auto-rotation powered by [CesiumJS](https://cesium.com)
- **Spiral flight** — globe keeps rotating as the camera descends to your destination
- **Globe → 2D map morph** — seamless CesiumJS SceneMode transition
- Free geocoding via [Nominatim](https://nominatim.org) (OpenStreetMap), no API key needed
- Full TypeScript types
- Framework-agnostic — works with React, Angular, or plain JS

## Installation

```bash
npm install @globlesearch/core cesium
```

> CesiumJS must be loaded separately. For the quickest setup, add it via CDN in your HTML:
>
> ```html
> <link href="https://cesium.com/downloads/cesiumjs/releases/1.141/Build/Cesium/Widgets/widgets.css" rel="stylesheet" />
> <script src="https://cesium.com/downloads/cesiumjs/releases/1.141/Build/Cesium/Cesium.js"></script>
> ```

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <link href="https://cesium.com/downloads/cesiumjs/releases/1.141/Build/Cesium/Widgets/widgets.css" rel="stylesheet" />
  <script src="https://cesium.com/downloads/cesiumjs/releases/1.141/Build/Cesium/Cesium.js"></script>
</head>
<body>
  <div id="globe" style="width:100vw;height:100vh"></div>
  <script type="module">
    import { GlobeMap } from '@globlesearch/core';

    Cesium.Ion.defaultAccessToken = '';

    const globe = new GlobeMap(document.getElementById('globe'), {
      rotation: { enabled: true, speed: 4.0 },
      flight: { mode: 'spiral', duration: 4000 },
    });

    // Search and fly
    const results = await globe.search('Tokyo, Japan');
    if (results[0]) await globe.flyTo(results[0]);

    // Morph to 2D map after arriving
    globe.on('flightComplete', () => globe.morphToMap());
  </script>
</body>
</html>
```

## API

### `new GlobeMap(container, config?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `container` | `HTMLElement` | DOM element that will hold the globe |
| `config` | `DeepPartial<GlobeMapConfig>` | Optional configuration (see below) |

### Methods

| Method | Description |
|--------|-------------|
| `flyTo(location, options?)` | Fly to a string query, `{lat,lng}`, or `GeocodingResult` |
| `search(query)` | Geocode a query, returns `GeocodingResult[]` |
| `morphToMap(options?)` | Transition globe → 2D flat map |
| `morphToGlobe(options?)` | Transition 2D map → globe (restarts rotation) |
| `getCamera()` | Returns current `CameraPosition` |
| `on(event, handler)` | Subscribe to events |
| `off(event, handler)` | Unsubscribe |
| `destroy()` | Clean up and remove the globe |

### Events

`flightStart` · `flightProgress` · `flightComplete` · `flightCancelled` · `morphStart` · `morphProgress` · `morphComplete` · `searchStart` · `searchResults` · `searchError` · `rotationStart` · `rotationPause` · `altitudeChange` · `modeChange`

### Config reference

```ts
{
  rotation: {
    enabled: true,
    speed: 4.0,          // degrees/second
    direction: 'east',   // 'east' | 'west'
    pauseOnHover: true,
    pauseOnSearch: true,
  },
  flight: {
    mode: 'spiral',       // 'spiral' | 'direct'
    duration: 4000,       // ms
    easing: 'globeFlight',
    spiralTightness: 2.5,
    minimumAltitude: 8000, // meters above destination
  },
  morph: {
    autoMorphOnArrival: false,
    morphDuration: 2000,
    mapProvider: 'cesium2d',
  },
  geocoding: {
    provider: 'nominatim',
    cacheResults: true,
    rateLimitMs: 1100,
  },
}
```

## License

MIT © [PavanBrahmaji0](https://github.com/PavanBrahmaji0)
