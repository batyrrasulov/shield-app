/**
 * type defs
 * core entities
 */

export type UserRole = 'owner' | 'admin' | 'viewer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  locale: 'en' | 'es';
}

export interface Camera {
  id: string;
  name: string;
  location?: string;
  status: 'online' | 'offline';
  streamRef?: string;
  uptime?: number;
}

export interface Profile {
  id: string;
  displayName: string;
  labels?: string[];
  confidenceThreshold: number;
  avatarUrl?: string;
  lastSeen?: {
    timestamp: string;
    cameraId: string;
  };
}

export type DetectionEventType = 
  | 'motion_detected'
  | 'person_detected'
  | 'face_recognized_known'
  | 'face_detected_unknown'
  | 'device_offline'
  | 'storage_low';

export interface DetectionEvent {
  id: string;
  cameraId: string;
  timestamp: string;
  type: DetectionEventType;
  profileId?: string;
  confidence?: number;
  snapshotRef?: string;
}

export interface Recording {
  id: string;
  cameraId: string;
  startTimestamp: string;
  endTimestamp: string;
  fileRef: string;
  size: number;
  reason: string;
}

export type RuleConditionType = 
  | 'time_of_day'
  | 'profile_status'
  | 'camera_in_list'
  | 'confidence_threshold';

export type RuleActionType =
  | 'send_notification'
  | 'mark_event_important'
  | 'start_recording_clip'
  | 'tag_event_for_followup'
  | 'disable_camera';

export interface RuleCondition {
  type: RuleConditionType;
  value: any;
}

export interface RuleAction {
  type: RuleActionType;
  value: any;
}

export interface Rule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
  priority?: number;
  exclusive?: boolean;
  global?: boolean;
}

export interface SystemHealth {
  hubStatus: 'online' | 'offline';
  storageUsed: number;
  storageTotal: number;
  cameras: {
    online: number;
    offline: number;
  };
}
