#!/usr/bin/env node
/**
 * Static site builder for Fonted.
 * Reads pages/ + templates → emits dist/
 *
 * Usage:
 *   node build.js              # build dist/
 *   node build.js --validate   # validate only, no output
 */
const fs = require("fs");
const path = require("path");
const { loadPages } = require("./lib/load-pages");
const { validatePages } = require("./lib/validate-pages");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const TPL = path.join(ROOT, "templates");
const PARTIALS = path.join(TPL, "partials");

const validateOnly = process.argv.includes("--validate");
const { site, pages, sources } = loadPages();
const config = { site, pages };

const pageTemplate = fs.readFileSync(path.join(TPL, "page.html"), "utf8");
const partials = Object.fromEntries(
  fs.readdirSync(PARTIALS).map((f) => [path.basename(f, ".html"), fs.readFileSync(path.join(PARTIALS, f), "utf8")])
);

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => (data[key] !== undefined && data[key] !== null ? data[key] : ""));
}

function slugToDir(slug) {
  return slug ? path.join(DIST, slug) : DIST;
}

function assetPrefix(slug) {
  return slug ? "../" : "";
}

function pageUrl(slug) {
  const base = config.site.domain.replace(/\/$/, "");
  return slug ? `${base}/${slug}/` : `${base}/`;
}

function titleForPage(page) {
  return page.title || `${page.h1} | ${config.site.name}`;
}

function buildInitConfig(page) {
  const cfg = {
    defaultMode: page.defaultMode || "builder",
    defaultStyleFilter: page.defaultStyleFilter || "all",
    defaultFlairTab: page.defaultFlairTab || "symbols",
  };
  if (page.defaultPlatform) cfg.defaultPlatform = page.defaultPlatform;
  if (page.defaultInput) cfg.defaultInput = page.defaultInput;
  if (page.defaultStyle) cfg.defaultStyle = page.defaultStyle;
  return JSON.stringify(cfg);
}

function buildExamplesBlock(page) {
  if (!page.examples || !page.examples.length) return "";
  const chips = page.examples
    .map(
      (ex) =>
        `<button type="button" class="exampleChip" data-example="${escapeHtml(ex)}" aria-label="Try example ${escapeHtml(ex)}">${escapeHtml(ex)}</button>`
    )
    .join("\n      ");
  return `<section class="contentBlock examplesBlock" aria-labelledby="examples-heading">
    <h2 id="examples-heading">Example names to copy</h2>
    <p class="contentLead">Tap an example to load it in the builder. Tweak letters, then copy when the compatibility row looks good.</p>
    <div class="exampleGrid">${chips}</div>
  </section>`;
}

function buildIntroBlock(page) {
  if (!page.intro) return "";
  const intro = page.intro.replace(/<!--\s*GENERATED\s*-->/g, "");
  return `<section class="contentBlock introBlock" aria-label="About this generator">
    <div class="prose">${intro}</div>
  </section>`;
}

function buildHubBlock(page, allPages) {
  if (page.type !== "home" || !allPages) return "";
  const tools = allPages.filter((p) => p.type !== "legal" && p.slug);
  const groups = [
    { label: "Game name generators", types: ["game"] },
    { label: "Game + style combos", types: ["game-style"] },
    { label: "Social & bio fonts", types: ["social"] },
    { label: "Text style generators", types: ["style"] },
    { label: "Symbols & flair", types: ["symbol", "symbols"] },
  ];
  const sections = groups
    .map((g) => {
      const links = tools
        .filter((p) => g.types.includes(p.type))
        .map((p) => `<a href="${p.slug}/">${escapeHtml(p.h1)}</a>`)
        .join("\n          ");
      if (!links) return "";
      return `<div class="hubGroup"><h3>${g.label}</h3><div class="relatedGrid">${links}</div></div>`;
    })
    .filter(Boolean)
    .join("\n      ");
  return `<section class="contentBlock hubBlock" aria-labelledby="hub-heading">
      <h2 id="hub-heading">All generators</h2>
      <p class="contentLead">Jump to a page tuned for your platform or style — each includes platform-specific limits and copy-ready examples.</p>
      ${sections}
    </section>`;
}

