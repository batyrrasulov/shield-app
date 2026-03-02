import type { DiscoveredService, ResolvedHubCandidate } from '@/types';
import Zeroconf, { type Service } from 'react-native-zeroconf';

const DEFAULT_SERVICE_TYPE = 'shield';
const DEFAULT_PROTOCOL = 'tcp';
const DEFAULT_DOMAIN = 'local.';
const DEFAULT_API_BASE_PATH = '/api';

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

export const isHubDiscoverySupported = true;

const stripControlChars = (value: string) => value.replace(/[\u0000-\u001F\u007F]/g, '');

const decodeTxtByteArray = (values: number[]) => {
  const byteValues = values
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 255);

  let endIndex = byteValues.length;
  while (endIndex > 0 && byteValues[endIndex - 1] === 0) {
    endIndex -= 1;
  }

  const trimmed = byteValues.slice(0, endIndex);
  if (trimmed.length === 0) {
    return '';
  }

  try {
    const decoded = new TextDecoder('utf-8').decode(Uint8Array.from(trimmed));
    return stripControlChars(decoded).trim();
  } catch {
    const decoded = String.fromCharCode(...trimmed);
    return stripControlChars(decoded).trim();
  }
};

const normalizeTxtValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    const numericValues = value.filter((item): item is number => typeof item === 'number');

    if (numericValues.length === value.length && numericValues.every((item) => Number.isFinite(item))) {
      return decodeTxtByteArray(numericValues);
    }

    return stripControlChars(value.map((item) => String(item)).join('')).trim();
  }

  return stripControlChars(String(value)).trim();
};

const normalizeTxtRecord = (txt: Record<string, unknown> | undefined) => {
  if (!txt) {
    return {};
  }

  return Object.entries(txt).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = normalizeTxtValue(value);
    return acc;
  }, {});
};

const normalizeApiPath = (value: string | undefined) => {
  if (!value) {
    return DEFAULT_API_BASE_PATH;
  }

  const trimmed = stripControlChars(value).trim();
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
  const withoutHealthSuffix = withoutTrailingSlash.replace(/\/health$/i, '');

  if (!withoutHealthSuffix || withoutHealthSuffix === '/') {
    return DEFAULT_API_BASE_PATH;
  }

  return withoutHealthSuffix;
};

const normalizeHost = (value: string | undefined) => {
  if (!value) {
    return '';
  }

  return stripControlChars(value).trim().replace(/\.$/, '');
};

const isUsableHost = (value: string) => {
  const lowered = value.trim().toLowerCase();
  const isIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(lowered);
  const isIPv6 = lowered.includes(':') && !lowered.includes(' ');
  const isHostName = /^[a-z0-9.-]+$/i.test(lowered) && !lowered.includes('..');
  return (
    lowered.length > 0 &&
    lowered !== '0.0.0.0' &&
    lowered !== '::' &&
    lowered !== '::1' &&
    lowered !== '127.0.0.1' &&
    (isIPv4 || isIPv6 || isHostName)
  );
};

const collectAddressCandidates = (service: Service) => {
  const fromAddresses = Array.isArray(service.addresses) ? service.addresses : [];
  const candidates = [...fromAddresses, normalizeHost(service.host)];

  const unique = new Set<string>();
  for (const candidate of candidates) {
    const normalized = normalizeHost(candidate);
    if (!isUsableHost(normalized)) {
      continue;
    }
    unique.add(normalized);
  }

  return Array.from(unique);
};

const mapResolvedService = (service: Service): ResolvedHubCandidate => {
  const txt = normalizeTxtRecord(service.txt as Record<string, unknown> | undefined);
  const resolvedHost = normalizeHost(service.host) || service.name;
  const addresses = collectAddressCandidates(service);
  const fullName = service.fullName || `${service.name}._${DEFAULT_SERVICE_TYPE}._${DEFAULT_PROTOCOL}.${DEFAULT_DOMAIN}`;

  return {
    name: service.name,
    fullName,
    host: resolvedHost,
    addresses,
    port: service.port,
    txt,
    apiBasePath: normalizeApiPath(txt.path),
    resolvedAt: new Date().toISOString(),
  };
};

const toError = (error: unknown) => {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
};

export const createHubDiscoverySession = (callbacks: HubDiscoveryCallbacks): HubDiscoverySession => {
  const zeroconf = new Zeroconf();
  let scanning = false;

  zeroconf.on('start', () => callbacks.onScanStart?.());
  zeroconf.on('stop', () => callbacks.onScanStop?.());
  zeroconf.on('found', (name) => {
    callbacks.onFoundService?.({
      name,
      discoveredAt: new Date().toISOString(),
    });
  });
  zeroconf.on('resolved', (service) => {
    callbacks.onResolvedService?.(mapResolvedService(service));
  });
  zeroconf.on('error', (error) => {
    callbacks.onError?.(toError(error));
  });

  return {
    start: () => {
      if (scanning) {
        return;
      }

      scanning = true;
      zeroconf.scan(DEFAULT_SERVICE_TYPE, DEFAULT_PROTOCOL, DEFAULT_DOMAIN);
    },
    stop: () => {
      if (!scanning) {
        return;
      }

      scanning = false;
      zeroconf.stop();
      zeroconf.removeDeviceListeners();
    },
  };
};
