import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { ENDPOINTS } from '../lib/endpoints';
import { useAuth } from './AuthContext';
import { nextSpaceColor } from '../lib/spaceColors';

const SpaceContext = createContext(null);
const STORAGE_KEY = 'activeSpaceId';

export function SpaceProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [activeSpaceId, setActiveSpaceId] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [loading, setLoading] = useState(true);

  const refreshSpaces = useCallback(async () => {
    const res = await api.get(ENDPOINTS.spaces.base);
    let fetched = res.data;

    // Backfill: any space missing a color (created before the palette
    // feature existed, e.g. the auto-created "Personal" space at signup)
    // gets one assigned and persisted now, so it's consistent everywhere
    // rather than silently falling back to a hardcoded green each render.
    const missingColor = fetched.filter((s) => !s.color);
    if (missingColor.length > 0) {
      const alreadyColored = fetched.filter((s) => s.color);
      let pool = [...alreadyColored];
      for (const space of missingColor) {
        const color = nextSpaceColor(pool);
        await api.put(ENDPOINTS.spaces.byId(space.id), { color });
        pool = [...pool, { ...space, color }];
      }
      const res2 = await api.get(ENDPOINTS.spaces.base);
      fetched = res2.data;
    }

    setSpaces(fetched);

    setActiveSpaceId((current) => {
      const stillExists = fetched.some((s) => s.id === current);
      if (stillExists) return current;
      const fallback = fetched[0]?.id || null;
      if (fallback) localStorage.setItem(STORAGE_KEY, fallback);
      return fallback;
    });

    return fetched;
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setSpaces([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    refreshSpaces().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refreshSpaces]);

  const switchSpace = useCallback((spaceId) => {
    localStorage.setItem(STORAGE_KEY, spaceId);
    setActiveSpaceId(spaceId);
  }, []);

  const createSpace = useCallback(
    async (name, icon) => {
      const color = nextSpaceColor(spaces);
      const res = await api.post(ENDPOINTS.spaces.base, { name, icon, color });
      await refreshSpaces();
      switchSpace(res.data.id);
      return res.data;
    },
    [spaces, refreshSpaces, switchSpace]
  );

  const deleteSpace = useCallback(
    async (spaceId) => {
      await api.delete(ENDPOINTS.spaces.byId(spaceId));
      const updated = await refreshSpaces();
      if (activeSpaceId === spaceId) {
        const fallback = updated[0]?.id || null;
        if (fallback) switchSpace(fallback);
      }
    },
    [activeSpaceId, refreshSpaces, switchSpace]
  );

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) || null;

  const value = {
    spaces,
    activeSpace,
    activeSpaceId,
    loading,
    switchSpace,
    createSpace,
    deleteSpace,
    refreshSpaces,
  };

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>;
}

export function useSpace() {
  const ctx = useContext(SpaceContext);
  if (!ctx) throw new Error('useSpace must be used within SpaceProvider');
  return ctx;
}