function buildBreadcrumbs(page, prefix) {
  if (!page.slug) return { html: "", jsonLd: "" };
  const homeUrl = pageUrl("");
  const currentUrl = pageUrl(page.slug);
  const html = `<nav class="breadcrumbs" aria-label="Breadcrumb">
    <ol>
      <li><a href="${prefix || "./"}">Home</a></li>
      <li aria-current="page">${escapeHtml(page.h1)}</li>
    </ol>
  </nav>`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: homeUrl },
      { "@type": "ListItem", position: 2, name: page.h1, item: currentUrl },
    ],
  };
  return { html, jsonLd };
}

function buildFaq(page) {
  if (!page.faq || !page.faq.length) return { html: "", jsonLd: null };
  const items = page.faq
    .map(
      (item) => `<details class="faqItem">
      <summary><h3>${escapeHtml(item.q)}</h3></summary>
      <p>${item.a}</p>
    </details>`
    )
    .join("\n    ");
  const html = `<section class="contentBlock faqBlock" aria-labelledby="faq-heading">
    <h2 id="faq-heading">Frequently asked questions</h2>
    ${items}
  </section>`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a.replace(/<[^>]+>/g, "") },
    })),
  };
  return { html, jsonLd };
}

function buildRelated(page, allPages, prefix) {
  const slugs = page.related || [];
  if (!slugs.length) return "";
  const links = slugs
    .map((slug) => {
      const p = allPages.find((x) => x.slug === slug);
      if (!p) return "";
      const href = slug ? `${prefix}${slug}/` : `${prefix || "./"}`;
      return `<a href="${href}">${escapeHtml(p.h1)}</a>`;
    })
    .filter(Boolean)
    .join("\n        ");
  return `<section class="relatedBlock" aria-labelledby="related-heading">
      <h2 id="related-heading">Related generators</h2>
      <div class="relatedGrid">${links}</div>
    </section>`;
}

