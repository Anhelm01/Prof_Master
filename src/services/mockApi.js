import PLACES, { CATEGORIES, ROUTE_PRESETS } from '../data/mockPlaces.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthToken() {
  try {
    return localStorage.getItem('waypoint_token');
  } catch {
    return null;
  }
}

export async function fetchPlaces(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.sort) query.set('sort', params.sort);

    const url = `${API_BASE_URL}/places${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(1500)
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data?.places)) {
        return data.data.places;
      }
    }
  } catch {

  }
  return [...PLACES];
}

export async function fetchCategories() {
  return Promise.resolve([...CATEGORIES]);
}

export async function fetchPresets() {
  return Promise.resolve([...ROUTE_PRESETS]);
}

export async function calculateRouteOnServer(placeIds, settings = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}/routes/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place_ids: placeIds,
        max_duration_minutes: settings.maxDurationMinutes,
        max_budget: settings.maxBudget
      }),
      signal: AbortSignal.timeout(2000)
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.calculations) {
        return json.data.calculations;
      }
    }
  } catch {

  }
  return null;
}

export async function saveRouteToServer(routePlaceIds, settings = {}, title = 'Мой маршрут') {
  const token = getAuthToken();
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/routes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        place_ids: routePlaceIds,
        max_duration_minutes: settings.maxDurationMinutes,
        max_budget: settings.maxBudget
      }),
      signal: AbortSignal.timeout(2500)
    });

    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch {

  }
  return { success: true, localOnly: true, timestamp: Date.now() };
}

export async function loginUser(login, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password })
  });
  return res.json();
}

export async function registerUser(username, email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return res.json();
}
