import pg from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS articles (
      id BIGSERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      article_date DATE NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT,
      featured BOOLEAN NOT NULL DEFAULT false,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS article_translations (
      article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      locale TEXT NOT NULL CHECK (locale IN ('tr', 'en')),
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      body TEXT NOT NULL,
      PRIMARY KEY (article_id, locale)
    );
    CREATE TABLE IF NOT EXISTS slug_aliases (
      slug TEXT PRIMARY KEY,
      article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS articles_public_idx ON articles(status, deleted_at, article_date DESC);
  `);
}

export async function withTransaction(operation) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
