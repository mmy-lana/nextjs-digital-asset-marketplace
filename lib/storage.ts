/**
 * Server/client safe persistence helpers.
 *
 * Every accessor is guarded with `typeof window === 'undefined'` so the module
 * can be imported from React Server Components, route handlers and client
 * components without triggering a `window is not defined` crash during the
 * server render pass.
 *
 * SEC-03: stored values are untrusted input. A corrupted, hand-edited or
 * schema-drifted `localStorage` entry must never propagate into application
 * state, so every read passes a runtime validator and falls back to the caller
 * supplied default when the payload does not match the expected shape.
 */

export type StorageScope = 'local' | 'session';

/** A predicate that returns true only for payloads matching the expected shape. */
export type StorageValidator<T> = (value: unknown) => value is T;

/** True only inside a browser document with an available storage backend. */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

function resolveStore(scope: StorageScope): Storage | null {
  if (!isBrowser()) return null;
  try {
    const store = scope === 'session' ? window.sessionStorage : window.localStorage;
    // Touch the store so Safari private mode throws here rather than silently.
    const probe = '__ns_probe__';
    store.setItem(probe, probe);
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

export function isStorageAvailable(scope: StorageScope = 'local'): boolean {
  return resolveStore(scope) !== null;
}

// ---------------------------------------------------------------------------
// Runtime validators
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string');

export const isObjectArray = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.every(isRecord);

/**
 * Builds a validator for an array of objects that requires the given keys to be
 * present with the expected primitive types. This is the boundary check that
 * stops a partially-written cart or transaction list from reaching a component
 * that assumes the full contract.
 */
export function arrayOfObjects<T>(
  requiredKeys: Array<[key: string, type: 'string' | 'number' | 'boolean']>
): StorageValidator<T[]> {
  return (value: unknown): value is T[] => {
    if (!Array.isArray(value)) return false;
    return value.every((entry) => {
      if (!isRecord(entry)) return false;
      return requiredKeys.every(([key, type]) => {
        const field = entry[key];
        if (type === 'number') return typeof field === 'number' && Number.isFinite(field);
        return typeof field === type;
      });
    });
  };
}

/** Builds a validator for a flat object with typed required keys. */
export function objectWithKeys<T>(
  requiredKeys: Array<[key: string, type: 'string' | 'number' | 'boolean']>
): StorageValidator<T> {
  return (value: unknown): value is T => {
    if (!isRecord(value)) return false;
    return requiredKeys.every(([key, type]) => {
      const field = value[key];
      if (type === 'number') return typeof field === 'number' && Number.isFinite(field);
      return typeof field === type;
    });
  };
}

// ---------------------------------------------------------------------------
// Accessors
// ---------------------------------------------------------------------------

/**
 * Reads and parses a JSON value.
 *
 * Returns `fallback` when the entry is missing, unreadable, not valid JSON, or
 * rejected by the optional runtime validator.
 */
export function getStorageItem<T>(
  key: string,
  fallback: T,
  scope: StorageScope = 'local',
  validate?: StorageValidator<T>
): T {
  const store = resolveStore(scope);
  if (!store) return fallback;

  let raw: string | null;
  try {
    raw = store.getItem(key);
  } catch {
    return fallback;
  }
  if (raw === null) return fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Corrupted or truncated payload: drop it so it cannot fail again.
    try {
      store.removeItem(key);
    } catch {
      /* Removal is best-effort. */
    }
    return fallback;
  }

  if (parsed === null || parsed === undefined) return fallback;

  if (validate && !validate(parsed)) {
    // Schema drift: quarantine the bad value instead of feeding it to the app.
    try {
      store.removeItem(key);
    } catch {
      /* Removal is best-effort. */
    }
    return fallback;
  }

  return parsed as T;
}

export function setStorageItem<T>(key: string, value: T, scope: StorageScope = 'local'): boolean {
  const store = resolveStore(scope);
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function hasStorageItem(key: string, scope: StorageScope = 'local'): boolean {
  const store = resolveStore(scope);
  if (!store) return false;
  try {
    return store.getItem(key) !== null;
  } catch {
    return false;
  }
}

export function removeStorageItem(key: string, scope: StorageScope = 'local'): void {
  const store = resolveStore(scope);
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    /* Storage backend disabled — removal is a no-op. */
  }
}

/** Removes every key carrying the given prefix (used by "reset simulation"). */
export function removeStorageByPrefix(prefix: string, scope: StorageScope = 'local'): void {
  const store = resolveStore(scope);
  if (!store) return;
  try {
    const doomed: string[] = [];
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);
      if (key && key.startsWith(prefix)) doomed.push(key);
    }
    doomed.forEach((key) => store.removeItem(key));
  } catch {
    /* Storage backend disabled — nothing to clear. */
  }
}

/**
 * `Set` values collapse to `{}` when serialised with `JSON.stringify`, so they
 * must always cross the storage boundary as `string[]`.
 */
export function serializeIdSet(ids: ReadonlySet<string>): string[] {
  return Array.from(ids);
}

export function deserializeIdSet(raw: unknown): Set<string> {
  if (!Array.isArray(raw)) return new Set<string>();
  return new Set(raw.filter((entry): entry is string => typeof entry === 'string'));
}