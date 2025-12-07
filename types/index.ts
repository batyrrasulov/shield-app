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
    time: string;
    date: string;
    cameraId: string;
  };
  description?: string;
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


//* -----------------------------
//* Rule Types
//* -----------------------------

export type RuleTriggerType =
  | 'face_detected'
  | 'time_interval'
  | 'scheduled'
  | 'motion_detected';

export type RuleActionType =
| 'send_notification'
| 'mark_event_important'
| 'start_recording_clip'
| 'tag_event_for_followup'
| 'disable_camera';

export type TimeUnit = 
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'year';

export type WeekDay = 
  | 'Sun'
  | 'Mon'
  | 'Tue'
  | 'Wed'
  | 'Thu'
  | 'Fri'
  | 'Sat';

export type RuleTrigger =
  | { type: 'face_detected'; profileId: string, isExclusive: boolean }
  | { type: 'time_interval'; interval: number; unit: TimeUnit }
  | { type: 'scheduled'; days: WeekDay[]; time: string }
  | { type: 'motion_detected' };

export type RuleAction = 
  | {type: 'send_notification'; message: string}
  | {type: 'mark_event_important';}
  | {type: 'start_recording_clip'; duration: number; unit: TimeUnit}
  | {type: 'tag_event_for_followup';}
  | {type: 'disable_camera'; cameraIds: string[]; duration: number; unit: TimeUnit; notification: boolean}


export interface Rule {
  id: string;
  name: string;
  description?: string;
  cameras: string[];
  triggers: RuleTrigger[];
  actions: RuleAction[];
  enabled: boolean;
  priority?: number;
  global?: boolean;
}
//* -----------------------------

export interface SystemHealth {
  hubStatus: 'online' | 'offline';
  storageUsed: number;
  storageTotal: number;
  cameras: {
    online: number;
    offline: number;
  };
}
