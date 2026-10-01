import { test } from 'node:test';
import assert from 'node:assert/strict';
import { charCount, escapeHtml, validatePost } from '../src/content.js';

const post = {
  slug: 'new-story', date: '2026-09-30', category: 'gundem', image: 'images/pide.jpg',
  status: 'published', title_tr: 'Yeni Haber', summary_tr: 'Kısa özet', body_tr: 'Haber metni',
  title_en: 'New Story', summary_en: 'Short summary', body_en: 'Article text'
};

test('published posts require both languages', () => {
  assert.deepEqual(validatePost(post).errors, []);
  assert.match(validatePost({ ...post, body_en: '' }).errors.join(' '), /EN body is required/);
  assert.deepEqual(validatePost({ ...post, body_en: '', status: 'draft' }).errors, []);
});

test('limits and input safety apply on the server', () => {
  assert.equal(charCount('😀'), 1);
  assert.match(validatePost({ ...post, title_tr: 'A'.repeat(151) }).errors.join(' '), /exceeds 150/);
  assert.match(validatePost({ ...post, slug: '../admin' }).errors.join(' '), /Slug/);
  assert.match(validatePost({ ...post, image: 'javascript:alert(1)' }).errors.join(' '), /Image/);
  assert.match(validatePost({ ...post, date: '2026-02-31' }).errors.join(' '), /valid article date/);
  assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
});
