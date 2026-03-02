import type { DiscoveredService, ResolvedHubCandidate } from '@/types';

export type HubDiscoveryCallbacks = {
  onFoundService?: (service: DiscoveredService) => void;
  onResolvedService?: (candidate: ResolvedHubCandidate) => void;
  onScanStart?: () => void;
  onScanStop?: () => void;
  onError?: (error: Error) => void;
};

export type HubDiscoverySession = {
  start: () => void;
  stop: () => void;
};

export const isHubDiscoverySupported = false;

export const createHubDiscoverySession = (callbacks: HubDiscoveryCallbacks): HubDiscoverySession => ({
  start: () => {
    callbacks.onScanStart?.();
    callbacks.onError?.(
      new Error(
        'Local network discovery is not supported in this runtime. Use a native development or production build.',
      ),
    );
    callbacks.onScanStop?.();
  },
  stop: () => {
    callbacks.onScanStop?.();
  },
});
