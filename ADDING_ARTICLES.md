# Adding Articles

To add a new article:

1. Copy `articles/article-template.html` to a new file in `articles/`.
2. Replace the title, date, and body text in the new article file.
3. Add a matching entry to `articles.json`.

Example entry:

```json
{
  "title": "New article headline",
  "date": "2026-07-06",
  "summary": "Short homepage summary goes here.",
  "url": "articles/new-article.html",
  "category": "Yerel",
  "featured": false,
  "image": "https://example.com/article-photo.jpg"
}
```

Set `"featured": true` on the article that should appear as the large lead story. If more than one article is marked featured, the newest featured article is used.

The `"image"` field is used on the homepage and should match the image placed below the headline in the article HTML file.

The homepage must be opened through a local or hosted web server so it can read `articles.json`. The current local URL is:

```text
http://127.0.0.1:8000/index.html
```
