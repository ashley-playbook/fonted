# Agent instructions (Fonted)

## Deploy model

Cloudflare builds from **git**, not local `dist/`. After any change to page content or the generator:

1. Regenerate if needed: `node scripts/generate-pages.js --force`
2. Validate + build: `node build.js --validate && node build.js`
3. **Commit and push** `pages/generated/*.json`, `scripts/`, and related source — do not wait for the user to ask.

Local `dist/` is for verification only; production updates when `main` is pushed.

## Quick ship

From `glyph/`:

```bash
npm run ship
```

Then commit and push from repo root.

## Generator preservation

- `<!-- GENERATED -->` must stay as the first line of generated intros.
- Re-run with `--force` to overwrite all 48 matrix pages after generator logic changes.
- Hand-edited pages (intro without the marker) are preserved without `--force`.
