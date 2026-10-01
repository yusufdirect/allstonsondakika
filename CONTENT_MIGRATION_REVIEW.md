# Content migration review

The old site uses `articles.json` for homepage cards and separate HTML files for article pages. Several fields disagree. The new app uses each article page's `<h1>` as its Turkish headline (so article headlines remain intact), while the homepage JSON supplies publication date, summary, category, image, and featured status. New pages show one consistent headline and date everywhere. The original files remain in this branch for reference.

Please review these publication-date differences before the public cutover:

| Article | Homepage JSON | Old article page |
| --- | --- | --- |
| Alibey Pidesi | 2026-08-08 | 2026-08-09 |
| Deniz Goktas protest | 2026-07-15 | 2026-07-01 |
| Indecent proposal | 2026-07-02 | 2026-07-06 |
| Sinan breakup rumor | 2026-07-02 | 2026-07-06 |
| Sewer smell complaint | 2026-07-02 | 2026-07-06 |
| OE statement | 2026-08-21 | Placeholder `DD.MM.YYYY` |

Several other headlines differ only in capitalization or Turkish characters. The old article HTML headline is now canonical, including the longer headline for the indecent-proposal story. If a different date or headline is intended, edit it once in the new admin panel after staging is deployed.
