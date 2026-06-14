# Deploy Fonted to Cloudflare Pages (free)

Repo: https://github.com/ashley-playbook/fonted

## One-time Cloudflare setup (~5 min)

1. Log in at [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Authorize GitHub if prompted → select **`ashley-playbook/fonted`**
4. Configure build:

| Setting | Value |
|---------|--------|
| Production branch | `main` |
| Framework preset | None |
| **Root directory** | `glyph` |
| **Build command** | `node build.js` |
| **Build output directory** | `dist` |

5. **Environment variables** (optional but recommended):

| Variable | Value |
|----------|--------|
| `NODE_VERSION` | `20` |

6. Click **Save and Deploy**

First deploy takes ~1–2 minutes. Your site will be live at:

`https://fonted.pages.dev` (exact subdomain shown in dashboard)

## Verify after deploy

- [ ] Homepage loads and generator works
- [ ] `/brawl-stars-name-generator/` loads
- [ ] `/sitemap.xml` returns XML
- [ ] `/privacy-policy/` and `/terms/` load

## Later: custom domain

When you buy `fonted.app` on Cloudflare:

1. Pages project → **Custom domains** → add `fonted.app`
2. Confirm `glyph/pages/site.json` has `"domain": "https://fonted.app"`
3. Push any change to trigger rebuild

## Local preview

```bash
cd glyph
node build.js
npx serve dist
```

## Push updates

```bash
git add -A
git commit -m "Your message"
git push
```

Cloudflare rebuilds automatically on every push to `main`.
