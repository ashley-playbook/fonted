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

/** Per-game naming quirk — one sentence, keyed by game.key */
const GAME_NUANCE = {
  "brawl-stars":
    "Club tags show up beside your name in matches, so a readable core word matters more than stacking symbols.",
  "free-fire":
    "Kill-feed text is tiny during fights — overly ornate letters can blur together when the action speeds up.",
  "pubg-mobile":
    "Squad lobbies and the kill feed both truncate long strings, so a tight nickname usually survives UC renames better.",
  "valorant":
    "Your Riot ID splits a plain hashtag from the stylized game-name portion — only the game name accepts fancy Unicode.",
  fortnite:
    "Party invites and creator thumbnails pull from your Epic display name, so legibility at small size beats maximum decoration.",
  roblox:
    "Roblox may filter or reject display names that look like impersonation or contain blocked symbol combos — keep tags recognizable.",
};

/** Per-style rendering caveat — one sentence, keyed by style.key */
const STYLE_NUANCE = {
  "bold-serif": "Bold Serif math letters are among the most widely supported Unicode styles in mobile games.",
  "bold-script": "Script curves look great in profiles but can crowd narrow rename fields if the base word is long.",
  "fraktur":
    "Fraktur strokes are striking, yet some moderation filters treat gothic Unicode as suspicious on a fresh account.",
  "double-struck":
    "Double-struck letters can read as extra-wide on some Android clients, eating into tight character budgets faster.",
  "sans-bold": "Sans Bold stays crisp in scoreboard rows where serif flourishes would disappear.",
  "small-caps": "Small caps keep a low visual footprint, which helps when you are already near the character cap.",
  bubbles:
    "Bubble enclosed letters often render as empty boxes on older game fonts — Fonted flags them before you paste.",
  monospace: "Monospace Unicode can look like spaced letters on certain clients, so count characters after pasting.",
};

/** Plausible short base tags per game — not truncated game names */
const GAME_EXAMPLE_BASES = {
  "brawl-stars": ["Nova", "Rush", "Viper", "Myth"],
  "free-fire": ["Blaze", "Ghost", "Ace", "Rogue"],
  "pubg-mobile": ["Hawk", "Zero", "K9", "Flux"],
  "valorant": ["Sage", "Hex", "Rift", "Onyx"],
  fortnite: ["Skye", "Bolt", "Dusk", "Rift"],
  roblox: ["Pixel", "Luna", "Byte", "Echo"],
};

const OPENING_TEMPLATES = [
  (g, s) =>
    `<p>If you want a ${g.name} tag that feels ${s.vibe}, <strong>${s.name}</strong> is a solid starting point. Fonted lets you preview the full string against ${g.name} limits before you burn a rename — length, emoji risk, and symbols that box out on phone screens.</p>`,
  (g, s) =>
    `<p>${g.name} players often lean on <strong>${s.name}</strong> when they need a name that still reads ${s.vibe} in busy UI. Rather than guessing whether a copied tag will fit, you can assemble it here and let Fonted flag anything that breaks ${g.name} rules.</p>`,
  (g, s) =>
    `<p>Looking for a ${s.name.toLowerCase()} look in ${g.name}? This page defaults to that style and checks your finished tag against the quirks that trip people up — character caps, risky symbols, and paste failures on mobile.</p>`,
  (g, s) =>
    `<p><strong>${s.name}</strong> nicknames show up constantly in ${g.playerTerms[0]} and ${g.playerTerms[1]} contexts. Build yours letter-by-letter or apply the style to a short core word, then confirm it still feels ${s.vibe} before you commit in ${g.name}.</p>`,
  (g, s) =>
    `<p>A memorable ${g.name} name does not need dozens of symbols — <strong>${s.name}</strong> letters plus one clean accent often outperform a wall of decoration. Fonted's checker tells you early if the string is too long or likely to render as boxes.</p>`,
];

const MIDDLE_TEMPLATES = [
  (g, s) => {
    const limit = g.spaces
      ? `${g.spaceNote} Aim for roughly <strong>${g.maxChars} characters</strong> including spaces.`
      : `${g.spaceNote} Keep it under <strong>${g.maxChars} characters with no spaces</strong> for safer pasting.`;
    return `<p>${limit} ${GAME_NUANCE[g.key]} ${STYLE_NUANCE[s.key]}</p>`;
  },
  (g, s) => {
    const budget = g.spaces
      ? `Most players budget around <strong>${g.maxChars} characters</strong> with spaces allowed.`
      : `Treat <strong>${g.maxChars} characters, no spaces</strong> as your working limit.`;
    return `<p>${budget} ${g.spaceNote} ${STYLE_NUANCE[s.key]} Meanwhile, ${GAME_NUANCE[g.key].charAt(0).toLowerCase()}${GAME_NUANCE[g.key].slice(1)}</p>`;
  },
  (g, s) =>
    `<p>${GAME_NUANCE[g.key]} ${STYLE_NUANCE[s.key]} When you style with <strong>${s.name}</strong>, start from a short word, paste-test in the rename preview, and trim symbols if the tag feels crowded in ${g.playerTerms[2] || g.playerTerms[0]} views.</p>`,
  (g, s) => {
    const cap = g.spaces
      ? `<strong>${g.maxChars}</strong> characters (spaces count)`
      : `<strong>${g.maxChars}</strong> characters without spaces`;
    return `<p>Community testers usually plan for ${cap}. ${g.spaceNote} ${GAME_NUANCE[g.key]} For ${s.name} specifically: ${STYLE_NUANCE[s.key].charAt(0).toLowerCase()}${STYLE_NUANCE[s.key].slice(1)}</p>`;
  },
];