function buildJsonLd(page, breadcrumbsJsonLd, faqJsonLd) {
  const blocks = [];
  if (breadcrumbsJsonLd) blocks.push(breadcrumbsJsonLd);
  if (faqJsonLd) blocks.push(faqJsonLd);
  if (page.type === "home") {
    blocks.unshift({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: config.site.name,
      url: pageUrl(""),
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: page.description,
    });
  }
  if (!blocks.length) return "";
  return blocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`).join("\n");
}

function buildOgTags(page, canonicalUrl) {
  const image = config.site.domain.replace(/\/$/, "") + (config.site.defaultOgImage || "/static/og-default.png");
  return `<meta property="og:type" content="website">
<meta property="og:site_name" content="${escapeHtml(config.site.name)}">
<meta property="og:title" content="${escapeHtml(titleForPage(page))}">
<meta property="og:description" content="${escapeHtml(page.description)}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(titleForPage(page))}">
<meta name="twitter:description" content="${escapeHtml(page.description)}">
<meta name="twitter:image" content="${image}">`;
}

function cssVersion() {
  const cssPath = path.join(ROOT, "css", "glyph.css");
  return Math.floor(fs.statSync(cssPath).mtimeMs / 1000).toString();
}

function buildLegalPage(page) {
  const prefix = assetPrefix(page.slug);
  const canonicalUrl = pageUrl(page.slug);
  const head = render(partials.head, {
    title: titleForPage(page),
    description: page.description,
    canonicalUrl,
    assetPrefix: prefix,
    cssVersion: cssVersion(),
    extraHead: buildOgTags(page, canonicalUrl),
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
${head}
</head>
<body>
${render(partials.header, { siteName: config.site.name, homeHref: prefix || "./" })}
<main class="wrap legalPage">
  ${render(partials.breadcrumbs, { breadcrumbsHtml: buildBreadcrumbs(page, prefix).html })}
  <article class="contentBlock prose">
    <h1>${escapeHtml(page.h1)}</h1>
    ${page.intro}
  </article>
</main>
${render(partials.footer, {
  siteName: config.site.name,
  assetPrefix: prefix,
  relatedBlock: "",
})}
</body>
</html>`;
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

function rmDist() {
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function buildPage(page, allPages) {
  if (page.type === "legal") {
    const html = buildLegalPage(page);
    const outDir = slugToDir(page.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html);
    return;
  }

  const prefix = assetPrefix(page.slug);
  const canonicalUrl = pageUrl(page.slug);
  const crumbs = buildBreadcrumbs(page, prefix);
  const faq = buildFaq(page);
  const jsonLd = buildJsonLd(page, crumbs.jsonLd, faq.jsonLd);
  const extraHead = buildOgTags(page, canonicalUrl) + "\n" + jsonLd;
  const head = render(partials.head, {
    title: titleForPage(page),
    description: page.description,
    canonicalUrl,
    assetPrefix: prefix,
    cssVersion: cssVersion(),
    extraHead,
  });

  const relatedBlock = buildRelated(page, allPages, prefix);
  const contentBlock = buildIntroBlock(page) + buildExamplesBlock(page);
  const hubBlock = buildHubBlock(page, allPages);

  const html = render(pageTemplate, {
    head,
    header: render(partials.header, { siteName: config.site.name, homeHref: prefix || "./" }),
    breadcrumbs: render(partials.breadcrumbs, { breadcrumbsHtml: crumbs.html }),
    eyebrow: page.eyebrow || config.site.tagline,
    h1Html: page.h1Html || escapeHtml(page.h1),
    sub: page.sub || "",
    contentBlock,
    hubBlock,
    faq: render(partials.faq, { faqSectionHtml: faq.html }),
    footer: render(partials.footer, {
      siteName: config.site.name,
      assetPrefix: prefix,
      relatedBlock,
    }),
    assetPrefix: prefix,
    initConfig: buildInitConfig(page),
    extraScripts: `<script src="${prefix}js/examples.js" defer></script>\n<script src="${prefix}js/ads.js" defer></script>`,
  });

  const outDir = slugToDir(page.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html);
}

function buildSitemap(pages) {
  const urls = pages.map((p) => {
    const loc = pageUrl(p.slug);
    const priority = p.type === "home" ? "1.0" : p.type === "game-style" ? "0.7" : "0.8";
    return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

function buildRobots() {
  const base = config.site.domain.replace(/\/$/, "");
  return `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`;
}

function runValidate() {
  const { errors, warnings, ok } = validatePages(config);
  console.log(`Loaded ${pages.length} pages from ${sources.length} files:`);
  sources.forEach((s) => console.log(`  ${s.file} (${s.count})`));
  if (warnings.length) {
    console.log("\nWarnings:");
    warnings.forEach((w) => console.log("  ⚠", w));
  }
  if (errors.length) {
    console.log("\nErrors:");
    errors.forEach((e) => console.log("  ✗", e));
    process.exit(1);
  }
  console.log(ok ? "\nValidation passed." : "");
}

function main() {
  runValidate();
  if (validateOnly) return;

  console.log("\nBuilding Fonted static site…");
  rmDist();

  copyRecursive(path.join(ROOT, "css"), path.join(DIST, "css"));
  copyRecursive(path.join(ROOT, "js"), path.join(DIST, "js"));
  copyRecursive(path.join(ROOT, "static"), path.join(DIST, "static"));

  for (const page of pages) {
    buildPage(page, pages);
    console.log("  ✓", page.slug || "/");
  }

  fs.writeFileSync(path.join(DIST, "sitemap.xml"), buildSitemap(pages));
  fs.writeFileSync(path.join(DIST, "robots.txt"), buildRobots());

  console.log(`Done — ${pages.length} pages → dist/`);
}

main();
