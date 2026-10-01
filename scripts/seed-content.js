import { initDb, pool } from '../src/db.js';
import { seedContent } from '../src/seed.js';

try {
  await initDb();
  await seedContent();
} finally {
  await pool.end();
}
