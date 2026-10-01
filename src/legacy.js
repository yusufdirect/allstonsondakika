import * as cheerio from 'cheerio';

function tidy(text) {
  return text.replace(/\r/g, '').split('\n').map((line) => line.trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n').trim();
}

export function extractBody(html) {
  const $ = cheerio.load(html);
  const wrapper = $('.article-text').first();
  if (wrapper.length) return tidy(wrapper.text());
  return tidy($('main article > p').not('.date').map((_, p) => $(p).text().trim()).get().join('\n\n'));
}

export function extractTitle(html) {
  const $ = cheerio.load(html);
  return $('main article h1').first().text().trim();
}
