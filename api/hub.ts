import { getHubConnection, normalizeApiBasePath, setHubConnection } from '@/api/hub-connection';
import {
  Camera,
  DetectionEvent,
  DetectionEventType,
  Profile,
  Recording,
  Rule,
  RuleAction,
  RuleTrigger,
  TimeUnit,
  WeekDay,
} from '@/types';
import { Platform } from 'react-native';

const DEFAULT_HUB_URL = 'http://localhost:8080';
const ENV_HUB_URL = process.env.EXPO_PUBLIC_HUB_URL ?? DEFAULT_HUB_URL;
const ENV_API_BASE = normalizeApiBasePath(process.env.EXPO_PUBLIC_HUB_API_BASE ?? '/api');
const DEFAULT_API_BASE_FALLBACK = '/api';

type UnknownRecord = Record<string, unknown>;

type CameraRow = UnknownRecord & {
  Camera_Id?: string | number;
  Cam_Location?: string;
  Cam_Name?: string;
  Cam_Status?: string;
  Cam_URL?: string;
  id?: string | number;
  location?: string;
  name?: string;
  status?: string;
  streamRef?: string;
};

type EventRow = UnknownRecord & {
  Event_Id?: string | number;
  Camera_Id?: string | number;
  Confidence?: number | string;
  Detection_Time?: string;
  Profile_Id?: string | number | null;
  Snapshot_Path?: string;
  Event_Type?: string;
  id?: string | number;
  cameraId?: string | number;
  timestamp?: string;
  profileId?: string | number | null;
  confidence?: number | string;
  snapshotRef?: string;
  type?: string;
};

type RuleRow = UnknownRecord & {
  Rule_Id?: string | number;
  Rule_Name?: string;
  Rule_Desc?: string;
  Rule_Enabled?: number | boolean | string;
  Rule_Priority?: number | string;
  id?: string | number;
  name?: string;
  description?: string;
  enabled?: number | boolean | string;
  priority?: number | string;
};

type VideoRow = UnknownRecord & {
  Recording_Id?: string | number;
  Camera_Id?: string | number;
  Rec_Start?: string;
  Rec_End?: string;
  Rec_Path?: string;
  Rec_Reason?: string;
  Rec_Size?: number | string;
  id?: string | number;
  cameraId?: string | number;
  startTimestamp?: string;
  endTimestamp?: string;
  fileRef?: string;
  reason?: string;
  size?: number | string;
};

type ProfileRow = UnknownRecord & {
  Profile_Id?: string | number;
  Profile_Name?: string;
  Profile_Status?: string;
  id?: string | number;
  displayName?: string;
  status?: string;
};

type FaceEmbedding = UnknownRecord;
type DetectionRuleResult = UnknownRecord;

type RuleActionRow = UnknownRecord & {
  RuleAction_Id?: string | number;
  Rule_Id?: string | number;
  Action_Type?: string;
  Action_Params?: string | UnknownRecord;
};

type RuleTargetCameraRow = UnknownRecord & {
  RuleTargetCamera_Id?: string | number;
  Rule_Id?: string | number;
  Camera_Id?: string | number;
};

type RuleTriggerRow = UnknownRecord & {
  RuleTrigger_Id?: string | number;
  Rule_Id?: string | number;
  Trigger_Type?: string;
  Trigger_Params?: string | UnknownRecord;
};

type ApiConfirmation = {
  message?: string;
};

export type EnrollmentPhotoPayload = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

export type CreateCameraInput = {
  Cam_Location: string;
  Cam_Name: string;
  Cam_Status: string;
  Cam_URL: string;
};

export type CreateEventInput = {
  Camera_Id: number;
  Confidence: number;
  Detection_Time: string;
  Profile_Id: number;
  Snapshot_Path?: string;
};

export type CreateRuleInput = {
  Rule_Name: string;
  Rule_Desc?: string;
  Rule_Enabled: number;
  Rule_Priority: number;
};

