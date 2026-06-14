/**
 * Validate merged page data before build.
 */
const VALID_PLATFORMS = new Set([
  "brawl", "ff", "pubg", "valorant", "fortnite", "roblox", "tiktok", "insta", "discord", "x",
]);

const REQUIRED = ["type", "title", "description", "h1"];

function stripHtml(s) {
  return String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function validatePages({ site, pages }) {
  const errors = [];
  const warnings = [];

  if (!site || !site.name || !site.domain) {
    errors.push("pages/site.json: site.name and site.domain are required");
  }

  const slugSet = new Map();
  let homeCount = 0;

  for (const page of pages) {
    if (page.slug === undefined || page.slug === null) {
      errors.push(`${pageLabel(page)}: missing required field "slug" (use "" for homepage)`);
    }

    for (const field of REQUIRED) {
      if (page[field] === undefined || page[field] === null || page[field] === "") {
        errors.push(`${pageLabel(page)}: missing required field "${field}"`);
      }
    }

    if (page.slug === "") homeCount++;
    else if (page.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)) {
      errors.push(`${pageLabel(page)}: invalid slug "${page.slug}" (use lowercase kebab-case)`);
    }

    if (slugSet.has(page.slug)) {
      errors.push(`Duplicate slug "${page.slug || "(home)"}" in ${pageLabel(page)} and ${slugSet.get(page.slug)}`);
    } else {
      slugSet.set(page.slug, pageLabel(page));
    }

    if (page.type !== "legal") {
      if (!page.intro || stripHtml(page.intro).length < 80) {
        const msg = `${pageLabel(page)}: intro is missing or very short (< 80 chars plain text)`;
        if (page._needsContent) warnings.push(msg);
        else errors.push(msg);
      }
      if (!page.faq || page.faq.length < 2) {
        warnings.push(`${pageLabel(page)}: fewer than 2 FAQ items`);
      }
    }

    if (page.defaultPlatform && !VALID_PLATFORMS.has(page.defaultPlatform)) {
      errors.push(`${pageLabel(page)}: unknown defaultPlatform "${page.defaultPlatform}"`);
    }
  }

  if (homeCount !== 1) {
    errors.push(`Expected exactly 1 homepage (slug ""), found ${homeCount}`);
  }

  const allSlugs = new Set(pages.map((p) => p.slug));
  for (const page of pages) {
    for (const rel of page.related || []) {
      if (rel && !allSlugs.has(rel)) {
        errors.push(`${pageLabel(page)}: related slug "${rel}" does not exist`);
      }
    }
  }

  return { errors, warnings, ok: errors.length === 0 };
}

function pageLabel(page) {
  return page._source ? `${page._source} (${page.slug || "home"})` : page.slug || "home";
}

module.exports = { validatePages, stripHtml };
