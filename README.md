# Allston Son Dakika

An independent satirical news publication from Allston, Massachusetts. What started as an Instagram account for stories and inside jokes among friends now has its own website, with Turkish and English editions and a newspaper-inspired design.

**Website:** [allstonsondakika.com](https://allstonsondakika.com)

**Read:** [Türkçe](https://allstonsondakika.com/tr/) · [English](https://allstonsondakika.com/en/)

## Recent changes

- **Railway hosting:** The site has moved from GitHub Pages to a Node.js application hosted on Railway. Source code and version history remain on GitHub.
- **Custom domain:** The public website is now available at **allstonsondakika.com**.
- **English support:** Readers can switch between Turkish and English homepages and articles.
- **Admin publishing:** Editors can create, edit, preview, publish, delete, and restore articles through the admin panel. Articles and translations are stored in PostgreSQL.

## Repository branches

The Railway application is on [`railway-admin-bilingual`](https://github.com/yusufdirect/allstonsondakika/tree/railway-admin-bilingual). The `main` branch currently contains the original static site. The application setup and publishing instructions below refer to **`railway-admin-bilingual`**.

## How the site runs

| Component | Role |
| --- | --- |
| GitHub | Stores the source code, committed images, and version history. |
| Railway | Deploys and runs the Express application from the connected GitHub branch. |
| PostgreSQL | Stores articles, translations, editor accounts, and login sessions. |
| allstonsondakika.com | The public domain through which readers access the site. |

The application uses Node.js, Express, server-rendered HTML, CSS, and PostgreSQL. Public pages include featured stories, a chronological article archive, category navigation, and a language switch.

## Publishing articles

Sign in at [allstonsondakika.com/admin](https://allstonsondakika.com/admin) with an editor account.

1. Create a post or edit an existing one.
2. Enter the Turkish and English headline, summary, and article text, along with the date, category, slug, and optional image.
3. Save a draft and preview it, or set its status to published. Publishing requires all three text fields in both languages; drafts can leave the English fields empty.

Images can use an HTTPS URL or a file committed under `images/`, referenced as `/images/filename.jpg`. The admin panel does not upload image files. Deleted posts can be restored, and changing a slug preserves a redirect from the previous slug.

**Code changes and editorial changes follow different paths:** code and committed images are deployed from GitHub; admin edits are saved directly to PostgreSQL without a code deployment. Database content is not written back to this repository, so a GitHub clone is not a backup of the current publication.

## Local development

Use Node.js 22 or newer and a running PostgreSQL database. Create an empty database for local development, then clone the application branch and install its dependencies:

```sh
git clone --branch railway-admin-bilingual https://github.com/yusufdirect/allstonsondakika.git
cd allstonsondakika
npm ci
```

Copy `.env.example` to `.env`, replace the database connection string, and generate a session secret:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `SESSION_SECRET` | Random session-signing secret of at least 32 characters. |
| `NODE_ENV` | `development` locally; `production` on Railway. |
| `PORT` | Optional local port; defaults to `3000`. Railway supplies its own value. |
| `ADMIN_BOOTSTRAP_JSON` | Optional initial editor accounts; see below. |

Start the app with the environment file explicitly loaded:

```sh
node --env-file=.env src/server.js
```

Open [localhost:3000](http://localhost:3000). If the variables are already loaded into your shell or supplied by your hosting environment, use `npm start` instead.

On startup, the application creates its tables and imports the nine original articles and their English translations **only when the articles table is empty**. Subsequent restarts preserve existing content.

### Initial editor accounts

For a fresh database, set `ADMIN_BOOTSTRAP_JSON` before the first startup. The current implementation requires at least three distinct usernames and passwords of at least six characters. Use long, unique passwords. Example structure for `.env`:

```dotenv
ADMIN_BOOTSTRAP_JSON='[{"username":"editor1","password":"replace-with-first-unique-password"},{"username":"editor2","password":"replace-with-second-unique-password"},{"username":"editor3","password":"replace-with-third-unique-password"}]'
```

Accounts are created only when the admin table is empty. Remove this variable after setup. Keep `.env` and real credentials out of Git.

## Railway deployment

The public site already uses Railway and the custom domain. To reproduce this deployment:

1. Connect the `railway-admin-bilingual` branch to a Railway web service and add a PostgreSQL service.
2. Reference the database service's `DATABASE_URL` in the web service. Set `NODE_ENV=production`, `SESSION_SECRET`, and, for a new database, the temporary `ADMIN_BOOTSTRAP_JSON`.
3. Install dependencies with `npm ci` and run `npm start` from the repository root. There is no separate build script.
4. Use `/health` to check that the app can reach PostgreSQL. After initial account creation, remove `ADMIN_BOOTSTRAP_JSON` and keep `SESSION_SECRET` stable across deployments.
5. Configure the custom domain on the web service using the DNS records Railway provides. Back up PostgreSQL separately from the repository.

Legacy paths such as `/index.html` and `/articles/example.html` redirect to their Turkish equivalents **on the Railway host**. These routes do not configure redirects on the old GitHub Pages domain.

## Legacy files and checks

The original `articles.json`, `articles/`, and `translations/` files remain as import sources. Editing them does not update articles already stored in PostgreSQL. `ADDING_ARTICLES.md` describes the original static-site workflow; use the admin panel for the current site. `CONTENT_MIGRATION_REVIEW.md` records historical differences found during the content import.

Run the existing content, validation, and rendering checks with:

```sh
npm test
```

These checks do not replace testing login, publishing, and database persistence against a running application.

## Credits

Created and maintained by [Yusuf M. Tasyurt](https://yusuf.direct).