export type CreateRuleActionInput = {
  Rule_Id: number;
  Action_Type: string;
  Action_Params: string;
};

export type CreateRuleTriggerInput = {
  Rule_Id: number;
  Trigger_Type: string;
  Trigger_Params: string;
};

export type CreateRuleTargetCameraInput = {
  Rule_Id: number;
  Camera_Id: number;
};

export type CreateRuleWithDetailsInput = {
  rule: Rule;
};

export type CreateRecordingInput = {
  Camera_Id: number;
  Rec_Start: string;
  Rec_End: string;
  Rec_Path: string;
  Rec_Reason: string;
  Rec_Size: number;
};

export type CreateProfileInput = {
  Profile_Name: string;
  Profile_Status: string;
};

export type CreateProfileWithEnrollmentInput = {
  profileName: string;
  profileStatus: string;
  photo: EnrollmentPhotoPayload;
};

const resolveHubBaseUrl = () => getHubConnection()?.baseUrl ?? ENV_HUB_URL;
const resolveApiBasePath = () => getHubConnection()?.apiBasePath ?? ENV_API_BASE;

const buildUrl = (path: string, hubBaseUrl = resolveHubBaseUrl()) => {
  if (path.startsWith('http')) {
    return path;
  }
  return `${hubBaseUrl}${path}`;
};

const buildApiUrl = (
  path: string,
  apiBasePath = resolveApiBasePath(),
  hubBaseUrl = resolveHubBaseUrl(),
) => buildUrl(`${normalizeApiBasePath(apiBasePath)}${path}`, hubBaseUrl);

const getApiBasePathCandidates = (apiBasePath: string) => {
  const primary = normalizeApiBasePath(apiBasePath);
  const rawTrimmed = apiBasePath.trim();
  const rawWithSlash = rawTrimmed.startsWith('/') ? rawTrimmed : `/${rawTrimmed}`;
  const strippedHealth = normalizeApiBasePath(rawWithSlash.replace(/\/health$/i, ''));

  return Array.from(new Set([primary, strippedHealth, DEFAULT_API_BASE_FALLBACK]));
};

