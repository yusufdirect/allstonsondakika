import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import ConnectPgSimple from 'connect-pg-simple';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import { CATEGORIES, validatePost } from './content.js';
import { initDb, pool, withTransaction } from './db.js';
import { bootstrapAdmins, seedContent } from './seed.js';
import { adminListView, articleView, deleteConfirmView, homeView, loginView, notFoundView, postFormView } from './views.js';

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters.');
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: {
  directives: { ...helmet.contentSecurityPolicy.getDefaultDirectives(), 'img-src': ["'self'", 'data:', 'https:'] }
} }));
app.use(express.urlencoded({ extended: false, limit: '128kb' }));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
app.use('/images', express.static(path.join(root, 'images'), { maxAge: '1d' }));
app.get('/style.css', (_, res) => res.sendFile(path.join(root, 'style.css')));
app.get('/allstonsondakika.png', (_, res) => res.sendFile(path.join(root, 'allstonsondakika.png')));

const PgStore = ConnectPgSimple(session);
app.use(session({
  store: new PgStore({ pool, createTableIfMissing: true }),
  name: 'asd.sid', secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 12 * 60 * 60 * 1000 }
}));

const wrap = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const csrf = (req) => req.session.csrf ??= crypto.randomBytes(32).toString('hex');
function checkCsrf(req, res, next) {
  const a = Buffer.from(String(req.body._csrf ?? ''));
  const b = Buffer.from(String(req.session.csrf ?? ''));
  if (!a.length || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(403).send('Invalid form token.');
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.adminId) return res.redirect('/admin/login');
  res.set('Cache-Control', 'no-store');
  next();
}

app.get('/health', wrap(async (_, res) => {
  await pool.query('SELECT 1');
  res.type('text').send('ok');
}));
app.get('/', (req, res) => {
  const choice = (req.headers.cookie ?? '').split(';').map((item) => item.trim()).find((item) => item.startsWith('site_locale='));
  res.redirect(302, choice === 'site_locale=en' ? '/en/' : '/tr/');
});
app.get('/index.html', (_, res) => res.redirect(301, '/tr/'));
app.get('/articles/:file.html', (req, res) => res.redirect(301, `/tr/articles/${encodeURIComponent(req.params.file)}`));

app.get('/:locale(tr|en)/', wrap(async (req, res) => {
  const { locale } = req.params;
  res.cookie('site_locale', locale, { sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 365 * 24 * 60 * 60 * 1000 });
  const category = CATEGORIES.includes(req.query.category) ? req.query.category : '';
  const result = await pool.query(`SELECT a.*, t.title, t.summary FROM articles a
    JOIN article_translations t ON t.article_id=a.id AND t.locale=$1
    WHERE a.status='published' AND a.deleted_at IS NULL AND t.title<>''
    AND ($2='' OR a.category=$2) ORDER BY a.article_date DESC, a.id DESC`, [locale, category]);
  res.send(homeView(result.rows, locale, category));
}));

app.get('/:locale(tr|en)/articles/:slug', wrap(async (req, res) => {
  const { locale, slug } = req.params;
  res.cookie('site_locale', locale, { sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 365 * 24 * 60 * 60 * 1000 });
  const result = await pool.query(`SELECT a.*, t.title, t.summary, t.body FROM articles a
    JOIN article_translations t ON t.article_id=a.id AND t.locale=$1
    WHERE a.slug=$2 AND a.status='published' AND a.deleted_at IS NULL AND t.title<>''`, [locale, slug]);
  if (result.rows.length) return res.send(articleView(result.rows[0], locale));
  const alias = await pool.query('SELECT a.slug FROM slug_aliases s JOIN articles a ON a.id=s.article_id WHERE s.slug=$1 AND a.deleted_at IS NULL', [slug]);
  if (alias.rows.length) return res.redirect(301, `/${locale}/articles/${encodeURIComponent(alias.rows[0].slug)}`);
  res.status(404).send(notFoundView(locale));
}));

app.get('/admin/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin');
  res.set('Cache-Control', 'no-store').send(loginView(csrf(req)));
});
app.post('/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false }), checkCsrf, wrap(async (req, res, next) => {
  const username = String(req.body.username ?? '').toLowerCase().trim();
  const result = await pool.query('SELECT id, password_hash FROM admins WHERE username=$1', [username]);
  const placeholder = '$2a$12$C6UzMDM.H6dfI/f/IKcEeOQsS0.6CdZ0G7hYH5nVtIswoMvV7aW0C';
  const valid = await bcrypt.compare(String(req.body.password ?? ''), result.rows[0]?.password_hash ?? placeholder);
  if (!valid || !result.rows.length) return res.status(401).send(loginView(csrf(req), 'Incorrect username or password.'));
  req.session.regenerate((error) => {
    if (error) return next(error);
    req.session.adminId = result.rows[0].id;
    req.session.username = username;
    csrf(req);
    res.redirect('/admin');
  });
}));
app.post('/admin/logout', requireAdmin, checkCsrf, (req, res, next) => req.session.destroy((error) => error ? next(error) : res.redirect('/admin/login')));

app.get('/admin', requireAdmin, wrap(async (req, res) => {
  const result = await pool.query(`SELECT a.*, tr.title AS title_tr, en.title AS title_en FROM articles a
    LEFT JOIN article_translations tr ON tr.article_id=a.id AND tr.locale='tr'
    LEFT JOIN article_translations en ON en.article_id=a.id AND en.locale='en'
    ORDER BY a.article_date DESC, a.id DESC`);
  res.send(adminListView(result.rows, req.session.username, csrf(req), req.query.saved ? 'Post saved.' : ''));
}));

