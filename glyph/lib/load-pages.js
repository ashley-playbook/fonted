/**
 * Load site config + page data from pages/ directory.
 *
 * Layout:
 *   pages/site.json          — { site: { name, domain, ... } }
 *   pages/*.json             — { pages: [...] }
 *   pages/generated/*.json   — bulk-generated page batches
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PAGES_DIR = path.join(ROOT, "pages");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectPageFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectPageFiles(full, acc);
    else if (entry.name.endsWith(".json") && entry.name !== "site.json") acc.push(full);
  }
  return acc;
}

function loadPages() {
  const sitePath = path.join(PAGES_DIR, "site.json");
  if (!fs.existsSync(sitePath)) {
    throw new Error(`Missing ${sitePath} — run migration or create pages/site.json`);
  }

  const { site } = readJson(sitePath);
  const files = collectPageFiles(PAGES_DIR);
  const pages = [];
  const sources = [];

  for (const file of files.sort()) {
    const data = readJson(file);
    const batch = data.pages || [];
    if (!Array.isArray(batch)) {
      throw new Error(`${file}: expected { "pages": [...] }`);
    }
    const rel = path.relative(PAGES_DIR, file);
    batch.forEach((page, i) => {
      pages.push({ ...page, _source: `${rel}#${i}` });
    });
    sources.push({ file: rel, count: batch.length });
  }

  return { site, pages, sources };
}

module.exports = { loadPages, PAGES_DIR, ROOT };