const toQueryString = (params: Record<string, string | undefined>) => {
  const entries = Object.entries(params).filter(([, value]) => value && value.length > 0);
  if (entries.length === 0) {
    return '';
  }
  const query = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value ?? '')}`)
    .join('&');
  return `?${query}`;
};

const readString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  return '';
};

const readNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
};

const readBoolean = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1' || normalized === 'enabled' || normalized === 'active') {
        return true;
      }
      if (normalized === 'false' || normalized === '0' || normalized === 'disabled' || normalized === 'inactive') {
        return false;
      }
    }
  }
  return false;
};

const parseJsonObject = (value: unknown): UnknownRecord => {
  if (!value) {
    return {};
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as UnknownRecord;
      }
      return {};
    } catch {
      return {};
    }
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as UnknownRecord;
  }

  return {};
};

const toWeekDay = (value: unknown): WeekDay | null => {
  const normalized = readString(value).slice(0, 3);
  if (normalized === 'Sun' || normalized === 'Mon' || normalized === 'Tue' || normalized === 'Wed' || normalized === 'Thu' || normalized === 'Fri' || normalized === 'Sat') {
    return normalized;
  }
  return null;
};

const normalizeCameraStatus = (value: string): Camera['status'] => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'active' || normalized === 'online' || normalized === 'up' || normalized === 'enabled') {
    return 'online';
  }
  return 'offline';
};

const normalizeDetectionType = (value: string, profileId?: string): DetectionEventType => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'motion_detected' || normalized === 'motion') {
    return 'motion_detected';
  }
  if (normalized === 'person_detected' || normalized === 'person') {
    return 'person_detected';
  }
  if (normalized === 'face_recognized_known' || normalized === 'face_known') {
    return 'face_recognized_known';
  }
  if (normalized === 'face_detected_unknown' || normalized === 'face_unknown') {
    return 'face_detected_unknown';
  }
  if (normalized === 'device_offline') {
    return 'device_offline';
  }
  if (normalized === 'storage_low') {
    return 'storage_low';
  }

  return profileId ? 'face_recognized_known' : 'person_detected';
};

const normalizeRuleActionType = (value: string): RuleAction['type'] => {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'NOTIFY' || normalized === 'SEND_NOTIFICATION') {
    return 'send_notification';
  }
  if (normalized === 'MARK_IMPORTANT' || normalized === 'MARK_EVENT_IMPORTANT') {
    return 'mark_event_important';
  }
  if (normalized === 'START_RECORDING' || normalized === 'START_RECORDING_CLIP') {
    return 'start_recording_clip';
  }
  if (normalized === 'TAG' || normalized === 'TAG_EVENT_FOR_FOLLOWUP' || normalized === 'TAG_FOR_FOLLOWUP') {
    return 'tag_event_for_followup';
  }
  if (normalized === 'DISABLE_CAMERA' || normalized === 'DISABLE') {
    return 'disable_camera';
  }
  return 'send_notification';
};

const normalizeRuleTriggerType = (value: string): RuleTrigger['type'] => {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'MOTION' || normalized === 'MOTION_DETECTED') {
    return 'motion_detected';
  }
  if (normalized === 'TIME_INTERVAL' || normalized === 'INTERVAL') {
    return 'time_interval';
  }
  if (normalized === 'SCHEDULED' || normalized === 'SCHEDULE') {
    return 'scheduled';
  }
  return 'face_detected';
};

const normalizeTimeUnit = (value: string): TimeUnit => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'minute' || normalized === 'minutes') {
    return 'minute';
  }
  if (normalized === 'hour' || normalized === 'hours') {
    return 'hour';
  }
  if (normalized === 'day' || normalized === 'days') {
    return 'day';
  }
  if (normalized === 'week' || normalized === 'weeks') {
    return 'week';
  }
  if (normalized === 'year' || normalized === 'years') {
    return 'year';
  }
  return 'minute';
};

const mapCamera = (row: CameraRow): Camera => {
  const id = readString(row.Camera_Id, row.id);
  return {
    id,
    name: readString(row.Cam_Name, row.name) || `Camera ${id || '?'}`,
    location: readString(row.Cam_Location, row.location) || undefined,
    status: normalizeCameraStatus(readString(row.Cam_Status, row.status) || 'offline'),
    streamRef: readString(row.Cam_URL, row.streamRef) || undefined,
  };
};

const mapEvent = (row: EventRow): DetectionEvent => {
  const profileId = readString(row.Profile_Id, row.profileId) || undefined;
  const eventType = readString(row.Event_Type, row.type);

  return {
    id: readString(row.Event_Id, row.id),
    cameraId: readString(row.Camera_Id, row.cameraId),
    timestamp: readString(row.Detection_Time, row.timestamp),
    type: normalizeDetectionType(eventType, profileId),
    profileId,
    confidence: readNumber(row.Confidence, row.confidence),
    snapshotRef: readString(row.Snapshot_Path, row.snapshotRef) || undefined,
  };
};

const mapRecording = (row: VideoRow): Recording => ({
  id: readString(row.Recording_Id, row.id),
  cameraId: readString(row.Camera_Id, row.cameraId),
  startTimestamp: readString(row.Rec_Start, row.startTimestamp),
  endTimestamp: readString(row.Rec_End, row.endTimestamp),
  fileRef: readString(row.Rec_Path, row.fileRef),
  reason: readString(row.Rec_Reason, row.reason) || 'N/A',
  size: readNumber(row.Rec_Size, row.size),
});

const mapProfile = (row: ProfileRow): Profile => {
  const status = readString(row.Profile_Status, row.status);
  return {
    id: readString(row.Profile_Id, row.id),
    displayName: readString(row.Profile_Name, row.displayName),
    confidenceThreshold: 0.8,
    labels: status ? [status] : undefined,
    description: status ? `Status: ${status}` : undefined,
  };
};

const mapRuleBase = (row: RuleRow): Rule => ({
  id: readString(row.Rule_Id, row.id),
  name: readString(row.Rule_Name, row.name),
  description: readString(row.Rule_Desc, row.description) || undefined,
  cameras: [],
  triggers: [],
  actions: [],
  enabled: readBoolean(row.Rule_Enabled, row.enabled),
  priority: readNumber(row.Rule_Priority, row.priority),
});

const mapRuleAction = (row: RuleActionRow): { ruleId: string; action: RuleAction } => {
  const ruleId = readString(row.Rule_Id);
  const params = parseJsonObject(row.Action_Params);
  const type = normalizeRuleActionType(readString(row.Action_Type));

  if (type === 'mark_event_important') {
    return { ruleId, action: { type } };
  }
  if (type === 'tag_event_for_followup') {
    return { ruleId, action: { type } };
  }
  if (type === 'start_recording_clip') {
    return {
      ruleId,
      action: {
        type,
        duration: readNumber(params.duration) || 1,
        unit: normalizeTimeUnit(readString(params.unit) || 'minute'),
      },
    };
  }
  if (type === 'disable_camera') {
    const candidateCameraIds = Array.isArray(params.cameraIds)
      ? params.cameraIds.map((cameraId) => readString(cameraId)).filter((cameraId) => cameraId.length > 0)
      : [];
    const singleCameraId = readString(params.cameraId);
    return {
      ruleId,
      action: {
        type,
        cameraIds: singleCameraId && candidateCameraIds.length === 0 ? [singleCameraId] : candidateCameraIds,
        duration: readNumber(params.duration) || 1,
        unit: normalizeTimeUnit(readString(params.unit) || 'minute'),
        notification: readBoolean(params.notification),
      },
    };
  }

  return {
    ruleId,
    action: {
      type: 'send_notification',
      message: readString(params.message, params.channel) || 'Alert',
    },
  };
};

const mapRuleTrigger = (row: RuleTriggerRow): { ruleId: string; trigger: RuleTrigger } => {
  const ruleId = readString(row.Rule_Id);
  const params = parseJsonObject(row.Trigger_Params);
  const type = normalizeRuleTriggerType(readString(row.Trigger_Type));

  if (type === 'motion_detected') {
    return { ruleId, trigger: { type } };
  }
  if (type === 'time_interval') {
    return {
      ruleId,
      trigger: {
        type,
        interval: readNumber(params.interval) || 5,
        unit: normalizeTimeUnit(readString(params.unit) || 'minute'),
      },
    };
  }
  if (type === 'scheduled') {
    const rawDays = Array.isArray(params.days) ? params.days : [];
    const mappedDays = rawDays
      .map((day) => toWeekDay(day))
      .filter((day): day is WeekDay => day !== null);
    return {
      ruleId,
      trigger: {
        type,
        days: mappedDays.length > 0 ? mappedDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        time: readString(params.time) || '13:00',
      },
    };
  }

  const profileId = readString(params.profileId, params.Profile_Id);
  return {
    ruleId,
    trigger: {
      type: 'face_detected',
      profileId: profileId || 'unknown',
      isExclusive: readBoolean(params.isExclusive),
    },
  };
};

const mapRuleTargetCamera = (row: RuleTargetCameraRow): { ruleId: string; cameraId: string } => ({
  ruleId: readString(row.Rule_Id),
  cameraId: readString(row.Camera_Id),
});

const toArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const rememberWorkingApiBasePath = (apiBasePath: string) => {
  const runtimeConnection = getHubConnection();
  if (!runtimeConnection || runtimeConnection.apiBasePath === apiBasePath) {
    return;
  }

  setHubConnection({
    ...runtimeConnection,
    apiBasePath,
  });
};

const fetchWithApiBaseFallback = async (path: string, init?: RequestInit) => {
  const runtimeConnection = getHubConnection();
  const hubBaseUrl = resolveHubBaseUrl();
  const startingApiBasePath = resolveApiBasePath();
  const apiBasePathCandidates = runtimeConnection
    ? getApiBasePathCandidates(startingApiBasePath)
    : [startingApiBasePath];

  let lastResponse: Response | null = null;
  let lastUrl = buildApiUrl(path, startingApiBasePath, hubBaseUrl);
  let lastApiBasePath = startingApiBasePath;
  const failures: string[] = [];

  for (const apiBasePath of apiBasePathCandidates) {
    const url = buildApiUrl(path, apiBasePath, hubBaseUrl);
    lastUrl = url;
    lastApiBasePath = apiBasePath;

    try {
      const response = await fetch(url, init);
      lastResponse = response;
      if (response.ok) {
        rememberWorkingApiBasePath(apiBasePath);
        return {
          response,
          url,
          apiBasePath,
        };
      }

      failures.push(`${url} -> HTTP ${response.status}`);
    } catch (error) {
      failures.push(`${url} -> ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (lastResponse) {
    return {
      response: lastResponse,
      url: lastUrl,
      apiBasePath: lastApiBasePath,
    };
  }

  throw new Error(failures[failures.length - 1] ?? `Network request failed for ${path}`);
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const { response, url } = await fetchWithApiBaseFallback(path, init);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return (await response.json()) as T;
};

