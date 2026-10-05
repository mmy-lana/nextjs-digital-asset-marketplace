/**
 * Server/client safe persistence helpers.
 *
 * Every accessor is guarded with `typeof window === 'undefined'` so the module
 * can be imported from React Server Components, route handlers and client
 * components without triggering a `window is not defined` crash during the
 * server render pass.
 */

export type StorageScope = 'local' | 'session';

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

/**
 * Reads and parses a JSON value, returning `fallback` when the entry is
 * missing, unreadable, or structurally invalid.
 */
export function getStorageItem<T>(key: string, fallback: T, scope: StorageScope = 'local'): T {
  const store = resolveStore(scope);
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
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