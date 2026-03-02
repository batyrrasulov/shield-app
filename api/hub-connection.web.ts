import { useSyncExternalStore } from 'react';
import type { HubConnection } from './hub-connection.types';

const REMEMBERED_HUB_KEY = 'shield:lastHub';
const DEFAULT_API_BASE_PATH = '/api';

let runtimeHubConnection: HubConnection | null = null;
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

const stripControlChars = (value: string) => value.replace(/[\u0000-\u001F\u007F]/g, '');

const normalizeBaseUrl = (baseUrl: string) => {
  const trimmed = stripControlChars(baseUrl).trim().replace(/\/+$/, '');
  return trimmed;
};

const stripHealthSuffix = (value: string) => value.replace(/\/health$/i, '');

export const normalizeApiBasePath = (apiBasePath?: string) => {
  if (!apiBasePath) {
    return DEFAULT_API_BASE_PATH;
  }

  const trimmed = stripControlChars(apiBasePath).trim();
  if (!trimmed || trimmed === '/') {
    return DEFAULT_API_BASE_PATH;
  }

  let pathOnly = trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      pathOnly = new URL(trimmed).pathname;
    } catch {
      pathOnly = trimmed;
    }
  }

  pathOnly = pathOnly.split('?')[0]?.split('#')[0] ?? '';
  pathOnly = pathOnly.replace(/\s+/g, '');

  const withLeadingSlash = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  const collapsedSlashes = withLeadingSlash.replace(/\/{2,}/g, '/');
  const withoutTrailingSlash = collapsedSlashes.replace(/\/+$/, '');
  const withoutHealthSuffix = stripHealthSuffix(withoutTrailingSlash);

  if (!withoutHealthSuffix || withoutHealthSuffix === '/') {
    return DEFAULT_API_BASE_PATH;
  }

  return withoutHealthSuffix;
};

const normalizeConnection = (connection: HubConnection): HubConnection => ({
  ...connection,
  baseUrl: normalizeBaseUrl(connection.baseUrl),
  apiBasePath: normalizeApiBasePath(connection.apiBasePath),
});

const parseStoredConnection = (value: string | null): HubConnection | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as HubConnection;
    if (!parsed?.baseUrl || !parsed?.apiBasePath) {
      return null;
    }

    return normalizeConnection(parsed);
  } catch {
    return null;
  }
};

const getStorage = () => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return null;
  }
  return window.localStorage;
};

export const setHubConnection = (connection: HubConnection) => {
  runtimeHubConnection = normalizeConnection(connection);
  notify();
  return runtimeHubConnection;
};

export const getHubConnection = () => runtimeHubConnection;

export const clearHubConnection = () => {
  runtimeHubConnection = null;
  notify();
};

export const subscribeHubConnection = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useHubConnection = () => useSyncExternalStore(
  subscribeHubConnection,
  getHubConnection,
  getHubConnection,
);

export const saveRememberedHubConnection = async (connection: HubConnection) => {
  const normalized = normalizeConnection(connection);
  const storage = getStorage();
  storage?.setItem(REMEMBERED_HUB_KEY, JSON.stringify(normalized));
};

export const clearRememberedHubConnection = async () => {
  const storage = getStorage();
  storage?.removeItem(REMEMBERED_HUB_KEY);
};

export const loadRememberedHubConnection = async () => {
  const storage = getStorage();
  const stored = storage?.getItem(REMEMBERED_HUB_KEY) ?? null;
  return parseStoredConnection(stored);
};
