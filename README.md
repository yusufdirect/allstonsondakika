# Allston Son Dakika — Railway app

This branch contains the database-backed bilingual version of the site. The original GitHub Pages files are retained as the content source and for the live site until cutover. Code stays in the same GitHub repository; Railway deploys the Node.js service from this branch.

## What is included

- Turkish and English public homepages and articles at `/tr/` and `/en/`.
- `/admin` login for named editors, with create, edit, preview, delete, and restore actions.
- Nine existing articles imported from `articles.json` and their HTML files on first startup, plus English translation drafts under `translations/en/`.
- PostgreSQL storage for articles, translations, admin password hashes, and login sessions.
- Existing article URLs redirect to their new Turkish pages on the Railway host.

The English translations are editorial drafts. Review names, quotations, in-group jokes, and tone before switching the public domain.

## Run locally

Use Node.js 20 or newer and a PostgreSQL database. Copy `.env.example` to `.env` for reference, but load the variables into your shell or development tool; Node does not automatically read `.env`. Set `DATABASE_URL` and a random `SESSION_SECRET` of at least 32 characters. Generate one with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Then run `npm ci` and `npm start`. The app creates its tables and imports the nine articles if the article table is empty. Open `http://localhost:3000/tr/` and `http://localhost:3000/en/`.

To create the initial editors, set `ADMIN_BOOTSTRAP_JSON` before starting the app. It must be a JSON array of at least three distinct usernames and passwords of at least 6 characters. Example **structure only**:

```json
[{"username":"editor1","password":"replace-with-a-long-unique-password"},{"username":"editor2","password":"replace-with-another-long-password"},{"username":"editor3","password":"replace-with-a-third-long-password"}]
```

The app hashes these passwords and creates the accounts only if the admin table is empty. Remove the bootstrap variable after the accounts are created. Never commit passwords or `.env` to Git.

## Railway staging setup for the owner

1. Create a Railway project in your Pro workspace.
2. Add a PostgreSQL database service.
3. Add a web service from the existing `yusufdirect/allstonsondakika` GitHub repository, selecting the `railway-admin-bilingual` branch for staging. The root directory is `/`; Railway can build the app from `package.json` and run `npm start`.
4. In the web service Variables tab, add `DATABASE_URL` as a **reference variable** to the PostgreSQL service's `DATABASE_URL`. Set `NODE_ENV=production`, a random `SESSION_SECRET`, and the temporary `ADMIN_BOOTSTRAP_JSON` value containing the three editors. Railway supplies `PORT`.
5. Deploy and check the service logs for `Imported 9 Turkish articles` and `Created 3 admin accounts`. Then remove `ADMIN_BOOTSTRAP_JSON` from the web service variables and redeploy. Keep `SESSION_SECRET` stable across deployments.
6. In the web service's Public Networking settings, choose **Generate Domain**. Test `/tr/`, `/en/`, all nine articles, and `/admin` on that temporary URL.
7. Enable scheduled backups for the PostgreSQL service and test a restore before relying on the admin panel for new content.

Do not buy or connect the custom domain until staging is reviewed. After choosing a domain and checking its renewal cost, add it to the Railway web service. If the domain is bought elsewhere, copy the exact DNS records Railway displays, including its verification TXT record. If bought from Railway and attached to the service, Railway can configure its DNS automatically.

## Editing and deployment behavior

Code and images in this repository deploy from GitHub. Admin edits live in PostgreSQL and are **not** written back to Git; they survive code deployments. New images can use an HTTPS URL, or be committed under `images/` and referenced as `images/filename.jpg`. Uploaded image storage is outside this initial scope.

Published posts require Turkish and English headline, summary, and body. Drafts may leave the English fields empty. The server enforces headline (150), slug (100), summary (300), and body (20,000) character limits per language. Slug changes preserve an alias; deleting a post hides it until restored.

Before merging this branch into `main`, verify which branch GitHub Pages publishes. Keep the old Pages site live until the Railway domain works. Then decide whether to retain a static notice or redirect page at the old GitHub Pages URL; GitHub Pages cannot run this Node.js app.

## Verification

Run `npm test` for content, translation, validation, rendering, and escaping checks. Full login and database checks require a running PostgreSQL instance and should be completed on the Railway staging URL before domain cutover.
