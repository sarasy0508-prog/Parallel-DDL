import { JSONFilePreset } from 'lowdb/node';
import { Low } from 'lowdb';
import { DBFile } from '@parallel-ddl/shared';
import type { DBFileType } from '@parallel-ddl/shared';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..', '..', '..');

const DB_PATH = process.env.DB_PATH ?? resolve(PROJECT_ROOT, 'data/db.json');

const defaultData: DBFileType = {
  meta: { version: 1 },
  projects: [],
};

let db: Low<DBFileType>;

export async function initDB(): Promise<Low<DBFileType>> {
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const fileExisted = existsSync(DB_PATH);
  db = await JSONFilePreset<DBFileType>(DB_PATH, defaultData);

  if (!fileExisted) {
    await db.write();
  }

  await db.read();

  const result = DBFile.safeParse(db.data);
  if (!result.success) {
    const paths = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`db.json validation failed: ${paths}`);
  }

  return db;
}

export function getDB(): Low<DBFileType> {
  if (!db) throw new Error('DB not initialized. Call initDB() first.');
  return db;
}
