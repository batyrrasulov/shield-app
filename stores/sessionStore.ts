import { useSyncExternalStore } from 'react';

let isAuthenticated = false;
const listeners = new Set<() => void>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const getIsAuthenticated = () => isAuthenticated;

export const setIsAuthenticated = (value: boolean) => {
  if (isAuthenticated === value) {
    return;
  }

  isAuthenticated = value;
  notify();
};

export const clearAuthSession = () => {
  setIsAuthenticated(false);
};

export const subscribeAuthState = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useIsAuthenticated = () => useSyncExternalStore(
  subscribeAuthState,
  getIsAuthenticated,
  getIsAuthenticated,
);
