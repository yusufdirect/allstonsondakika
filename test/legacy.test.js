import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { extractBody, extractTitle } from '../src/legacy.js';

test('all legacy articles and English counterparts have complete content', async () => {
  const articles = JSON.parse(await readFile('articles.json', 'utf8'));
  const en = JSON.parse(await readFile('translations/en.json', 'utf8'));
  assert.equal(articles.length, 9);
  for (const article of articles) {
    const slug = path.basename(article.url, '.html');
    const html = await readFile(article.url, 'utf8');
    const bodyTr = extractBody(html);
    const bodyEn = (await readFile(`translations/en/${slug}.txt`, 'utf8')).trim();
    assert.ok(bodyTr.length > 100, `Turkish body missing: ${slug}`);
    assert.ok(extractTitle(html), `Turkish title missing: ${slug}`);
    assert.ok(bodyEn.length > 100, `English body missing: ${slug}`);
    assert.ok(en[slug]?.title && en[slug]?.summary, `English metadata missing: ${slug}`);
    assert.ok([...en[slug].title].length <= 150, `English title too long: ${slug}`);
    assert.ok([...en[slug].summary].length <= 300, `English summary too long: ${slug}`);
    assert.ok(bodyTr.length <= 20000 && bodyEn.length <= 20000, `Body exceeds editor limit: ${slug}`);
  }
});
