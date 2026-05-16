# GlobleSearch

An interactive 3D globe npm library that smoothly transitions to a 2D flat map. Search any location on Earth and watch the globe rotate, spiral-descend, and morph into a detailed map view.

## Features

- **3D Globe** powered by CesiumJS with auto-rotation
- **Spiral flight** — the globe keeps rotating as the camera descends to your destination
- **Globe → 2D Map morph** — seamless scene-mode transition
- **Free geocoding** via Nominatim (OpenStreetMap), no API key required
- **Framework-agnostic core** (`@globlesearch/core`)
- TypeScript-first with full type exports

## Quick Start

```bash
npm install @globlesearch/core cesium
```

```typescript
import { GlobeMap } from '@globlesearch/core';

const globe = new GlobeMap(document.getElementById('globe'), {
  rotation: { enabled: true, speed: 0.6 },
  flight: { mode: 'spiral', duration: 4000 },
});

// Search & fly
const results = await globe.search('Tokyo, Japan');
if (results[0]) globe.flyTo(results[0]);

// Morph to 2D map after arrival
globe.on('flightComplete', () => globe.morphToMap());
```

## Run the demo

```bash
npm install
npm run dev
```

Opens the vanilla demo at `http://localhost:5173`.

## Packages

| Package | Description |
|---------|-------------|
| `@globlesearch/core` | Framework-agnostic core engine |

## Configuration

See the full config reference in the [design document](./GlobeMap-Library-Design.md).

## License

MIT
