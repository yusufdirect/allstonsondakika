export const labels = {
  tr: {
    subtitle: 'Yerel haber, gündem ve son dakika gelişmeleri',
    nav: 'Haber kategorileri', latest: 'Son Haberler', all: 'Tüm haberler',
    breaking: 'Son Dakika', empty: 'Henüz haber bulunmuyor.',
    back: '← Allston Son Dakika', satire: 'Arkadaş grubumuz için hiciv haberleri.',
    categories: { gundem: 'Gündem', yerel: 'Yerel', dunya: 'Dünya', magazin: 'Magazin' },
    langName: 'Türkçe', otherLang: 'English', notFound: 'Haber bulunamadı.'
  },
  en: {
    subtitle: 'Local news, headlines and breaking developments',
    nav: 'News categories', latest: 'Latest Stories', all: 'All stories',
    breaking: 'Breaking News', empty: 'No stories yet.',
    back: '← Allston Son Dakika', satire: 'Satirical news for our friend group.',
    categories: { gundem: 'Headlines', yerel: 'Local', dunya: 'World', magazin: 'Entertainment' },
    langName: 'English', otherLang: 'Türkçe', notFound: 'Article not found.'
  }
};

export function dateLabel(value, locale) {
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(date);
}
