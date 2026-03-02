export type HubConnectionMetadata = {
  serviceName?: string;
  fullName?: string;
  host?: string;
  ip?: string;
  port?: number;
  txt?: Record<string, string>;
  verifiedAt?: string;
  verificationStatus?: 'verified' | 'bypassed';
};

export type HubConnection = {
  baseUrl: string;
  apiBasePath: string;
  metadata?: HubConnectionMetadata;
};