const requestList = async <T>(path: string): Promise<T[]> => {
  const payload = await requestJson<unknown>(path);
  return toArray<T>(payload);
};

const requestOptionalList = async <T>(path: string): Promise<T[]> => {
  try {
    return await requestList<T>(path);
  } catch {
    return [];
  }
};

const requestPostJson = async <TBody extends UnknownRecord, TResponse = ApiConfirmation>(
  path: string,
  body: TBody,
): Promise<TResponse> => {
  const { response, url } = await fetchWithApiBaseFallback(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  const text = await response.text();
  if (!text) {
    return {} as TResponse;
  }
  return JSON.parse(text) as TResponse;
};

const toNumericId = (value: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected numeric identifier but received "${value}".`);
  }
  return parsed;
};

const sortRulesByIdDesc = (rules: Rule[]) => {
  return rules.slice().sort((a, b) => {
    const aNum = Number(a.id);
    const bNum = Number(b.id);
    if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
      return bNum - aNum;
    }
    return b.id.localeCompare(a.id);
  });
};

const resolveCreatedRule = async (beforeRules: Rule[], payload: CreateRuleInput) => {
  const beforeIds = new Set(beforeRules.map((rule) => rule.id));
  const expectedName = payload.Rule_Name.trim().toLowerCase();
  const expectedDesc = (payload.Rule_Desc ?? '').trim().toLowerCase();
  const expectedEnabled = payload.Rule_Enabled !== 0;
  const expectedPriority = payload.Rule_Priority;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const currentRules = await getRules();
    const newRules = currentRules.filter((rule) => !beforeIds.has(rule.id));

    const exactMatches = newRules.filter((rule) => {
      const sameName = rule.name.trim().toLowerCase() === expectedName;
      const sameDesc = (rule.description ?? '').trim().toLowerCase() === expectedDesc;
      const sameEnabled = rule.enabled === expectedEnabled;
      const samePriority = (rule.priority ?? 0) === expectedPriority;
      return sameName && sameDesc && sameEnabled && samePriority;
    });

    if (exactMatches.length > 0) {
      return sortRulesByIdDesc(exactMatches)[0];
    }

    const nameMatches = newRules.filter((rule) => rule.name.trim().toLowerCase() === expectedName);
    if (nameMatches.length > 0) {
      return sortRulesByIdDesc(nameMatches)[0];
    }

    await sleep(400);
  }

  return null;
};

const toRuleActionPayload = (action: RuleAction, ruleId: number): CreateRuleActionInput => {
  switch (action.type) {
    case 'send_notification':
      return {
        Rule_Id: ruleId,
        Action_Type: 'NOTIFY',
        Action_Params: JSON.stringify({
          channel: 'push',
          message: action.message,
        }),
      };
    case 'mark_event_important':
      return {
        Rule_Id: ruleId,
        Action_Type: 'MARK_EVENT_IMPORTANT',
        Action_Params: JSON.stringify({}),
      };
    case 'start_recording_clip':
      return {
        Rule_Id: ruleId,
        Action_Type: 'START_RECORDING',
        Action_Params: JSON.stringify({
          duration: action.duration,
          unit: action.unit,
        }),
      };
    case 'tag_event_for_followup':
      return {
        Rule_Id: ruleId,
        Action_Type: 'TAG_EVENT_FOR_FOLLOWUP',
        Action_Params: JSON.stringify({}),
      };
    case 'disable_camera':
      return {
        Rule_Id: ruleId,
        Action_Type: 'DISABLE_CAMERA',
        Action_Params: JSON.stringify({
          camera_ids: action.cameraIds,
          duration: action.duration,
          unit: action.unit,
          notification: action.notification,
        }),
      };
    default: {
      const unreachable: never = action;
      throw new Error(`Unhandled action type: ${String(unreachable)}`);
    }
  }
};

const toRuleTriggerPayload = (trigger: RuleTrigger, ruleId: number): CreateRuleTriggerInput => {
  switch (trigger.type) {
    case 'face_detected':
      return {
        Rule_Id: ruleId,
        Trigger_Type: 'FACE_DETECTED',
        Trigger_Params: JSON.stringify({
          profile_id: trigger.profileId,
          is_exclusive: trigger.isExclusive,
        }),
      };
    case 'time_interval':
      return {
        Rule_Id: ruleId,
        Trigger_Type: 'TIME_INTERVAL',
        Trigger_Params: JSON.stringify({
          interval: trigger.interval,
          unit: trigger.unit,
        }),
      };
    case 'scheduled':
      return {
        Rule_Id: ruleId,
        Trigger_Type: 'SCHEDULED',
        Trigger_Params: JSON.stringify({
          days: trigger.days,
          time: trigger.time,
        }),
      };
    case 'motion_detected':
      return {
        Rule_Id: ruleId,
        Trigger_Type: 'MOTION_DETECTED',
        Trigger_Params: JSON.stringify({}),
      };
    default: {
      const unreachable: never = trigger;
      throw new Error(`Unhandled trigger type: ${String(unreachable)}`);
    }
  }
};

export const getRecordings = async (cameraId?: string, date?: string) => {
  const query = toQueryString({ cameraId, date });
  const rows = await requestList<VideoRow>(`/videos${query}`);
  return rows.map(mapRecording);
};

export const getRecordingById = async (id: string) => {
  const recordings = await getRecordings();
  return recordings.find((recording) => recording.id === id) ?? null;
};

export const createRecording = async (payload: CreateRecordingInput) => {
  return requestPostJson<CreateRecordingInput>('/videos', payload);
};

export const getCameras = async () => {
  const rows = await requestList<CameraRow>('/cameras');
  return rows.map(mapCamera);
};

export const getCameraById = async (id: string) => {
  const cameras = await getCameras();
  return cameras.find((camera) => camera.id === id) ?? null;
};

export const createCamera = async (payload: CreateCameraInput) => {
  return requestPostJson<CreateCameraInput>('/cameras', payload);
};

export const getEvents = async (params?: {
  since?: string;
  cameraId?: string;
  profileId?: string;
}) => {
  const query = toQueryString({
    since: params?.since,
    cameraId: params?.cameraId,
    profileId: params?.profileId,
  });
  const rows = await requestList<EventRow>(`/events${query}`);
  return rows.map(mapEvent);
};

export const createEvent = async (payload: CreateEventInput) => {
  return requestPostJson<CreateEventInput>('/events', payload);
};

export const getProfiles = async () => {
  const rows = await requestList<ProfileRow>('/profiles');
  return rows.map(mapProfile);
};

export const getProfileById = async (id: string) => {
  const profiles = await getProfiles();
  return profiles.find((profile) => profile.id === id) ?? null;
};

export const createProfile = async (payload: CreateProfileInput) => {
  return requestPostJson<CreateProfileInput>('/profiles', payload);
};

const profileHasStatus = (profile: Profile, status: string) => {
  const normalizedStatus = status.trim().toLowerCase();
  if (!normalizedStatus) {
    return true;
  }

  const labels = profile.labels ?? [];
  return labels.some((label) => label.trim().toLowerCase() === normalizedStatus);
};

const sortProfilesByIdDesc = (profiles: Profile[]) => {
  return profiles.slice().sort((a, b) => {
    const aNum = Number(a.id);
    const bNum = Number(b.id);
    if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
      return bNum - aNum;
    }
    return b.id.localeCompare(a.id);
  });
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveCreatedProfile = async (
  beforeProfiles: Profile[],
  profileName: string,
  profileStatus: string,
) => {
  const beforeIds = new Set(beforeProfiles.map((profile) => profile.id));

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const afterProfiles = await getProfiles();

    const strictCandidates = afterProfiles.filter((profile) => {
      const isNew = !beforeIds.has(profile.id);
      const sameName = profile.displayName.trim().toLowerCase() === profileName.trim().toLowerCase();
      const sameStatus = profileHasStatus(profile, profileStatus);
      return isNew && sameName && sameStatus;
    });

    if (strictCandidates.length > 0) {
      return sortProfilesByIdDesc(strictCandidates)[0];
    }

    const sameNameCandidates = afterProfiles.filter((profile) => {
      const sameName = profile.displayName.trim().toLowerCase() === profileName.trim().toLowerCase();
      return sameName;
    });

    if (sameNameCandidates.length > 0) {
      return sortProfilesByIdDesc(sameNameCandidates)[0];
    }

    await sleep(400);
  }

  return null;
};

export const getFaceEmbeddings = async () => {
  return requestList<FaceEmbedding>('/face_embeddings');
};

export const getDetectionRuleResults = async () => {
  return requestList<DetectionRuleResult>('/detection_rule_results');
};

export const getRuleActions = async () => {
  return requestList<RuleActionRow>('/rule_actions');
};

export const getRuleTargetCameras = async () => {
  return requestList<RuleTargetCameraRow>('/rule_target_cameras');
};

export const getRuleTriggers = async () => {
  return requestList<RuleTriggerRow>('/rule_triggers');
};

export const getRules = async (): Promise<Rule[]> => {
  const [baseRows, actionRows, targetRows, triggerRows] = await Promise.all([
    requestList<RuleRow>('/rules'),
    requestOptionalList<RuleActionRow>('/rule_actions'),
    requestOptionalList<RuleTargetCameraRow>('/rule_target_cameras'),
    requestOptionalList<RuleTriggerRow>('/rule_triggers'),
  ]);

  const baseRules = baseRows.map(mapRuleBase);
  const actionsByRuleId = new Map<string, RuleAction[]>();
  const targetsByRuleId = new Map<string, string[]>();
  const triggersByRuleId = new Map<string, RuleTrigger[]>();

  actionRows.forEach((row) => {
    const mapped = mapRuleAction(row);
    const current = actionsByRuleId.get(mapped.ruleId) ?? [];
    current.push(mapped.action);
    actionsByRuleId.set(mapped.ruleId, current);
  });

  targetRows.forEach((row) => {
    const mapped = mapRuleTargetCamera(row);
    const current = targetsByRuleId.get(mapped.ruleId) ?? [];
    current.push(mapped.cameraId);
    targetsByRuleId.set(mapped.ruleId, current);
  });

  triggerRows.forEach((row) => {
    const mapped = mapRuleTrigger(row);
    const current = triggersByRuleId.get(mapped.ruleId) ?? [];
    current.push(mapped.trigger);
    triggersByRuleId.set(mapped.ruleId, current);
  });

  return baseRules.map((rule) => ({
    ...rule,
    actions: actionsByRuleId.get(rule.id) ?? [],
    cameras: targetsByRuleId.get(rule.id) ?? [],
    triggers: triggersByRuleId.get(rule.id) ?? [],
  }));
};

export const getRuleById = async (id: string) => {
  const rules = await getRules();
  return rules.find((rule) => rule.id === id) ?? null;
};

export const createRule = async (payload: CreateRuleInput) => {
  return requestPostJson<CreateRuleInput>('/rules', payload);
};

export const createRuleAction = async (payload: CreateRuleActionInput) => {
  return requestPostJson<CreateRuleActionInput>('/rule_actions', payload);
};

export const createRuleTrigger = async (payload: CreateRuleTriggerInput) => {
  return requestPostJson<CreateRuleTriggerInput>('/rule_triggers', payload);
};

export const createRuleTargetCamera = async (payload: CreateRuleTargetCameraInput) => {
  return requestPostJson<CreateRuleTargetCameraInput>('/rule_target_cameras', payload);
};

export const createRuleWithDetails = async ({ rule }: CreateRuleWithDetailsInput) => {
  const basePayload: CreateRuleInput = {
    Rule_Name: rule.name,
    Rule_Desc: rule.description || undefined,
    Rule_Enabled: rule.enabled ? 1 : 0,
    Rule_Priority: rule.priority ?? 0,
  };

  const beforeRules = await getRules();
  await createRule(basePayload);

  const createdRule = await resolveCreatedRule(beforeRules, basePayload);
  if (!createdRule) {
    throw new Error('Rule was created but could not be resolved for detail creation.');
  }

  const ruleId = toNumericId(createdRule.id);

  for (const action of rule.actions) {
    const payload = toRuleActionPayload(action, ruleId);
    await createRuleAction(payload);
  }

  for (const trigger of rule.triggers) {
    const payload = toRuleTriggerPayload(trigger, ruleId);
    await createRuleTrigger(payload);
  }

  if (!rule.global) {
    for (const cameraId of rule.cameras) {
      const payload: CreateRuleTargetCameraInput = {
        Rule_Id: ruleId,
        Camera_Id: toNumericId(cameraId),
      };
      await createRuleTargetCamera(payload);
    }
  }

  return createdRule;
};

export const startRecording = async (cameraId: string) => {
  const { response, url } = await fetchWithApiBaseFallback(`/cameras/${cameraId}/recordings/start`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to start recording: ${response.status} (${url})`);
  }
  return response.json();
};

