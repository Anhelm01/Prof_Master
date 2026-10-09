import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import PLACES, { CATEGORIES, ROUTE_PRESETS } from '../data/mockPlaces.js';
import { fetchPlaces } from '../services/mockApi.js';
import {
  calculateRouteStats,
  generateTimelineSchedule,
  DEFAULT_MAX_DURATION_MINUTES,
  DEFAULT_MAX_BUDGET
} from '../utils/calculations.js';

const RouteContext = createContext(null);

const STORAGE_KEY_ROUTE = 'waypoint_route_ids';
const STORAGE_KEY_NOTES = 'waypoint_route_notes';
const STORAGE_KEY_SETTINGS = 'waypoint_settings';

export function RouteProvider({ children }) {
  const [places, setPlaces] = useState(PLACES);
  const [categories] = useState(CATEGORIES);
  const [presets] = useState(ROUTE_PRESETS);
  const [activeScreen, setActiveScreen] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [routePlaceIds, setRoutePlaceIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROUTE) || localStorage.getItem('waypoint_route');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const ids = parsed
            .map((item) => (typeof item === 'string' ? item : item?.id))
            .filter(Boolean);
          return ids;
        }
      }
      return ['place-01', 'place-02', 'place-03'];
    } catch {
      return ['place-01', 'place-02', 'place-03'];
    }
  });

  const [routeNotes, setRouteNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTES);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved
        ? JSON.parse(saved)
        : { maxDurationMinutes: DEFAULT_MAX_DURATION_MINUTES, maxBudget: DEFAULT_MAX_BUDGET };
    } catch {
      return { maxDurationMinutes: DEFAULT_MAX_DURATION_MINUTES, maxBudget: DEFAULT_MAX_BUDGET };
    }
  });

  useEffect(() => {
    fetchPlaces().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setPlaces(data);
      }
    }).catch(() => {

    });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROUTE, JSON.stringify(routePlaceIds));
      localStorage.setItem('waypoint_route', JSON.stringify(routePlaceIds));
    } catch (e) {
      console.error('Failed to save route to localStorage', e);
    }
  }, [routePlaceIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(routeNotes));
    } catch (e) {
      console.error('Failed to save notes to localStorage', e);
    }
  }, [routeNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }, [settings]);

  const isInRoute = useCallback((placeId) => {
    return routePlaceIds.includes(placeId);
  }, [routePlaceIds]);

  const addToRoute = useCallback((placeId) => {
    setRoutePlaceIds((prev) => {
      if (prev.includes(placeId)) return prev;
      return [...prev, placeId];
    });
  }, []);

  const removeFromRoute = useCallback((placeId) => {
    setRoutePlaceIds((prev) => prev.filter((id) => id !== placeId));
  }, []);

  const toggleRoute = useCallback((placeId) => {
    setRoutePlaceIds((prev) => {
      if (prev.includes(placeId)) {
        return prev.filter((id) => id !== placeId);
      }
      return [...prev, placeId];
    });
  }, []);

  const reorderRoute = useCallback((fromIndex, toIndex) => {
    setRoutePlaceIds((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
        return prev;
      }
      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      return updated;
    });
  }, []);

  const moveRouteItemUp = useCallback((index) => {
    if (index > 0) {
      reorderRoute(index, index - 1);
    }
  }, [reorderRoute]);

  const moveRouteItemDown = useCallback((index) => {
    reorderRoute(index, index + 1);
  }, [reorderRoute]);

  const updateNote = useCallback((placeId, note) => {
    setRouteNotes((prev) => ({
      ...prev,
      [placeId]: note
    }));
  }, []);

  const clearRoute = useCallback(() => {
    setRoutePlaceIds([]);
    setRouteNotes({});
  }, []);

  const applyPreset = useCallback((preset) => {
    if (preset && Array.isArray(preset.placeIds)) {
      setRoutePlaceIds([...preset.placeIds]);
    }
  }, []);

  const updateSettings = useCallback((partial) => {
    setSettings((prev) => ({
      ...prev,
      ...partial
    }));
  }, []);

  const openCatalogWithCategory = useCallback((category = 'all') => {
    setSelectedCategory(category);
    setActiveScreen('catalog');
  }, []);

  const stats = useMemo(() => {
    return calculateRouteStats(places, routePlaceIds, settings);
  }, [places, routePlaceIds, settings]);

  const timelineSchedule = useMemo(() => {
    return generateTimelineSchedule(stats.routePlaces, 9, 0);
  }, [stats.routePlaces]);

  const contextValue = {
    places,
    categories,
    presets,
    activeScreen,
    setActiveScreen,
    selectedCategory,
    setSelectedCategory,
    openCatalogWithCategory,
    routePlaceIds,
    routeNotes,
    settings,
    stats,
    timelineSchedule,
    isInRoute,
    addToRoute,
    removeFromRoute,
    toggleRoute,
    reorderRoute,
    moveRouteItemUp,
    moveRouteItemDown,
    updateNote,
    clearRoute,
    applyPreset,
    updateSettings
  };

  return (
    <RouteContext.Provider value={contextValue}>
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
}
