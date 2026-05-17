import { GlobeMap, GeocodingResult } from '@globlesearch/core';

// Disable Cesium Ion so it doesn't attempt token-validation fetches
// (which return HTML and trigger a JSON parse error in the console)
declare const Cesium: typeof import('cesium');
Cesium.Ion.defaultAccessToken = '';

// ── Init globe ──────────────────────────────────────────────────────────────
const container = document.getElementById('globe-container') as HTMLElement;

const globe = new GlobeMap(container, {
  rotation: {
    enabled: true,
    speed: 0.6,
    direction: 'east',
    pauseOnHover: true,
    pauseOnSearch: true,
  },
  flight: {
    mode: 'spiral',
    duration: 4000,
    easing: 'globeFlight',
    spiralTightness: 2.5,
    minimumAltitude: 8000,
  },
  morph: {
    autoMorphOnArrival: false,
    morphDuration: 2000,
    mapProvider: 'cesium2d',
  },
  geocoding: {
    provider: 'nominatim',
    cacheResults: true,
  },
});

// ── UI elements ──────────────────────────────────────────────────────────────
const searchForm = document.getElementById('search-form') as HTMLFormElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const searchBtn = document.getElementById('search-btn') as HTMLButtonElement;
const suggestionsEl = document.getElementById('suggestions') as HTMLDivElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const morphBtn = document.getElementById('morph-btn') as HTMLButtonElement;

let statusTimeout: ReturnType<typeof setTimeout> | null = null;
let isMapMode = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function showStatus(msg: string, duration = 3000) {
  statusEl.textContent = msg;
  statusEl.classList.add('visible');
  if (statusTimeout) clearTimeout(statusTimeout);
  if (duration > 0) {
    statusTimeout = setTimeout(() => statusEl.classList.remove('visible'), duration);
  }
}

function hideSuggestions() {
  suggestionsEl.style.display = 'none';
  suggestionsEl.innerHTML = '';
}

function renderSuggestions(results: GeocodingResult[]) {
  if (results.length === 0) {
    hideSuggestions();
    return;
  }
  suggestionsEl.innerHTML = results
    .slice(0, 5)
    .map(
      (r, i) =>
        `<div class="suggestion-item" data-idx="${i}">
          <div>${r.name}</div>
          <div class="addr">${r.formattedAddress}</div>
        </div>`
    )
    .join('');
  suggestionsEl.style.display = 'block';

  suggestionsEl.querySelectorAll('.suggestion-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt((el as HTMLElement).dataset.idx ?? '0', 10);
      const result = results[idx];
      hideSuggestions();
      searchInput.value = result.name;
      flyToResult(result);
    });
  });
}

async function flyToResult(result: GeocodingResult) {
  showStatus(`Flying to ${result.name}…`, 0);
  searchBtn.disabled = true;
  await globe.flyTo({ lat: result.lat, lng: result.lng });
  searchBtn.disabled = false;
}

// ── Search form submit ───────────────────────────────────────────────────────
searchForm.addEventListener('submit', async e => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  hideSuggestions();
  showStatus('Searching…', 0);
  searchBtn.disabled = true;

  const results = await globe.search(query);
  searchBtn.disabled = false;

  if (results.length === 0) {
    showStatus('No results found.', 3000);
    return;
  }

  hideSuggestions();
  await flyToResult(results[0]);
});

// ── Live autocomplete (debounced) ────────────────────────────────────────────
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  if (debounceTimer) clearTimeout(debounceTimer);

  if (query.length < 3) {
    hideSuggestions();
    return;
  }

  debounceTimer = setTimeout(async () => {
    const results = await globe.search(query);
    renderSuggestions(results);
  }, 400);
});

document.addEventListener('click', e => {
  if (!suggestionsEl.contains(e.target as Node) && e.target !== searchInput) {
    hideSuggestions();
  }
});

// ── Morph toggle ─────────────────────────────────────────────────────────────
morphBtn.addEventListener('click', async () => {
  morphBtn.disabled = true;
  if (!isMapMode) {
    showStatus('Morphing to 2D map…', 0);
    await globe.morphToMap();
    morphBtn.textContent = 'Back to Globe';
    isMapMode = true;
  } else {
    showStatus('Returning to 3D globe…', 0);
    await globe.morphToGlobe();
    morphBtn.textContent = 'Switch to 2D Map';
    isMapMode = false;
  }
  morphBtn.disabled = false;
});

// ── Globe events ─────────────────────────────────────────────────────────────
globe.on('flightStart', () => {
  showStatus('Flying…', 0);
});

globe.on('flightComplete', e => {
  const dest = e.destination as { lat: number; lng: number };
  showStatus(`Arrived at ${searchInput.value || `${dest.lat.toFixed(2)}°, ${dest.lng.toFixed(2)}°`}`, 4000);
  morphBtn.style.display = 'block';
});

globe.on('morphComplete', () => {
  showStatus('2D map view', 3000);
});

globe.on('modeChange', e => {
  if (e.mode === 'globe') showStatus('3D globe view', 3000);
});

globe.on('searchError', e => {
  showStatus(`Search error: ${e.error.message}`, 4000);
  searchBtn.disabled = false;
});
