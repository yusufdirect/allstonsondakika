export const LIMITS = Object.freeze({ title: 150, slug: 100, summary: 300, body: 20000 });
export const CATEGORIES = ['gundem', 'yerel', 'dunya', 'magazin'];

export function charCount(value) {
  return [...String(value ?? '')].length;
}

export function normalizeSlug(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function normalizeImage(value) {
  const image = String(value ?? '').trim();
  if (!image) return '';
  if (/^https:\/\/[^\s]+$/i.test(image)) return image;
  if (/^\/?images\/[a-zA-Z0-9._/-]+$/.test(image) && !image.includes('..')) {
    return `/${image.replace(/^\//, '')}`;
  }
  return null;
}

export function validatePost(input) {
  const data = {
    slug: normalizeSlug(input.slug),
    date: String(input.date ?? '').trim(),
    category: String(input.category ?? '').trim().toLowerCase(),
    image: normalizeImage(input.image),
    featured: input.featured === 'on',
    status: input.status === 'published' ? 'published' : 'draft',
    tr: {}, en: {}
  };
  const errors = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug) || charCount(data.slug) > LIMITS.slug) {
    errors.push('Slug must use lowercase letters, numbers, and hyphens (up to 100 characters).');
  }
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.date);
  const parsed = parts && new Date(Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])));
  if (!parts || parsed.getUTCFullYear() !== Number(parts[1]) || parsed.getUTCMonth() !== Number(parts[2]) - 1 || parsed.getUTCDate() !== Number(parts[3])) {
    errors.push('Enter a valid article date.');
  }
  if (!CATEGORIES.includes(data.category)) errors.push('Choose a category.');
  if (data.image === null) errors.push('Image must be an HTTPS URL or a path under images/.');
  for (const locale of ['tr', 'en']) {
    for (const field of ['title', 'summary', 'body']) {
      data[locale][field] = String(input[`${field}_${locale}`] ?? '').trim();
      const required = locale === 'tr' || data.status === 'published';
      if (required && !data[locale][field]) errors.push(`${locale.toUpperCase()} ${field} is required.`);
      if (charCount(data[locale][field]) > LIMITS[field]) {
        errors.push(`${locale.toUpperCase()} ${field} exceeds ${LIMITS[field]} characters.`);
      }
    }
  }
  return { data, errors };
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
