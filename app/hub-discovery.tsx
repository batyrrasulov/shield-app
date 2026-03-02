import {
  clearRememberedHubConnection,
  loadRememberedHubConnection,
  normalizeApiBasePath,
  saveRememberedHubConnection,
  setHubConnection,
  type HubConnection,
} from '@/api/hub-connection';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import {
  createHubDiscoverySession,
  isHubDiscoverySupported,
  type HubDiscoverySession,
} from '@/services/hub-discovery';
import type { DiscoveredService, ResolvedHubCandidate, VerifiedHub } from '@/types';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HEALTH_TIMEOUT_MS = 6000;
const DEFAULT_GUESSED_HUB_PORT = 8000;
const DEFAULT_GUESSED_API_BASE_PATH = '/api';

type HealthCheckResult = {
  healthy: boolean;
  url: string;
  apiBasePath: string;
  reason?: string;
};

const isIPv4Address = (value: string) => /^\d{1,3}(\.\d{1,3}){3}$/.test(value);

const normalizeHostCandidate = (value: string | undefined | null) => {
  if (!value) {
    return '';
  }

  return value.trim().replace(/\.$/, '');
};

const isUsableHost = (value: string) => {
  const normalized = normalizeHostCandidate(value).toLowerCase();
  const isIPv4 = isIPv4Address(normalized);
  const isIPv6 = normalized.includes(':') && !normalized.includes(' ');
  const isHostName = /^[a-z0-9.-]+$/i.test(normalized) && !normalized.includes('..');

  return (
    normalized.length > 0 &&
    normalized !== '0.0.0.0' &&
    normalized !== '::' &&
    normalized !== '::1' &&
    normalized !== '127.0.0.1' &&
    (isIPv4 || isIPv6 || isHostName)
  );
};

const normalizeHostForUrl = (host: string) => {
  const sanitized = host.includes('%') ? host.replace('%', '%25') : host;
  if (sanitized.includes(':') && !sanitized.startsWith('[')) {
    return `[${sanitized}]`;
  }
  return sanitized;
};

const sortAddresses = (addresses: string[]) => {
  const unique = Array.from(
    new Set(
      addresses
        .map((address) => normalizeHostCandidate(address))
        .filter((address) => isUsableHost(address)),
    ),
  );

  return unique.sort((a, b) => {
    const aScore = isIPv4Address(a) ? 0 : 1;
    const bScore = isIPv4Address(b) ? 0 : 1;
    return aScore - bScore;
  });
};

const candidateKey = (candidate: ResolvedHubCandidate) =>
  `${candidate.fullName}|${candidate.port}|${candidate.apiBasePath}`;

const verifiedCandidateKey = (hub: VerifiedHub) => `${hub.fullName}|${hub.port}|${hub.apiBasePath}`;

const normalizeBaseUrl = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, '');

const toHealthUrl = (baseUrl: string, apiBasePath: string) => {
  return `${baseUrl}${normalizeApiBasePath(apiBasePath)}/health`;
};

const buildApiBasePathCandidates = (apiBasePath: string) => {
  const primary = normalizeApiBasePath(apiBasePath);
  const rawTrimmed = apiBasePath.trim();
  const rawWithSlash = rawTrimmed.startsWith('/') ? rawTrimmed : `/${rawTrimmed}`;
  const strippedHealth = normalizeApiBasePath(rawWithSlash.replace(/\/health$/i, ''));

  return Array.from(new Set([primary, strippedHealth, DEFAULT_GUESSED_API_BASE_PATH]));
};