export const stopRecording = async (cameraId: string) => {
  const { response, url } = await fetchWithApiBaseFallback(`/cameras/${cameraId}/recordings/stop`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to stop recording: ${response.status} (${url})`);
  }
  return response.json();
};

export const uploadEnrollmentPhotos = async (profileId: string, photos: EnrollmentPhotoPayload[]) => {
  const formData = new FormData();
  photos.forEach((photo, index) => {
    const extension = photo.fileName?.split('.').pop() || 'jpg';
    const fileName = photo.fileName ?? `enroll-${profileId}-${index}.${extension}`;
    const mimeType = photo.mimeType ?? 'image/jpeg';

    formData.append(
      'photos',
      {
        uri: photo.uri,
        name: fileName,
        type: mimeType,
      } as never,
    );
  });

  formData.append('platform', Platform.OS);

  const response = await fetch(buildApiUrl(`/profiles/${profileId}/enrollment`), {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload photos: ${response.status}`);
  }

  return response.json();
};

export const createProfileWithEnrollment = async (input: CreateProfileWithEnrollmentInput) => {
  const beforeProfiles = await getProfiles();

  await createProfile({
    Profile_Name: input.profileName,
    Profile_Status: input.profileStatus,
  });

  const createdProfile = await resolveCreatedProfile(
    beforeProfiles,
    input.profileName,
    input.profileStatus,
  );

  if (!createdProfile) {
    throw new Error('Profile was created but could not be resolved for enrollment upload.');
  }

  await uploadEnrollmentPhotos(createdProfile.id, [input.photo]);
  return createdProfile;
};
