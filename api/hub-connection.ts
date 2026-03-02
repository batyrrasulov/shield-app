import { Platform } from 'react-native';
import type { HubConnection } from './hub-connection.types';

type HubConnectionModule = {
  normalizeApiBasePath: (apiBasePath?: string) => string;
  setHubConnection: (connection: HubConnection) => HubConnection;
  getHubConnection: () => HubConnection | null;
  clearHubConnection: () => void;
  subscribeHubConnection: (listener: () => void) => () => void;
  useHubConnection: () => HubConnection | null;
  saveRememberedHubConnection: (connection: HubConnection) => Promise<void>;
  clearRememberedHubConnection: () => Promise<void>;
  loadRememberedHubConnection: () => Promise<HubConnection | null>;
};

const hubConnectionModule: HubConnectionModule = Platform.OS === 'web'
  ? require('./hub-connection.web')
  : require('./hub-connection.native');

export const {
  normalizeApiBasePath,
  setHubConnection,
  getHubConnection,
  clearHubConnection,
  subscribeHubConnection,
  useHubConnection,
  saveRememberedHubConnection,
  clearRememberedHubConnection,
  loadRememberedHubConnection,
} = hubConnectionModule;

export type { HubConnection };
