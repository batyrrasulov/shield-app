import { Recording } from '@/types';

export const MOCK_RECORDINGS: Recording[] = [
  {
    id: 'rec-001',
    cameraId: '01',
    startTimestamp: '2026-02-20T18:32:00Z',
    endTimestamp: '2026-02-20T18:37:00Z',
    fileRef: 'https://example.com/streams/living-room/rec-001.m3u8',
    size: 128,
    reason: 'Motion detected',
  },
  {
    id: 'rec-002',
    cameraId: '02',
    startTimestamp: '2026-02-20T21:10:00Z',
    endTimestamp: '2026-02-20T21:12:00Z',
    fileRef: 'https://example.com/streams/backyard/rec-002.m3u8',
    size: 64,
    reason: 'Rule: Internal Recording',
  },
  {
    id: 'rec-003',
    cameraId: '03',
    startTimestamp: '2026-02-21T01:04:00Z',
    endTimestamp: '2026-02-21T01:06:30Z',
    fileRef: 'https://example.com/streams/front-door/rec-003.m3u8',
    size: 80,
    reason: 'Face detected',
  },
];

export const getRecordingsByCamera = (cameraId?: string) => {
  if (!cameraId || cameraId === 'all') {
    return MOCK_RECORDINGS;
  }
  return MOCK_RECORDINGS.filter(recording => recording.cameraId === cameraId);
};

export const getRecordingById = (id: string) => {
  return MOCK_RECORDINGS.find(recording => recording.id === id);
};
