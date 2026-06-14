# Fonted — Static Site

SEO-oriented fancy text and username generator at [fonted.app](https://fonted.app).

## Quick start

```bash
cd glyph
node build.js              # validate + build dist/
node build.js --validate   # check pages only
```

Deploy **`dist/`** to Cloudflare Pages.

## Project structure

```
glyph/
  build.js                    # validate + emit dist/
  pages/
    site.json                 # site.name, site.domain, og image
    home.json                 # homepage
    games.json                # hand-written game pages
    social.json               # TikTok, Instagram, X
    styles.json               # bold, cursive, zalgo, etc.
    symbols.json              # hearts, stars, crowns
    legal.json                # privacy + terms
    generated/
      game-style.json         # bulk game × style pages (from script)
  scripts/
    generate-pages.js         # matrix generator
    matrix/
      game-style.json         # games + styles data for generator
  lib/
    load-pages.js             # merges all pages/**/*.json
    validate-pages.js         # slug, intro, related-link checks
  templates/                  # HTML layout
  js/glyph.js                 # tool engine
  css/glyph.css
  dist/                       # deploy this
```

---

## Adding pages at scale

### 1. Hand-written pages (high priority)

Edit the right file in `pages/` and add an object to the `pages` array:

| File | Use for |
|------|---------|
| `games.json` | New game landing pages |
| `styles.json` | New font/style pages |
| `symbols.json` | Symbol/flair pages |
| `social.json` | Platform bio pages |
| `generated/*.json` | Bulk output only (see below) |

Required fields per tool page:

```json
{
  "slug": "my-new-page",
  "type": "game",
  "title": "My Page — Description | Fonted",
  "description": "155-char meta description.",
  "h1": "Plain text H1",
  "h1Html": "Plain with <em>accent</em>",
  "eyebrow": "Short label",
  "sub": "Hero subcopy",
  "intro": "<p>150–300 words unique HTML.</p>",
  "defaultMode": "builder",
  "defaultPlatform": "brawl",
  "faq": [{ "q": "?", "a": "..." }],
  "related": ["brawl-stars-name-generator", "heart-symbols"]
}
```

Then:

```bash
node build.js --validate
node build.js
```

### 2. Bulk game × style pages (matrix)

**48 pages** are generated from `scripts/matrix/game-style.json` (6 games × 8 styles):

```bash
node scripts/generate-pages.js           # write pages/generated/game-style.json
node scripts/generate-pages.js --dry-run # preview count only
node scripts/generate-pages.js --force   # overwrite all intros (destructive)
```

Output slugs look like:

- `/brawl-stars-bold-serif-names/`
- `/free-fire-fraktur-names/`
- `/valorant-small-caps-names/`

**Preserving your edits:** Re-running the generator keeps any page whose `intro` no longer contains `<!-- GENERATED -->`. Remove that marker (or rewrite the intro) when you hand-edit a generated page.

**Adding more matrix rows:**

1. Edit `scripts/matrix/game-style.json` — add a game and/or style entry.
2. Run `node scripts/generate-pages.js`.
3. Optionally hand-enrich intros for top keywords.
4. `node build.js`.

To add a **new matrix** (e.g. social × style), copy `generate-pages.js` + a new file under `scripts/matrix/`, output to `pages/generated/social-style.json`.

### 3. Validation (`node build.js --validate`)

Catches before build:

- Duplicate slugs
- Invalid slug format
- Missing title, description, h1, intro
- Intro under 80 chars plain text
- Broken `related` slugs
- Unknown `defaultPlatform` keys

Platform keys: `brawl`, `ff`, `pubg`, `valorant`, `fortnite`, `roblox`, `tiktok`, `insta`, `discord`, `x`.

Style names for `defaultStyle` must match `STYLES` in `js/glyph.js` (e.g. `"Bold Serif"`, `"Fraktur"`).

---

## Roadmap to ~500 pages

| Source | Potential pages |
|--------|-----------------|
| Current manual set | 29 |
| Game × style (live) | 48 → **77 total** |
| Add 4 more styles to matrix | +24 → 101 |
| Add Discord/Minecraft/CS2 games | +8×8 → +64 |
| Social × style matrix (new script) | ~32 |
| Symbol category pages | ~50 |
| How-to per game | ~20 |
| Long-tail one-offs in `pages/longtail.json` | rest |

Publish in batches (20–50/week). Replace `<!-- GENERATED -->` intros on pages that start ranking.

---

## Deploy to Cloudflare Pages

- **Build command:** `node build.js`
- **Output directory:** `dist`
- **Root directory:** `glyph` (if repo root is parent)

---

## Google AdSense

1. Approve site on live domain with `/privacy-policy/` and `/terms/`.
2. Uncomment AdSense script in `templates/partials/head.html`.
3. Uncomment `<ins class="adsbygoogle">` in `templates/page.html`.
4. Rebuild.

---

## Compatibility checker

Core differentiator in `js/glyph.js` — do not regress when editing styles or flair data.