const fetchWithTimeoutWithoutAbort = (url: string) =>
  new Promise<Response>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Request timed out after ${HEALTH_TIMEOUT_MS}ms`));
    }, HEALTH_TIMEOUT_MS);

    fetch(url)
      .then((response) => {
        clearTimeout(timeout);
        resolve(response);
      })
      .catch((error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      });
  });

const fetchHealthResponse = async (url: string) => {
  if (typeof AbortController === 'undefined') {
    return fetchWithTimeoutWithoutAbort(url);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    return await fetch(url, { signal: controller.signal });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('network request failed')) {
      if (__DEV__) {
        console.log('[hub-discovery] retrying health check without AbortController', url);
      }
      return fetchWithTimeoutWithoutAbort(url);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const verifyHubHealth = async (baseUrl: string, apiBasePath: string): Promise<HealthCheckResult> => {
  const apiBasePathCandidates = buildApiBasePathCandidates(apiBasePath);
  const failures: string[] = [];

  for (const candidatePath of apiBasePathCandidates) {
    const url = toHealthUrl(baseUrl, candidatePath);

    try {
      const response = await fetchHealthResponse(url);
      if (!response.ok) {
        failures.push(`${url} -> HTTP ${response.status}`);
        continue;
      }

      try {
        const payload = (await response.json()) as { status?: string };
        if (payload?.status === 'ok') {
          return {
            healthy: true,
            url,
            apiBasePath: candidatePath,
          };
        }

        failures.push(`${url} -> unexpected status "${payload?.status ?? 'missing'}"`);
      } catch {
        failures.push(`${url} -> response was not valid JSON`);
      }
    } catch (error) {
      failures.push(`${url} -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    healthy: false,
    url: toHealthUrl(baseUrl, apiBasePathCandidates[0] ?? DEFAULT_GUESSED_API_BASE_PATH),
    apiBasePath: apiBasePathCandidates[0] ?? DEFAULT_GUESSED_API_BASE_PATH,
    reason: failures[failures.length - 1] ?? 'Health verification failed.',
  };
};

const getCandidatePorts = (candidate: ResolvedHubCandidate) =>
  Array.from(
    new Set([candidate.port, DEFAULT_GUESSED_HUB_PORT].filter((port) => Number.isFinite(port) && port > 0)),
  );

const buildVerifiedHub = (
  candidate: ResolvedHubCandidate,
  targetHost: string,
  portOverride?: number,
  apiBasePathOverride?: string,
): VerifiedHub => {
  const port = portOverride ?? candidate.port;
  const host = normalizeHostForUrl(targetHost);
  const baseUrl = `http://${host}:${port}`;
  const apiBasePath = normalizeApiBasePath(apiBasePathOverride ?? candidate.apiBasePath);
  const id = `${candidate.fullName}|${targetHost}|${port}|${apiBasePath}`;

  return {
    id,
    name: candidate.name,
    fullName: candidate.fullName,
    host: candidate.host,
    ip: targetHost,
    port,
    baseUrl,
    apiBasePath,
    txt: candidate.txt,
    verifiedAt: new Date().toISOString(),
  };
};

const buildConnection = (
  hub: VerifiedHub,
  verificationStatus: 'verified' | 'bypassed' = 'verified',
): HubConnection => ({
  baseUrl: hub.baseUrl,
  apiBasePath: hub.apiBasePath,
  metadata: {
    serviceName: hub.name,
    fullName: hub.fullName,
    host: hub.host,
    ip: hub.ip,
    port: hub.port,
    txt: hub.txt,
    verifiedAt: hub.verifiedAt,
    verificationStatus,
  },
});

const verifyRememberedConnection = async (connection: HubConnection) => {
  const result = await verifyHubHealth(connection.baseUrl, connection.apiBasePath);
  if (!result.healthy) {
    return null;
  }

  return {
    ...connection,
    apiBasePath: result.apiBasePath,
  };
};

const getCandidateTargets = (candidate: ResolvedHubCandidate) => {
  const addresses = sortAddresses(candidate.addresses);
  const host = normalizeHostCandidate(candidate.host);
  const targets = [...addresses];

  if (isUsableHost(host)) {
    targets.push(host);
  }

  return Array.from(new Set(targets));
};

const mergeCandidate = (previous: ResolvedHubCandidate, next: ResolvedHubCandidate): ResolvedHubCandidate => ({
  ...next,
  addresses: sortAddresses([...previous.addresses, ...next.addresses]),
  txt: {
    ...previous.txt,
    ...next.txt,
  },
});

