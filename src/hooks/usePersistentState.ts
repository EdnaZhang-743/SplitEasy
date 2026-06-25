import { useEffect, useState } from "react";

/**
 * Like useState, but persists the value to localStorage under `key` so it
 * survives page reloads and dev-server restarts. Falls back to the given
 * initial value if nothing is stored yet, or if the stored value can't be
 * parsed (e.g. corrupted, or saved by an older incompatible app version).
 *
 * @param migrate Optional function applied to whatever was loaded from
 *   storage before it's used as state. Lets older stored shapes (e.g. from
 *   a previous version of the app that didn't have a field the current
 *   types expect) be normalized into the current shape instead of silently
 *   producing `undefined` fields.
 */
export function usePersistentState<T>(key: string, initialValue: T, migrate?: (value: T) => T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      const parsed = stored !== null ? (JSON.parse(stored) as T) : initialValue;
      return migrate ? migrate(parsed) : parsed;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage can fail (quota exceeded, private browsing, etc). Losing
      // persistence silently is preferable to crashing the app.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