function hashSlug(slug) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(slug, pool) {
  return pool[hashSlug(slug) % pool.length];
}

function applyStepsParagraph(game) {
  return `<p><strong>How to apply in ${game.name}:</strong> ${game.applySteps} Always verify in-game — limits are community-tested and can change with patches.</p>`;
}

function loadExisting() {
  if (!fs.existsSync(OUT)) return {};
  const data = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const map = {};
  for (const p of data.pages || []) map[p.slug] = p;
  return map;
}

function buildIntro(game, style) {
  const slug = `${game.key}-${style.key}-names`;
  const h = hashSlug(slug);
  const opening = pick(slug, OPENING_TEMPLATES)(game, style);
  const middle = pick(slug + "|mid", MIDDLE_TEMPLATES)(game, style);
  const useMiddle = h % 3 !== 0;
  const body = useMiddle ? `${opening}\n${middle}` : opening;
  return `${GENERATED_MARKER}\n${body}\n${applyStepsParagraph(game)}`;
}

const FAQ_WORKS_VARIANTS = [
  (g, s) =>
    `Math-style ${s.name} Unicode usually renders in ${g.name}, but enclosed bubbles, zalgo stacks, and some emoji may box out. Fonted marks those before you paste.`,
  (g, s) =>
    `Most ${s.name} letters paste cleanly into ${g.name}, though rare symbol blocks and emoji can fail on older phones. Use the compatibility row to catch problem characters early.`,
  (g, s) =>
    `${s.name} is widely used in ${g.name} tags, but not every decorative block is safe — the checker highlights emoji and symbols that often show as empty boxes.`,
];

const FAQ_LIMIT_VARIANTS = [
  (g) =>
    `Community testing points to about ${g.maxChars} characters. Paste into the in-game rename field to confirm — publishers rarely show a live counter.`,
  (g) =>
    `Players generally report a ~${g.maxChars}-character cap. Treat that as a planning guide and verify in the actual rename screen before spending currency.`,
  (g) =>
    `Expect roughly ${g.maxChars} visible characters based on player reports. Official docs are vague, so always test the final string in ${g.name}.`,
];

const FAQ_SPACES_VARIANTS = [
  (g, s) =>
    g.spaces
      ? `Spaces are usually accepted in ${g.name}, but long ${s.name} strings can still truncate. Shorter cores survive renames more reliably.`
      : `Spaces often cause paste issues in ${g.name} nicknames. This page defaults to compact, no-space-friendly builds.`,
  (g, s) =>
    g.spaces
      ? `${g.name} generally allows spaces, yet styled text can push you past the practical limit faster than plain letters.`
      : `For ${g.name}, skipping spaces is the safer bet — many IGN pastes fail when a space slips in.`,
  (g, s) =>
    g.spaces
      ? `You can usually include spaces, but count every character — ${s.name} styling does not shrink the ${g.maxChars}-char budget.`
      : `No-space tags paste more reliably in ${g.name}. Build compact and test in the rename preview.`,
];

const FAQ_BAN_GAME = {
  "brawl-stars":
    "Supercell rarely bans accounts for decorative Unicode alone, but offensive or impersonating club tags can be reported. Keep names within Brawl Stars community standards.",
  "free-fire":
    "Garena typically targets harassment and cheat-related names, not math Unicode by itself. Avoid slurs and impersonation — styled IGNs are common in Free Fire lobbies.",
  "pubg-mobile":
    "PUBG Mobile moderation focuses on offensive or misleading nicknames rather than fancy letters. Unicode tags are widespread; policy violations are a separate issue.",
  valorant:
    "Riot penalizes hate speech and impersonation, not standard Unicode styling. Fraktur and script names are common; don't mimic pro player Riot IDs.",
  fortnite:
    "Epic cracks down on slurs and deceptive display names, not typical Unicode fonts. Keep your Epic name recognizable to friends in party invites.",
  roblox:
    "Roblox filters may reject names that look like staff, celebrities, or blocked phrases. Decorative letters are fine; bypassing moderation or impersonation is not.",
};

function buildFaq(game, style) {
  const slug = `${game.key}-${style.key}-names`;
  return [
    {
      q: `Does ${style.name} work in ${game.name}?`,
      a: pick(slug + "|faq-works", FAQ_WORKS_VARIANTS)(game, style),
    },
    {
      q: `What is the ${game.name} name length limit?`,
      a: pick(slug + "|faq-limit", FAQ_LIMIT_VARIANTS)(game),
    },
    {
      q: `Can I use spaces in ${game.name} with this style?`,
      a: pick(slug + "|faq-spaces", FAQ_SPACES_VARIANTS)(game, style),
    },
    {
      q: "Is styled text bannable?",
      a: FAQ_BAN_GAME[game.key],
    },
  ];
}

function buildExamples(game, style) {
  const bases = GAME_EXAMPLE_BASES[game.key];
  const h = hashSlug(`${game.key}-${style.key}-names`);
  const frames = [
    (t) => `꧁${t}꧂`,
    (t) => `★${t}★`,
    (t) => `乂${t}乂`,
    (t) => `✦${t}✦`,
  ];
  const ordered = [
    bases[h % bases.length],
    bases[(h + 1) % bases.length],
    bases[(h + 2) % bases.length],
    bases[(h + 3) % bases.length],
  ];
  return ordered.map((base, i) => frames[i % frames.length](base));
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
