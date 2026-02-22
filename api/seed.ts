import { getDb } from './db';

const seedCameras = [
  {
    id: '01',
    name: 'Living Room',
    location: 'Living Room',
    status: 'online',
    streamRef: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    id: '02',
    name: 'Backyard',
    location: 'Backyard Door',
    status: 'online',
    streamRef: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  },
  {
    id: '03',
    name: 'Front Door',
    location: 'Front Door',
    status: 'online',
    streamRef: 'https://test-streams.mux.dev/pts_shift/master.m3u8',
  },
];

const seedVideos = [
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

const seedEvents = [
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

export const seedHub = async () => {
  const db = await getDb();

  const cameraCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM cameras');
  if ((cameraCount?.count ?? 0) === 0) {
    for (const camera of seedCameras) {
      await db.run(
        'INSERT INTO cameras (id, name, location, status, streamRef) VALUES (?, ?, ?, ?, ?)',
        camera.id,
        camera.name,
        camera.location,
        camera.status,
        camera.streamRef
      );
    }
  }

  const videoCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM videos');
  if ((videoCount?.count ?? 0) === 0) {
    for (const video of seedVideos) {
      await db.run(
        'INSERT INTO videos (id, cameraId, startTimestamp, endTimestamp, fileRef, size, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
        video.id,
        video.cameraId,
        video.startTimestamp,
        video.endTimestamp,
        video.fileRef,
        video.size,
        video.reason
      );
    }
  }

  const eventCount = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM events');
  if ((eventCount?.count ?? 0) === 0) {
    for (const event of seedEvents) {
      await db.run(
        'INSERT INTO events (id, cameraId, timestamp, type, profileId, confidence, snapshotRef) VALUES (?, ?, ?, ?, ?, ?, ?)',
        event.id,
        event.cameraId,
        event.timestamp,
        event.type,
        event.profileId,
        event.confidence,
        event.snapshotRef
      );
    }
  }
};
