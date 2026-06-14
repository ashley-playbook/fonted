#!/usr/bin/env node
/**
 * Generate game × style landing pages into pages/generated/game-style.json
 *
 * Usage:
 *   node scripts/generate-pages.js           # write / merge generated pages
 *   node scripts/generate-pages.js --dry-run   # print count only
 *   node scripts/generate-pages.js --force     # overwrite intros (keep manual edits lost)
 *
 * Preserves existing page objects when slug matches and intro was hand-edited
 * (intro does not contain "<!-- GENERATED -->").
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MATRIX = path.join(__dirname, "matrix/game-style.json");
const OUT = path.join(ROOT, "pages/generated/game-style.json");

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const GENERATED_MARKER = "<!-- GENERATED -->";

const matrix = JSON.parse(fs.readFileSync(MATRIX, "utf8"));

function loadExisting() {
  if (!fs.existsSync(OUT)) return {};
  const data = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const map = {};
  for (const p of data.pages || []) map[p.slug] = p;
  return map;
}

function buildIntro(game, style) {
  const spaceLine = game.spaces
    ? `${game.spaceNote} Plan for roughly <strong>${game.maxChars} characters</strong> total.`
    : `${game.spaceNote} Target <strong>${game.maxChars} characters, no spaces</strong> for safer pasting.`;

  return `${GENERATED_MARKER}
<p><strong>${style.name}</strong> letters are a popular pick for ${game.name} players who want a tag that reads ${style.vibe}. Unlike generic font sites, Fonted pre-checks your assembled string against ${game.name} limits before you spend a rename — length, emoji risk, and symbols that box out on mobile.</p>
<p>${spaceLine} ${game.playerTerms.slice(0, 2).join(" and ")} contexts reward names that stay legible at small size. Start with a short core word, apply ${style.name} to the whole string or mix per-letter in the builder, then add at most one framing symbol if you need extra flair.</p>
<p><strong>How to apply in ${game.name}:</strong> ${game.applySteps} Always verify in-game — limits are community-tested and can change with patches.</p>`;
}

function buildExamples(game, style) {
  const core = game.key === "free-fire" ? "ff" : game.key.split("-")[0].slice(0, 4);
  return [
    `꧁${core}꧂`,
    `★${core}★`,
    `${core}`,
    `꧁${style.name.split(" ")[0]}꧂`,
  ];
}

function buildFaq(game, style) {
  return [
    {
      q: `Does ${style.name} work in ${game.name}?`,
      a: `Math-style ${style.name} Unicode usually renders in ${game.name}, but bubbles, zalgo, and some emoji may box out. Fonted flags risky characters before you paste.`,
    },
    {
      q: `What is the ${game.name} name length limit?`,
      a: `Community testing suggests about ${game.maxChars} characters. Paste into the in-game field to confirm — official docs rarely publish a live counter.`,
    },
    {
      q: `Can I use spaces in ${game.name} with this style?`,
      a: game.spaces
        ? `Spaces are generally accepted, but long styled strings can still truncate. Shorter names with ${style.name} letters tend to survive renames.`
        : `Spaces are risky for ${game.name} nicknames. This generator defaults to compact, no-space-friendly builds.`,
    },
    {
      q: "Is styled text bannable?",
      a: `Decorative Unicode is widely used and rarely banned on its own. Offensive content or impersonation is a separate issue — keep names within platform terms.`,
    },
  ];
}

function buildRelated(game, style, allSlugs) {
  const otherStyle = matrix.styles.find((s) => s.key !== style.key);
  const related = [
    game.baseSlug,
    style.stylePage,
    otherStyle ? `${game.key}-${otherStyle.key}-names` : null,
    `${matrix.games.find((g) => g.key !== game.key)?.key || "brawl-stars"}-${style.key}-names`,
    "star-symbols",
    "cool-symbols-copy-paste",
  ];
  return [...new Set(related.filter(Boolean))].filter((s) => allSlugs.has(s)).slice(0, 6);
}

function generatePage(game, style) {
  const slug = `${game.key}-${style.key}-names`;
  return {
    slug,
    type: "game-style",
    title: `${game.name} ${style.name} Names — Copy Paste Generator | Fonted`,
    description: `Create ${game.name} names in ${style.name} Unicode. Live checker validates ~${game.maxChars} chars${game.spaces ? "" : ", no spaces"}, and flags symbols that box out.`,
    h1: `${game.name} ${style.name} names`,
    h1Html: `${game.name} <em>${style.name}</em> names`,
    eyebrow: `${game.name} · ${style.name} · ~${game.maxChars} chars`,
    sub: `Generate ${style.name.toLowerCase()} nicknames tuned for ${game.name} — with compatibility checks before you rename.`,
    intro: buildIntro(game, style),
    defaultMode: "builder",
    defaultPlatform: game.platform,
    defaultStyle: style.defaultStyle,
    defaultFlairTab: "symbols",
    defaultInput: game.key === "free-fire" ? "ff" : game.key.split("-")[0].slice(0, 5),
    examples: buildExamples(game, style),
    faq: buildFaq(game, style),
    related: [],
    _generated: true,
    _matrix: `${game.key}×${style.key}`,
  };
}

function main() {
  const existing = loadExisting();
  const pages = [];
  const allSlugs = new Set(matrix.games.map((g) => g.baseSlug));
  matrix.styles.forEach((s) => allSlugs.add(s.stylePage));

  for (const game of matrix.games) {
    for (const style of matrix.styles) {
      const slug = `${game.key}-${style.key}-names`;
      allSlugs.add(slug);
    }
  }

  let preserved = 0;
  let created = 0;

  for (const game of matrix.games) {
    for (const style of matrix.styles) {
      const fresh = generatePage(game, style);
      fresh.related = buildRelated(game, style, allSlugs);

      const prev = existing[fresh.slug];
      if (prev && !force && prev.intro && !prev.intro.includes(GENERATED_MARKER)) {
        pages.push({ ...prev, related: prev.related?.length ? prev.related : fresh.related });
        preserved++;
      } else if (prev && !force) {
        pages.push({ ...fresh, intro: prev.intro, faq: prev.faq?.length >= 3 ? prev.faq : fresh.faq, examples: prev.examples?.length ? prev.examples : fresh.examples });
        preserved++;
      } else {
        pages.push(fresh);
        created++;
      }
    }
  }

  pages.sort((a, b) => a.slug.localeCompare(b.slug));

  console.log(`Game × style matrix: ${matrix.games.length} games × ${matrix.styles.length} styles = ${pages.length} pages`);
  console.log(`  new/updated templates: ${created}, preserved edits: ${preserved}`);

  if (dryRun) {
    console.log("Dry run — no files written.");
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ pages }, null, 2) + "\n");
  console.log(`Wrote ${OUT}`);
  console.log("Next: node build.js --validate && node build.js");
}

main();
