import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { pool, withTransaction } from './db.js';
import { extractBody, extractTitle } from './legacy.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function seedContent() {
  const existing = await pool.query('SELECT count(*)::int AS count FROM articles');
  if (existing.rows[0].count) return;
  const articles = JSON.parse(await readFile(path.join(root, 'articles.json'), 'utf8'));
  const englishMeta = JSON.parse(await readFile(path.join(root, 'translations', 'en.json'), 'utf8'));
  await withTransaction(async (client) => {
    for (const article of articles) {
      const html = await readFile(path.join(root, article.url), 'utf8');
      const body = extractBody(html);
      const title = extractTitle(html);
      if (!body) throw new Error(`Could not extract body from ${article.url}`);
      if (!title) throw new Error(`Could not extract title from ${article.url}`);
      const slug = path.basename(article.url, '.html');
      const english = englishMeta[slug];
      if (!english?.title || !english?.summary) throw new Error(`Missing English metadata for ${slug}`);
      const englishBody = (await readFile(path.join(root, 'translations', 'en', `${slug}.txt`), 'utf8')).trim();
      if (!englishBody) throw new Error(`Missing English body for ${slug}`);
      const inserted = await client.query(`INSERT INTO articles
        (slug, article_date, category, image_url, featured, status)
        VALUES ($1,$2,$3,$4,$5,'published') RETURNING id`,
        [slug, article.date, String(article.category).toLowerCase(), article.image ? `/${article.image}` : null, Boolean(article.featured)]);
      await client.query(`INSERT INTO article_translations (article_id, locale, title, summary, body)
        VALUES ($1,'tr',$2,$3,$4),($1,'en',$5,$6,$7)`,
        [inserted.rows[0].id, title, article.summary, body, english.title, english.summary, englishBody]);
    }
  });
  console.log(`Imported ${articles.length} Turkish articles.`);
}

export async function bootstrapAdmins() {
  const raw = process.env.ADMIN_BOOTSTRAP_JSON;
  if (!raw) return;
  const count = await pool.query('SELECT count(*)::int AS count FROM admins');
  if (count.rows[0].count) return;
  let users;
  try { users = JSON.parse(raw); } catch { throw new Error('ADMIN_BOOTSTRAP_JSON must be valid JSON.'); }
  if (!Array.isArray(users) || users.length < 3) throw new Error('Provide at least three bootstrap admins.');
  const names = new Set();
  for (const user of users) {
    if (!/^[a-zA-Z0-9_.-]{3,64}$/.test(user.username ?? '')) throw new Error('Invalid admin username.');
    if (typeof user.password !== 'string' || user.password.length < 6) throw new Error('Admin passwords must have at least 6 characters.');
    if (names.has(user.username.toLowerCase())) throw new Error('Duplicate admin username.');
    names.add(user.username.toLowerCase());
  }
  await withTransaction(async (client) => {
    for (const user of users) {
      const hash = await bcrypt.hash(user.password, 12);
      await client.query('INSERT INTO admins (username,password_hash) VALUES ($1,$2)', [user.username.toLowerCase(), hash]);
    }
  });
  console.log(`Created ${users.length} admin accounts. Remove ADMIN_BOOTSTRAP_JSON from Railway variables.`);
}
