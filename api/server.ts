import cors from 'cors';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db';
import { seedHub } from './seed';

const app = express();
const PORT = Number(process.env.HUB_PORT ?? 8080);
const API_PREFIX = '/api';
const recordingSessions = new Map<string, string>();

const resolveDirname = () => {
  try {
    return __dirname;
  } catch {
    const filename = fileURLToPath(import.meta.url);
    return path.dirname(filename);
  }
};

const rootDir = resolveDirname();
const uploadDir = path.join(rootDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    files: 12,
    fileSize: 10 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.json({ status: 'ok' });
});

app.get(`${API_PREFIX}/cameras`, async (_req, res) => {
  try {
    const db = await getDb();
    const cameras = await db.all('SELECT * FROM cameras');
    res.json(cameras);
  } catch {
    res.status(500).json({ error: 'Failed to load cameras.' });
  }
});

app.get(`${API_PREFIX}/events`, async (req, res) => {
  try {
    const db = await getDb();
    const { since, cameraId, profileId } = req.query;

    const filters: string[] = [];
    const params: Array<string> = [];

    if (typeof since === 'string' && since.length > 0) {
      filters.push('timestamp >= ?');
      params.push(since);
    }
    if (typeof cameraId === 'string' && cameraId.length > 0) {
      filters.push('cameraId = ?');
      params.push(cameraId);
    }
    if (typeof profileId === 'string' && profileId.length > 0) {
      filters.push('profileId = ?');
      params.push(profileId);
    }

    const where = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const events = await db.all(`SELECT * FROM events ${where} ORDER BY timestamp DESC`, params);
    res.json(events);
  } catch {
    res.status(500).json({ error: 'Failed to load events.' });
  }
});

app.get(`${API_PREFIX}/videos`, async (req, res) => {
  try {
    const db = await getDb();
    const { cameraId, date } = req.query;

    const filters: string[] = [];
    const params: Array<string> = [];

    if (typeof cameraId === 'string' && cameraId.length > 0) {
      filters.push('cameraId = ?');
      params.push(cameraId);
    }

    if (typeof date === 'string' && date.length > 0) {
      filters.push('startTimestamp LIKE ?');
      params.push(`${date}%`);
    }

    const where = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const videos = await db.all(`SELECT * FROM videos ${where} ORDER BY startTimestamp DESC`, params);
    res.json(videos);
  } catch {
    res.status(500).json({ error: 'Failed to load videos.' });
  }
});

app.post(`${API_PREFIX}/cameras/:id/recordings/start`, async (req, res) => {
  const cameraId = req.params.id;
  if (!cameraId) {
    res.status(400).json({ error: 'Camera id required.' });
    return;
  }

  if (recordingSessions.has(cameraId)) {
    res.json({ status: 'already_recording', cameraId });
    return;
  }

  const timestamp = new Date().toISOString();
  recordingSessions.set(cameraId, timestamp);
  res.json({ status: 'recording', cameraId, startTimestamp: timestamp });
});

app.post(`${API_PREFIX}/cameras/:id/recordings/stop`, async (req, res) => {
  const cameraId = req.params.id;
  if (!cameraId) {
    res.status(400).json({ error: 'Camera id required.' });
    return;
  }

  const startTimestamp = recordingSessions.get(cameraId) ?? new Date().toISOString();
  const endTimestamp = new Date().toISOString();
  const videoId = `rec-${Date.now()}`;

  try {
    const db = await getDb();
    const camera = await db.get<{ streamRef?: string }>(
      'SELECT streamRef FROM cameras WHERE id = ?',
      cameraId
    );
    const fileRef = camera?.streamRef ?? `http://localhost:${PORT}/uploads/${videoId}.m3u8`;

    await db.run(
      'INSERT INTO videos (id, cameraId, startTimestamp, endTimestamp, fileRef, size, reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
      videoId,
      cameraId,
      startTimestamp,
      endTimestamp,
      fileRef,
      12,
      'Manual recording'
    );
  } catch {
    res.status(500).json({ error: 'Failed to store recording.' });
    return;
  }

  recordingSessions.delete(cameraId);
  res.json({ status: 'stopped', cameraId, id: videoId, startTimestamp, endTimestamp });
});

app.post(`${API_PREFIX}/profiles/:id/enrollment`, upload.array('photos', 12), async (req, res) => {
  const profileId = req.params.id;
  if (!profileId) {
    res.status(400).json({ error: 'Profile id required.' });
    return;
  }

  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded.' });
    return;
  }

  try {
    const db = await getDb();
    const createdAt = new Date().toISOString();

    for (const file of files) {
      const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await db.run(
        'INSERT INTO enrollment_photos (id, profileId, filePath, fileName, mimeType, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        id,
        profileId,
        file.path,
        file.originalname,
        file.mimetype,
        createdAt
      );
    }

    res.json({ profileId, uploaded: files.length });
  } catch {
    res.status(500).json({ error: 'Failed to store enrollment photos.' });
  }
});

const start = async () => {
  await getDb();
  await seedHub();

  app.listen(PORT, () => {
    console.log(`Hub API listening on http://localhost:${PORT}`);
  });
};

start().catch(() => {
  console.error('Failed to start hub.');
  process.exit(1);
});
