import { DetectionEvent } from '@/types';

export const MOCK_SIGHTINGS: DetectionEvent[] = [
  {
    id: 'evt-001',
    cameraId: '01',
    timestamp: '2026-02-20T18:34:12Z',
    type: 'face_recognized_known',
    profileId: '01',
    confidence: 0.94,
    snapshotRef: 'https://example.com/snapshots/evt-001.jpg',
  },
  {
    id: 'evt-002',
    cameraId: '03',
    timestamp: '2026-02-20T23:04:52Z',
    type: 'face_recognized_known',
    profileId: '01',
    confidence: 0.91,
    snapshotRef: 'https://example.com/snapshots/evt-002.jpg',
  },
  {
    id: 'evt-003',
    cameraId: '02',
    timestamp: '2026-02-21T02:18:02Z',
    type: 'face_recognized_known',
    profileId: '02',
    confidence: 0.89,
    snapshotRef: 'https://example.com/snapshots/evt-003.jpg',
  },
];

export const getSightingsByProfile = (profileId: string) => {
  return MOCK_SIGHTINGS.filter(event => event.profileId === profileId);
};
