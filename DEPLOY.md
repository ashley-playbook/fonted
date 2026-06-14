# Deploy Fonted to Cloudflare (free)

Repo: https://github.com/ashley-playbook/fonted

Cloudflare now deploys static sites through **Workers & Pages** with a build + `wrangler deploy` flow. This repo includes `glyph/wrangler.jsonc` for that.

---

## From the empty “Workers & Pages” screen

1. Click the blue **Create application** button.
2. Choose **Get started** (or **Connect to Git** / **Import a repository**).
3. Connect **GitHub** if prompted → select **`ashley-playbook/fonted`**.
4. On **Set up your application**, use:

| Setting | Value |
|---------|--------|
| **Project name** | `fonted` |
| **Root directory** | *(leave blank — repo root)* |
| **Build command** | `npm run build` |
| **Deploy command** | `npm exec --prefix glyph -- wrangler deploy` |
| **Production branch** | `main` |

5. **Environment variables** (recommended):

| Name | Value |
|------|--------|
| `NODE_VERSION` | `20` |

6. Save / Deploy.

Live URL will look like **`https://fonted.<account>.workers.dev`** (shown in dashboard after first deploy).

---

## What each command does

1. **`npm install`** — installs `wrangler` (listed in `glyph/package.json`).
2. **`node build.js`** — validates + writes 77 static pages to `glyph/dist/`.
3. **`npx wrangler deploy`** — uploads `dist/` using `glyph/wrangler.jsonc`.

---

## Verify after deploy

- [ ] `https://YOUR-URL/` — homepage + generator works
- [ ] `/brawl-stars-name-generator/` — game page loads
- [ ] `/sitemap.xml` — XML sitemap
- [ ] `/privacy-policy/` and `/terms/` — legal pages

---

## If build fails

| Error | Fix |
|-------|-----|
| `Cannot find module` | Set root directory to **`glyph`** |
| `dist` not found | Build command must run **`node build.js`** before deploy |
| Wrangler auth | First deploy via dashboard handles auth; CI uses Cloudflare token automatically |
| Node too old | Add env var `NODE_VERSION` = `20` |

---

## Later: custom domain `fonted.app`

1. Workers & Pages → **fonted** → **Settings** → **Domains & Routes** → add `fonted.app`
2. Confirm `glyph/pages/site.json` has `"domain": "https://fonted.app"`
3. Push to `main` to rebuild

---

## Local preview

```bash
cd glyph
npm install
node build.js
npx serve dist
```

## Push updates

```bash
git add -A && git commit -m "Update pages" && git push
```

Cloudflare rebuilds on every push to `main`.
