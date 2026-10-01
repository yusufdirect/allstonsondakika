import { test } from 'node:test';
import assert from 'node:assert/strict';
import { articleView, homeView } from '../src/views.js';

const article = {
  slug: 'sample-story', article_date: '2026-09-30', category: 'gundem', image_url: '/images/pide.jpg',
  featured: true, title: 'Sample <story>', summary: 'A short summary', body: 'First <script>alert(1)</script> paragraph.'
};

test('language routes render their own menus and article switch', () => {
  const tr = homeView([article], 'tr');
  const en = homeView([article], 'en');
  assert.match(tr, /<html lang="tr">/);
  assert.match(en, /<html lang="en">/);
  assert.match(en, /href="\/en\/articles\/sample-story"/);
  assert.match(en, /href="\/tr\/" lang="tr"/);
  assert.match(articleView(article, 'en'), /href="\/tr\/articles\/sample-story"/);
});

test('article content is escaped before display', () => {
  const html = articleView(article, 'en');
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});
