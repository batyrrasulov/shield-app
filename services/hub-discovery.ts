import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { HubDiscoveryCallbacks, HubDiscoverySession } from './hub-discovery.native';

type HubDiscoveryModule = {
  isHubDiscoverySupported: boolean;
  createHubDiscoverySession: (callbacks: HubDiscoveryCallbacks) => HubDiscoverySession;
};

const isExpoGo = Constants.executionEnvironment === 'storeClient';
const useNativeDiscovery = Platform.OS !== 'web' && !isExpoGo;

const hubDiscoveryModule: HubDiscoveryModule = useNativeDiscovery
  ? require('./hub-discovery.native')
  : require('./hub-discovery.web');

export const { isHubDiscoverySupported, createHubDiscoverySession } = hubDiscoveryModule;
export type { HubDiscoveryCallbacks, HubDiscoverySession };
