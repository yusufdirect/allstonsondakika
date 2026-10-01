import { CATEGORIES, LIMITS, escapeHtml as h } from './content.js';
import { dateLabel, labels } from './i18n.js';

const opposite = (locale) => locale === 'tr' ? 'en' : 'tr';

function articleUrl(article, locale) {
  return `/${locale}/articles/${encodeURIComponent(article.slug)}`;
}

function localeSwitch(locale, path) {
  return `/${opposite(locale)}${path}`;
}

function layout({ title, locale = 'tr', body, path = '', admin = false }) {
  const t = labels[locale];
  const nav = CATEGORIES.map((category) => `<a href="/${locale}/?category=${category}">${h(t.categories[category])}</a>`).join('');
  const switchLink = admin ? '' : `<a class="language-switch" href="${h(localeSwitch(locale, path))}" lang="${opposite(locale)}">${h(t.otherLang)}</a>`;
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${h(title)} | Allston Son Dakika</title><link rel="icon" href="/allstonsondakika.png"><link rel="stylesheet" href="/style.css">
    ${admin ? '' : `<link rel="alternate" hreflang="tr" href="/tr${h(path)}"><link rel="alternate" hreflang="en" href="/en${h(path)}">`}</head>
    <body><header class="site-header"><div class="top-bar"><span>${h(dateLabel(new Date(), locale))}</span><span>Allston, MA</span></div>
    <div class="masthead"><a class="brand-mark" href="/${locale}/" aria-label="Allston Son Dakika"><img class="site-emblem" src="/allstonsondakika.png" alt=""><span class="site-logo">Allston Son Dakika</span></a><p>${h(t.subtitle)}</p></div>
    <nav class="section-nav" aria-label="${h(t.nav)}">${nav}${switchLink}</nav></header>
    <main>${body}</main><footer class="site-footer"><p>Allston Son Dakika · ${h(t.satire)}</p></footer></body></html>`;
}

function image(article, className, locale, link = true) {
  if (!article.image_url) return '';
  const tag = `<img src="${h(article.image_url)}" alt="${h(article.title)}" loading="lazy">`;
  return link ? `<a class="${className}" href="${articleUrl(article, locale)}">${tag}</a>` : `<figure class="${className}">${tag}</figure>`;
}

function preview(article, locale) {
  return `<article class="post-preview"><p class="date">${h(dateLabel(article.article_date, locale))}</p>
    <h3><a href="${articleUrl(article, locale)}">${h(article.title)}</a></h3>
    ${image(article, 'preview-media', locale)}<p>${h(article.summary)}</p></article>`;
}

export function homeView(articles, locale, category = '') {
  const t = labels[locale];
  const featured = articles.find((article) => article.featured) ?? articles[0];
  const rest = articles.filter((article) => article !== featured);
  const body = featured ? `<section class="lead-grid" aria-labelledby="latest-news"><article class="lead-story">
      <p class="kicker">${h(t.categories[featured.category] ?? t.breaking)}</p>
      <p class="date">${h(dateLabel(featured.article_date, locale))}</p>
      <h1><a href="${articleUrl(featured, locale)}">${h(featured.title)}</a></h1>
      ${image(featured, 'lead-media', locale)}<p class="summary">${h(featured.summary)}</p></article>
      <aside class="news-rail"><h2 id="latest-news">${h(t.latest)}</h2>${rest.slice(0, 2).map((a) => preview(a, locale)).join('')}</aside></section>
      <section class="story-list" aria-label="${h(t.all)}">${rest.slice(2).map((a) => preview(a, locale)).join('') || `<p class="loading-message">${h(t.empty)}</p>`}</section>`
    : `<p class="loading-message">${h(t.empty)}</p>`;
  const path = category ? `/?category=${encodeURIComponent(category)}` : '/';
  return layout({ title: category ? t.categories[category] : t.latest, locale, body, path });
}

export function articleView(article, locale) {
  const t = labels[locale];
  const body = `<p><a href="/${locale}/">${h(t.back)}</a></p><article>
    <p class="date">${h(dateLabel(article.article_date, locale))} · ${h(t.categories[article.category])}</p>
    <h1>${h(article.title)}</h1>${image(article, 'article-media', locale, false)}
    <div class="article-text">${h(article.body)}</div></article>`;
  return layout({ title: article.title, locale, body, path: `/articles/${encodeURIComponent(article.slug)}` });
}

export function notFoundView(locale) {
  return layout({ title: labels[locale].notFound, locale, body: `<h1>${h(labels[locale].notFound)}</h1>`, path: '/' });
}

function adminLayout(title, body) {
  return layout({ title, admin: true, body: `<div class="admin-shell">${body}</div>` });
}

export function loginView(csrf, error = '') {
  return adminLayout('Admin login', `<h1>Admin login</h1>${error ? `<p class="form-error">${h(error)}</p>` : ''}
    <form method="post" action="/admin/login" class="admin-form"><input type="hidden" name="_csrf" value="${h(csrf)}">
    <label>Username<input name="username" autocomplete="username" required maxlength="64"></label>
    <label>Password<input type="password" name="password" autocomplete="current-password" required></label>
    <button type="submit">Log in</button></form>`);
}

export function adminListView(articles, username, csrf, notice = '') {
  const rows = articles.map((a) => `<tr><td><a href="/admin/posts/${a.id}/edit">${h(a.title_tr)}</a><small>${h(a.slug)}</small></td>
    <td>${h(a.status)}${a.deleted_at ? ' · deleted' : ''}</td><td>${a.title_en ? 'Yes' : 'No'}</td>
    <td><a href="/admin/posts/${a.id}/edit">Edit</a> · <a href="/admin/posts/${a.id}/preview/tr">Preview</a></td></tr>`).join('');
  return adminLayout('Posts', `<div class="admin-head"><h1>Posts</h1><form method="post" action="/admin/logout"><input type="hidden" name="_csrf" value="${h(csrf)}"><button class="text-button">Log out ${h(username)}</button></form></div>
    ${notice ? `<p class="form-notice">${h(notice)}</p>` : ''}<p><a class="action-link" href="/admin/posts/new">Make a post</a></p>
    <div class="table-scroll"><table><thead><tr><th>Article</th><th>Status</th><th>English</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`);
}

function field(name, label, value, max, type = 'text') {
  return `<label>${label}<input type="${type}" name="${name}" value="${h(value)}" ${max ? `maxlength="${max}"` : ''} required></label>`;
}

function textarea(name, label, value, max) {
  return `<label>${label}<textarea name="${name}" maxlength="${max}" rows="${name.startsWith('body') ? 18 : 3}">${h(value)}</textarea><small>Maximum ${max} characters</small></label>`;
}

export function postFormView(post = {}, csrf, errors = []) {
  const existing = Boolean(post.id);
  const body = `<p><a href="/admin">← Posts</a></p><h1>${existing ? 'Edit post' : 'Make a post'}</h1>
    ${errors.length ? `<div class="form-error"><ul>${errors.map((e) => `<li>${h(e)}</li>`).join('')}</ul></div>` : ''}
    <form method="post" action="${existing ? `/admin/posts/${post.id}` : '/admin/posts'}" class="admin-form">
      <input type="hidden" name="_csrf" value="${h(csrf)}">
      <div class="form-grid">${field('slug', 'Slug', post.slug ?? '', LIMITS.slug)}
      ${field('date', 'Article date', post.date ?? new Date().toISOString().slice(0, 10), null, 'date')}
      <label>Category<select name="category">${CATEGORIES.map((c) => `<option value="${c}" ${post.category === c ? 'selected' : ''}>${h(labels.tr.categories[c])}</option>`).join('')}</select></label>
      <label>Image URL or images/ path<input name="image" value="${h(post.image ?? '')}"></label></div>
      <label class="check-label"><input type="checkbox" name="featured" ${post.featured ? 'checked' : ''}> Featured story</label>
      <div class="translation-grid"><fieldset><legend>Türkçe</legend>
      ${field('title_tr', 'Headline', post.title_tr ?? '', LIMITS.title)}
      ${textarea('summary_tr', 'Short summary', post.summary_tr ?? '', LIMITS.summary)}
      ${textarea('body_tr', 'Article content', post.body_tr ?? '', LIMITS.body)}</fieldset>
      <fieldset><legend>English</legend>
      ${field('title_en', 'Headline', post.title_en ?? '', LIMITS.title).replace(' required>', '>')}
      ${textarea('summary_en', 'Short summary', post.summary_en ?? '', LIMITS.summary)}
      ${textarea('body_en', 'Article content', post.body_en ?? '', LIMITS.body)}</fieldset></div>
      <label>Status<select name="status"><option value="draft" ${post.status !== 'published' ? 'selected' : ''}>Draft</option><option value="published" ${post.status === 'published' ? 'selected' : ''}>Published</option></select><small>Both languages are required for new published posts.</small></label>
      <button type="submit">${existing ? 'Save changes' : 'Create post'}</button></form>
      ${existing ? `<div class="admin-actions">${post.deleted_at ? `<form method="post" action="/admin/posts/${post.id}/restore"><input type="hidden" name="_csrf" value="${h(csrf)}"><button>Restore post</button></form>` : `<a class="danger-link" href="/admin/posts/${post.id}/delete">Delete post</a>`}</div>` : ''}`;
  return adminLayout(existing ? 'Edit post' : 'Make a post', body);
}

export function deleteConfirmView(post, csrf) {
  return adminLayout('Delete post', `<p><a href="/admin/posts/${post.id}/edit">← Back to editor</a></p>
    <h1>Delete this post?</h1><p>${h(post.title_tr)}</p><p>The post will disappear from the public site and can be restored later.</p>
    <form method="post" action="/admin/posts/${post.id}/delete"><input type="hidden" name="_csrf" value="${h(csrf)}">
    <button class="danger" type="submit">Delete post</button></form>`);
}
