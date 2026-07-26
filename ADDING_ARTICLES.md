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

The `"image"` field is used on the homepage and article page. For a local image, put the file in `images/` and use a path like:

```json
"image": "images/my-photo.jpg"
```

Article pages load their image from `articles.json`, so changing the `"image"` value there updates both the homepage and the article page. You do not need to edit the `<img>` path inside the article HTML after the article is listed in `articles.json`.

The homepage must be opened through a local or hosted web server so it can read `articles.json`. The current local URL is:

```text
http://127.0.0.1:8000/index.html
```