app.get('/admin/posts/new', requireAdmin, (req, res) => res.send(postFormView({}, csrf(req))));
async function loadPost(id) {
  const result = await pool.query(`SELECT a.*, to_char(a.article_date,'YYYY-MM-DD') AS date,
    tr.title AS title_tr, tr.summary AS summary_tr, tr.body AS body_tr,
    en.title AS title_en, en.summary AS summary_en, en.body AS body_en
    FROM articles a
    LEFT JOIN article_translations tr ON tr.article_id=a.id AND tr.locale='tr'
    LEFT JOIN article_translations en ON en.article_id=a.id AND en.locale='en'
    WHERE a.id=$1`, [id]);
  return result.rows[0];
}
app.get('/admin/posts/:id(\\d+)/edit', requireAdmin, wrap(async (req, res) => {
  const post = await loadPost(req.params.id);
  if (!post) return res.sendStatus(404);
  res.send(postFormView({ ...post, image: post.image_url }, csrf(req)));
}));
app.get('/admin/posts/:id(\\d+)/preview/:locale(tr|en)', requireAdmin, wrap(async (req, res) => {
  const post = await loadPost(req.params.id);
  if (!post) return res.sendStatus(404);
  const locale = req.params.locale;
  const article = { ...post, title: post[`title_${locale}`], summary: post[`summary_${locale}`], body: post[`body_${locale}`] };
  res.send(articleView(article, locale));
}));
app.get('/admin/posts/:id(\\d+)/delete', requireAdmin, wrap(async (req, res) => {
  const post = await loadPost(req.params.id);
  if (!post) return res.sendStatus(404);
  res.send(deleteConfirmView(post, csrf(req)));
}));

async function savePost(req, res, existing = null) {
  const { data, errors } = validatePost(req.body);
  if (errors.length) return res.status(400).send(postFormView({ ...req.body, id: existing?.id, date: req.body.date }, csrf(req), errors));
  try {
    await withTransaction(async (client) => {
      const collision = await client.query('SELECT id FROM articles WHERE slug=$1 UNION SELECT article_id AS id FROM slug_aliases WHERE slug=$1', [data.slug]);
      if (collision.rows.some((row) => String(row.id) !== String(existing?.id ?? ''))) {
        const error = new Error('This slug is already in use.'); error.code = 'SLUG_TAKEN'; throw error;
      }
      if (data.featured) await client.query('UPDATE articles SET featured=false WHERE featured=true');
      let id;
      if (existing) {
        id = existing.id;
        if (existing.slug !== data.slug) {
          await client.query('INSERT INTO slug_aliases (slug,article_id) VALUES ($1,$2) ON CONFLICT (slug) DO NOTHING', [existing.slug, id]);
        }
        await client.query(`UPDATE articles SET slug=$1,article_date=$2,category=$3,image_url=$4,featured=$5,status=$6,updated_at=now() WHERE id=$7`,
          [data.slug, data.date, data.category, data.image || null, data.featured, data.status, id]);
      } else {
        const inserted = await client.query(`INSERT INTO articles (slug,article_date,category,image_url,featured,status)
          VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, [data.slug, data.date, data.category, data.image || null, data.featured, data.status]);
        id = inserted.rows[0].id;
      }
      for (const locale of ['tr', 'en']) {
        const t = data[locale];
        await client.query(`INSERT INTO article_translations (article_id,locale,title,summary,body) VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT (article_id,locale) DO UPDATE SET title=EXCLUDED.title,summary=EXCLUDED.summary,body=EXCLUDED.body`,
          [id, locale, t.title, t.summary, t.body]);
      }
    });
    return res.redirect(303, '/admin?saved=1');
  } catch (error) {
    if (error.code === 'SLUG_TAKEN' || error.code === '23505') {
      return res.status(400).send(postFormView({ ...req.body, id: existing?.id, date: req.body.date }, csrf(req), ['This slug is already in use.']));
    }
    throw error;
  }
}
app.post('/admin/posts', requireAdmin, checkCsrf, wrap((req, res) => savePost(req, res)));
app.post('/admin/posts/:id(\\d+)', requireAdmin, checkCsrf, wrap(async (req, res) => {
  const existing = await loadPost(req.params.id);
  if (!existing) return res.sendStatus(404);
  return savePost(req, res, existing);
}));
app.post('/admin/posts/:id(\\d+)/delete', requireAdmin, checkCsrf, wrap(async (req, res) => {
  await pool.query('UPDATE articles SET deleted_at=now(), updated_at=now() WHERE id=$1', [req.params.id]);
  res.redirect(303, '/admin');
}));
app.post('/admin/posts/:id(\\d+)/restore', requireAdmin, checkCsrf, wrap(async (req, res) => {
  await pool.query('UPDATE articles SET deleted_at=NULL, updated_at=now() WHERE id=$1', [req.params.id]);
  res.redirect(303, '/admin');
}));

app.use((error, req, res, _next) => {
  console.error(error);
  res.status(500).type('text').send('An error occurred. Please try again.');
});

await initDb();
await seedContent();
await bootstrapAdmins();
app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Allston Son Dakika is listening.'));