const parseHostHint = (serviceName: string) => {
  const match = serviceName.match(/\(([^)]+)\)\s*$/);
  const candidate = normalizeHostCandidate(match?.[1]);

  if (!isUsableHost(candidate)) {
    return null;
  }

  return candidate.includes('.') ? candidate : `${candidate}.local`;
};

const buildGuessedConnection = (service: DiscoveredService): HubConnection | null => {
  const host = parseHostHint(service.name);
  if (!host) {
    return null;
  }

  const normalizedBaseUrl = normalizeBaseUrl(`http://${normalizeHostForUrl(host)}:${DEFAULT_GUESSED_HUB_PORT}`);
  return {
    baseUrl: normalizedBaseUrl,
    apiBasePath: DEFAULT_GUESSED_API_BASE_PATH,
    metadata: {
      serviceName: service.name,
      host,
      port: DEFAULT_GUESSED_HUB_PORT,
      verificationStatus: 'bypassed',
    },
  };
};

export default function HubDiscoveryScreen() {
  const [foundServices, setFoundServices] = useState<DiscoveredService[]>([]);
  const [resolvedCandidates, setResolvedCandidates] = useState<ResolvedHubCandidate[]>([]);
  const [verifiedHubs, setVerifiedHubs] = useState<VerifiedHub[]>([]);
  const [verificationErrors, setVerificationErrors] = useState<Record<string, string>>({});
  const [statusText, setStatusText] = useState('Initializing hub discovery...');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [connectingHubId, setConnectingHubId] = useState<string | null>(null);

  const discoverySessionRef = useRef<HubDiscoverySession | null>(null);
  const verifiedKeysRef = useRef(new Set<string>());
  const inFlightCandidatesRef = useRef(new Set<string>());
  const unmountedRef = useRef(false);

  const resolvedServiceNames = useMemo(
    () => new Set(resolvedCandidates.map((candidate) => candidate.name)),
    [resolvedCandidates],
  );
  const verifiedCandidateKeys = useMemo(
    () => new Set(verifiedHubs.map((hub) => verifiedCandidateKey(hub))),
    [verifiedHubs],
  );
  const unverifiedCandidates = useMemo(
    () => resolvedCandidates.filter((candidate) => !verifiedCandidateKeys.has(candidateKey(candidate))),
    [resolvedCandidates, verifiedCandidateKeys],
  );

  const stopDiscovery = useCallback(() => {
    discoverySessionRef.current?.stop();
    discoverySessionRef.current = null;
    setIsScanning(false);
  }, []);

  const connectToConnection = useCallback(
    async (connection: HubConnection, connectionId: string, persistenceWarning: string) => {
      setConnectingHubId(connectionId);
      setHubConnection(connection);

      try {
        await saveRememberedHubConnection(connection);
      } catch {
        setErrorText(persistenceWarning);
      } finally {
        setConnectingHubId(null);
      }

      router.replace('/(tabs)');
    },
    [],
  );

  const connectToHub = useCallback(
    async (hub: VerifiedHub) => {
      await connectToConnection(
        buildConnection(hub, 'verified'),
        hub.id,
        'Connected, but failed to remember this hub for next login.',
      );
    },
    [connectToConnection],
  );

  const connectToUnverifiedCandidate = useCallback(
    async (candidate: ResolvedHubCandidate) => {
      const targets = getCandidateTargets(candidate);
      if (targets.length === 0) {
        setErrorText('Cannot connect: this service does not expose a usable address or host.');
        return;
      }

      const selectedTarget = targets[0];
      const selectedPort = getCandidatePorts(candidate)[0] ?? DEFAULT_GUESSED_HUB_PORT;
      const hub = buildVerifiedHub(candidate, selectedTarget, selectedPort);
      const connectionId = `test:${candidateKey(candidate)}`;

      await connectToConnection(
        buildConnection(hub, 'bypassed'),
        connectionId,
        'Connected for testing, but failed to remember this hub for next login.',
      );
    },
    [connectToConnection],
  );

  const connectToGuessedService = useCallback(
    async (service: DiscoveredService) => {
      const connection = buildGuessedConnection(service);
      if (!connection) {
        setErrorText('Could not infer a host from this service name. Wait for a resolved service entry.');
        return;
      }

      await connectToConnection(
        connection,
        `guess:${service.name}`,
        'Connected with a guessed endpoint, but failed to remember this hub for next login.',
      );
    },
    [connectToConnection],
  );

  const verifyResolvedCandidate = useCallback(async (candidate: ResolvedHubCandidate) => {
    const resolvedKey = candidateKey(candidate);
    if (inFlightCandidatesRef.current.has(resolvedKey)) {
      return;
    }
    inFlightCandidatesRef.current.add(resolvedKey);

    try {
      const targets = getCandidateTargets(candidate);
      if (targets.length === 0) {
        setVerificationErrors((current) => ({
          ...current,
          [resolvedKey]: 'Resolved service did not include a usable address or host.',
        }));
        return;
      }

      setStatusText('Verifying discovered hubs...');
      let failureReason = 'Health verification failed.';

      for (const target of targets) {
        const ports = getCandidatePorts(candidate);
        for (const port of ports) {
          const hub = buildVerifiedHub(candidate, target, port);
          const result = await verifyHubHealth(hub.baseUrl, hub.apiBasePath);

          if (__DEV__) {
            console.log('[hub-discovery] health check', {
              service: candidate.name,
              target,
              port,
              url: result.url,
              apiBasePath: result.apiBasePath,
              healthy: result.healthy,
              reason: result.reason,
            });
          }

          if (!result.healthy) {
            failureReason = result.reason ? `${result.reason} (${result.url})` : `Health failed at ${result.url}`;
            continue;
          }

          const verifiedHub = buildVerifiedHub(candidate, target, port, result.apiBasePath);

          if (verifiedKeysRef.current.has(verifiedHub.id)) {
            return;
          }

          verifiedKeysRef.current.add(verifiedHub.id);
          setVerifiedHubs((current) => [...current, verifiedHub]);
          setVerificationErrors((current) => {
            const next = { ...current };
            delete next[resolvedKey];
            return next;
          });
          setStatusText('Select a verified hub to continue.');

          if (__DEV__) {
            console.log('[hub-discovery] verified hub', {
              name: verifiedHub.name,
              ip: verifiedHub.ip,
              port: verifiedHub.port,
              apiBasePath: verifiedHub.apiBasePath,
            });
          }
          return;
        }
      }

      setVerificationErrors((current) => ({
        ...current,
        [resolvedKey]: failureReason,
      }));
      setStatusText('Some resolved services failed health verification. Use testing connect if needed.');
    } finally {
      inFlightCandidatesRef.current.delete(resolvedKey);
    }
  }, []);

  const startDiscovery = useCallback(() => {
    stopDiscovery();
    setErrorText(null);
    setStatusText('Scanning for _shield._tcp on local network...');
    setIsScanning(true);

    const session = createHubDiscoverySession({
      onScanStart: () => {
        setIsScanning(true);
      },
      onScanStop: () => {
        setIsScanning(false);
      },
      onFoundService: (service) => {
        if (__DEV__) {
          console.log('[hub-discovery] found service', service.name);
        }

        setFoundServices((current) => {
          const exists = current.some((item) => item.name === service.name);
          if (exists) {
            return current;
          }
          return [...current, service];
        });
      },
      onResolvedService: (candidate) => {
        if (__DEV__) {
          console.log('[hub-discovery] resolved service', {
            name: candidate.name,
            addresses: candidate.addresses,
            host: candidate.host,
            port: candidate.port,
            apiBasePath: candidate.apiBasePath,
          });
        }

        setResolvedCandidates((current) => {
          const currentIndex = current.findIndex((item) => candidateKey(item) === candidateKey(candidate));
          if (currentIndex === -1) {
            return [...current, candidate];
          }

          const next = [...current];
          next[currentIndex] = mergeCandidate(next[currentIndex], candidate);
          return next;
        });

        void verifyResolvedCandidate(candidate);
      },
      onError: (error) => {
        if (__DEV__) {
          console.log('[hub-discovery] discovery error', error.message);
        }
        setErrorText(error.message);
        setStatusText('Discovery encountered an error. Retry scan to continue.');
      },
    });

    discoverySessionRef.current = session;
    session.start();
  }, [stopDiscovery, verifyResolvedCandidate]);

  const handleRetry = useCallback(() => {
    verifiedKeysRef.current.clear();
    inFlightCandidatesRef.current.clear();
    setFoundServices([]);
    setResolvedCandidates([]);
    setVerifiedHubs([]);
    setVerificationErrors({});
    startDiscovery();
  }, [startDiscovery]);

  useEffect(() => {
    if (!isScanning) {
      return;
    }

    const timer = setTimeout(() => {
      if (foundServices.length > 0 && resolvedCandidates.length === 0) {
        setStatusText(
          'Services were found but not resolved yet. This is usually local-network multicast isolation or Android NSD reliability.',
        );
      }
    }, 9000);

    return () => {
      clearTimeout(timer);
    };
  }, [isScanning, foundServices.length, resolvedCandidates.length]);

  useEffect(() => {
    unmountedRef.current = false;

    const initialize = async () => {
      setIsPreparing(true);
      setErrorText(null);

      const remembered = await loadRememberedHubConnection();
      if (remembered) {
        setStatusText('Checking previously connected hub...');
        const rememberedHealthyConnection = await verifyRememberedConnection(remembered);
        if (rememberedHealthyConnection) {
          if (__DEV__) {
            console.log('[hub-discovery] remembered hub is healthy', rememberedHealthyConnection.baseUrl);
          }
          setHubConnection(rememberedHealthyConnection);
          router.replace('/(tabs)');
          return;
        }

        if (__DEV__) {
          console.log('[hub-discovery] remembered hub no longer healthy');
        }
        await clearRememberedHubConnection();
      }

      if (unmountedRef.current) {
        return;
      }

      if (!isHubDiscoverySupported) {
        const fallbackBaseUrl = process.env.EXPO_PUBLIC_HUB_URL;
        const normalizedFallbackBaseUrl = fallbackBaseUrl ? normalizeBaseUrl(fallbackBaseUrl) : null;
        const fallbackApiPath = normalizeApiBasePath(process.env.EXPO_PUBLIC_HUB_API_BASE ?? '/api');

        if (normalizedFallbackBaseUrl) {
          setStatusText('Local discovery is unavailable in this runtime. Verifying fallback endpoint...');
          const fallbackHealthy = await verifyHubHealth(normalizedFallbackBaseUrl, fallbackApiPath);
          if (fallbackHealthy.healthy) {
            setHubConnection({
              baseUrl: normalizedFallbackBaseUrl,
              apiBasePath: fallbackHealthy.apiBasePath,
              metadata: {
                serviceName: 'Fallback hub',
                verifiedAt: new Date().toISOString(),
                verificationStatus: 'verified',
              },
            });
            router.replace('/(tabs)');
            return;
          }
        }

        setStatusText(
          'Local network discovery is unavailable in this runtime and no healthy fallback endpoint is configured.',
        );
        setIsScanning(false);
      } else {
        startDiscovery();
      }

      setIsPreparing(false);
    };

    void initialize();

    return () => {
      unmountedRef.current = true;
      stopDiscovery();
    };
  }, [startDiscovery, stopDiscovery]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Discover SHIELD Hub</Text>
        <Text style={styles.subtitle}>We need a local hub endpoint before loading the rest of the app.</Text>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text style={styles.statusText}>{statusText}</Text>
          {isScanning ? <Text style={styles.infoText}>Scanning in progress...</Text> : null}
          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Discovered Services</Text>
          {foundServices.length === 0 ? (
            <Text style={styles.emptyText}>No service instances discovered yet.</Text>
          ) : (
            foundServices.map((service) => {
              const isResolved = resolvedServiceNames.has(service.name);
              const guessedConnection = buildGuessedConnection(service);
              const guessedConnectionId = `guess:${service.name}`;

              return (
                <View key={service.name} style={styles.discoveryCard}>
                  <View style={styles.discoveryMeta}>
                    <Text style={styles.rowPrimary}>{service.name}</Text>
                    <Text style={styles.rowMeta}>{isResolved ? 'resolved' : 'found only'}</Text>
                  </View>
                  {!isResolved && guessedConnection ? (
                    <Button
                      title="Connect (Test Guess)"
                      onPress={() => void connectToGuessedService(service)}
                      loading={connectingHubId === guessedConnectionId}
                      disabled={connectingHubId !== null && connectingHubId !== guessedConnectionId}
                      variant="outline"
                      style={styles.testButton}
                    />
                  ) : null}
                </View>
              );
            })
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Verified Hubs</Text>
          {verifiedHubs.length === 0 ? (
            <Text style={styles.emptyText}>No healthy hubs verified yet.</Text>
          ) : (
            verifiedHubs.map((hub) => (
              <View key={hub.id} style={styles.hubCard}>
                <View style={styles.hubMeta}>
                  <Text style={styles.hubTitle}>{hub.name}</Text>
                  <Text style={styles.hubText}>
                    {hub.ip}:{hub.port}
                  </Text>
                  <Text style={styles.hubText}>path {hub.apiBasePath}</Text>
                </View>
                <Button
                  title="Connect"
                  onPress={() => void connectToHub(hub)}
                  loading={connectingHubId === hub.id}
                  disabled={connectingHubId !== null && connectingHubId !== hub.id}
                  style={styles.connectButton}
                />
              </View>
            ))
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Unverified Hubs (Testing)</Text>
          <Text style={styles.infoText}>Bypass health check and connect to the first resolved address.</Text>
          {unverifiedCandidates.length === 0 ? (
            <Text style={styles.emptyText}>No unverified resolved hubs.</Text>
          ) : (
            unverifiedCandidates.map((candidate) => {
              const key = candidateKey(candidate);
              const targets = getCandidateTargets(candidate);
              const ports = getCandidatePorts(candidate);
              const previewTarget =
                targets[0] && ports[0] ? `${targets[0]}:${ports[0]}` : 'No target available';
              const error = verificationErrors[key];
              const connectionId = `test:${key}`;

              return (
                <View key={key} style={styles.hubCard}>
                  <View style={styles.hubMeta}>
                    <Text style={styles.hubTitle}>{candidate.name}</Text>
                    <Text style={styles.hubText}>{previewTarget}</Text>
                    <Text style={styles.hubText}>path {candidate.apiBasePath}</Text>
                    {error ? <Text style={styles.warningText}>{error}</Text> : null}
                  </View>
                  <Button
                    title="Connect for Testing"
                    onPress={() => void connectToUnverifiedCandidate(candidate)}
                    loading={connectingHubId === connectionId}
                    disabled={
                      targets.length === 0 ||
                      ports.length === 0 ||
                      (connectingHubId !== null && connectingHubId !== connectionId)
                    }
                    variant="outline"
                    style={styles.connectButton}
                  />
                </View>
              );
            })
          )}
        </Card>

        <Button
          title="Retry Scan"
          onPress={handleRetry}
          loading={isPreparing}
          disabled={!isHubDiscoverySupported || connectingHubId !== null}
          variant="outline"
          style={styles.retryButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.88)',
    marginBottom: 4,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  statusText: {
    fontSize: 14,
    color: Colors.textDark,
  },
  infoText: {
    fontSize: 12,
    color: Colors.primary,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },
  warningText: {
    fontSize: 12,
    color: Colors.error,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textGray,
  },
  discoveryCard: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    paddingBottom: 10,
    gap: 8,
  },
  discoveryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  rowPrimary: {
    fontSize: 14,
    color: Colors.textDark,
    flex: 1,
  },
  rowMeta: {
    fontSize: 12,
    color: Colors.textGray,
  },
  hubCard: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  hubMeta: {
    gap: 3,
  },
  hubTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textDark,
  },
  hubText: {
    fontSize: 13,
    color: Colors.textGray,
  },
  connectButton: {
    marginHorizontal: 0,
  },
  testButton: {
    marginHorizontal: 0,
  },
  retryButton: {
    marginHorizontal: 0,
  },
});
