/**
 * mockApi.js
 * Слой асинхронного сервиса для имитации REST API (готовность ко II этапу конкурса).
 */

import PLACES, { CATEGORIES, ROUTE_PRESETS } from '../data/mockPlaces.js';

export async function fetchPlaces() {
  // Имитируем сетевую задержку 100мс
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...PLACES]);
    }, 100);
  });
}

export async function fetchCategories() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...CATEGORIES]);
    }, 50);
  });
}

export async function fetchPresets() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...ROUTE_PRESETS]);
    }, 50);
  });
}

export async function saveRouteToServer(routePlaceIds, settings) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, timestamp: Date.now() });
    }, 150);
  });
}
