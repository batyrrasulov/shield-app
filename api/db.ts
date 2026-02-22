import fs from 'fs';
import path from 'path';
import { Database, open } from 'sqlite';
import sqlite3 from 'sqlite3';

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'hub.sqlite');

let dbInstance: Database | null = null;

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const migrate = async (db: Database) => {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cameras (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      status TEXT NOT NULL,
      streamRef TEXT
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      cameraId TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      type TEXT NOT NULL,
      profileId TEXT,
      confidence REAL,
      snapshotRef TEXT
    );

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      cameraId TEXT NOT NULL,
      startTimestamp TEXT NOT NULL,
      endTimestamp TEXT NOT NULL,
      fileRef TEXT NOT NULL,
      size INTEGER NOT NULL,
      reason TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS enrollment_photos (
      id TEXT PRIMARY KEY,
      profileId TEXT NOT NULL,
      filePath TEXT NOT NULL,
      fileName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
};

export const getDb = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  ensureDataDir();
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await migrate(db);
  dbInstance = db;
  return db;
};
