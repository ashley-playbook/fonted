/**
 * Fonted fancy-text / username generator engine.
 * Extracted from glyph.html prototype — behavior must stay in sync.
 */
(function () {
  "use strict";

  const DEFAULTS = {
    defaultMode: "builder",
    defaultStyleFilter: "all",
    defaultStyle: null,
    defaultPlatform: null,
    defaultFlairTab: "symbols",
    defaultInput: "",
  };

  function init(userConfig) {
    const config = { ...DEFAULTS, ...(userConfig || {}) };
    let defaultStyleName = config.defaultStyle || null;

/* ---------- Unicode style maps ---------- */
const L="abcdefghijklmnopqrstuvwxyz", U="ABCDEFGHIJKLMNOPQRSTUVWXYZ", D="0123456789";
function map(lower,upper,digits){
  const m={};
  [...L].forEach((c,i)=>m[c]=lower?[...lower][i]:c);
  [...U].forEach((c,i)=>m[c]=upper?[...upper][i]:c);
  if(digits)[...D].forEach((c,i)=>m[c]=[...digits][i]);
  return t=>[...t].map(ch=>m[ch]??ch).join("");
}
const comb = codes => t => [...t].map(ch=>/\s/.test(ch)?ch:ch+codes.map(c=>String.fromCharCode(c)).join("")).join("");

const STYLES = [
  {n:"Bold Serif",g:"fancy",f:map("𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳","𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙","𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗")},
  {n:"Italic Serif",g:"fancy",f:map("𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧","𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍")},
  {n:"Bold Italic",g:"fancy",f:map("𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛","𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁")},
  {n:"Script",g:"fancy",f:map("𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏","𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵")},
  {n:"Bold Script",g:"fancy",f:map("𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃","𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩")},
  {n:"Fraktur",g:"fancy",f:map("𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷","𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ")},
  {n:"Bold Fraktur",g:"fancy",f:map("𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟","𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅")},
  {n:"Double Struck",g:"fancy",f:map("𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫","𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ","𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡")},
  {n:"Monospace",g:"fancy",f:map("𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣","𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉","𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿")},
  {n:"Sans Bold",g:"fancy",f:map("𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇","𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭","𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵")},
  {n:"Sans Italic",g:"fancy",f:map("𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻","𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡")},

  {n:"Small Caps",g:"aesthetic",f:map("ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘQʀꜱᴛᴜᴠᴡxʏᴢ",null)},
  {n:"Superscript",g:"aesthetic",f:map("ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ","ᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁⱽᵂˣʸᶻ","⁰¹²³⁴⁵⁶⁷⁸⁹")},
  {n:"Wide",g:"aesthetic",f:map("ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ","ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ","０１２３４５６７８９")},
  {n:"Bubbles",g:"aesthetic",f:map("ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ","ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ","⓪①②③④⑤⑥⑦⑧⑨")},
  {n:"Dark Bubbles",g:"aesthetic",f:map("🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩","🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩")},
  {n:"Squares",g:"aesthetic",f:map("🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉","🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉")},
  {n:"Dark Squares",g:"aesthetic",f:map("🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉","🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉")},

  {n:"Strikethrough",g:"fun",f:comb([0x0336])},
  {n:"Underline",g:"fun",f:comb([0x0332])},
  {n:"Slashed",g:"fun",f:comb([0x0337])},
  {n:"Glitch",g:"fun",f:comb([0x0317,0x0316,0x0301])},
  {n:"Zalgo",g:"fun",f:comb([0x030d,0x0322,0x0489,0x0316])},
  {n:"Cyrillic",g:"fun",f:map("аъсↁёfgнійкlмиортqяѕтцvшхує","ДБↂↁЁҒGНİЈКↃМЙФРQЯЅↁЦVЩЖЧZ")},
  {n:"Greek-ish",g:"fun",f:map("αβςδεφgнιנкlмησρqяѕτυvωχγz","ΛβᄃDΣ₣GΗIJKᄂMПФ尸QЯƧƬUᏉШXYZ")},
  {n:"Currency",g:"fun",f:map("₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩ӾɎⱫ","₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩ӾɎⱫ")},
  {n:"Upside Down",g:"fun",f:t=>{const m={a:"ɐ",b:"q",c:"ɔ",d:"p",e:"ǝ",f:"ɟ",g:"ƃ",h:"ɥ",i:"ı",j:"ɾ",k:"ʞ",l:"l",m:"ɯ",n:"u",o:"o",p:"d",q:"b",r:"ɹ",s:"s",t:"ʇ",u:"n",v:"ʌ",w:"ʍ",x:"x",y:"ʎ",z:"z","?":"¿","!":"¡"};return [...t.toLowerCase()].map(c=>m[c]??c).reverse().join("")}},
];

const WRAPS=[
  {n:"Stars",g:"aesthetic",pre:"⋆˚｡⋆ ",post:" ⋆˚｡⋆"},
  {n:"Hearts",g:"aesthetic",pre:"♡ ",post:" ♡"},
  {n:"Sparkle",g:"aesthetic",pre:"✦ ",post:" ✦"},
  {n:"Brackets",g:"fun",pre:"⟦ ",post:" ⟧"},
  {n:"Arrows",g:"fun",pre:"➤ ",post:""},
];
WRAPS.forEach(w=>STYLES.push({n:w.n,g:w.g,f:t=>w.pre+t+w.post}));

/* Per-letter variant fonts (single-glyph transforms only — no wraps/decorators) */
const GLYPH_FONTS = STYLES.filter(s=>!/Zalgo|Glitch|Strikethrough|Underline|Slashed|Stars|Hearts|Sparkle|Brackets|Arrows|Upside Down/.test(s.n));

/* ---------- Flair ----------
   symbols / emojis: single characters inserted at the cursor, anywhere in the name.
   templates: bookend combos that wrap the whole assembled name (left + right). */
const FLAIR = {
  symbols:["★","☆","✦","✧","✩","✪","✫","✬","✭","✮","✯","⋆","✰","⍣","❂","❉","❊","❋","✿","❀","✾","❁","✽","✼","花","☘","♧","♣","♪","♫","♬","☀","☼","☾","☽","☪","✺","❄","❅","❆","✠","✟","✞","⚜","⚝","☯","⚡","☢","☣","♛","♕","♔","♚","♖","♜","♝","♞","☬","✘","✗","✓","✔","➳","➤","➢","➣","↬","↫","⊰","⊱","「","」","『","』","【","】","〖","〗","꧁","꧂","≪","≫","«","»","↤","↦","•","◦","°","·","ᵔ","ღ","♡","♥","❤","❥","ⓥ","☓","ϟ","ζ","彡","シ","ツ","乡","々"],
  emojis:["🔥","💀","⚡","👑","🌸","🦋","🥀","🍒","💜","🖤","🤍","⭐","✨","💫","🌙","☠️","🐉","🦅","🎮","🕹️","💎","⚔️","🏆","🌹","🍓","🫧","🪐","☁️","🌈","💥","🩸","😈","💯","🎯","🌟","💖","🐺","🦊","👻","🤡","🌷","🍡","🧸","🐰","🐱","🍰","🌻","🪷","🫶","💋"],
  templates:[
    {l:"▄︻デ═━一",     r:"一━═テ︻▄",     name:"Gun"},
    {l:"꧁",            r:"꧂",            name:"Royal"},
    {l:"『",           r:"』",           name:"Corner brackets"},
    {l:"【",           r:"】",           name:"Lenticular"},
    {l:"「",           r:"」",           name:"Half brackets"},
    {l:"✦•·",          r:"·•✦",          name:"Sparkle dots"},
    {l:"╰☆╮",          r:"╰☆╮",          name:"Star tag"},
    {l:"⊰",            r:"⊱",            name:"Leaf"},
    {l:"≪",            r:"≫",            name:"Chevrons"},
    {l:"꒰",            r:"꒱",            name:"Soft"},
    {l:"⫷",            r:"⫸",            name:"Wedge"},
    {l:"•°",           r:"°•",           name:"Bubbles"},
    {l:"✟",            r:"✟",            name:"Cross"},
    {l:"♡⃛",           r:"♡⃛",           name:"Floaty heart"},
    {l:"˚｡⋆",          r:"⋆｡˚",          name:"Twinkle"},
    {l:"‧₊˚",          r:"˚₊‧",          name:"Stardust"},
    {l:"⟡",            r:"⟡",            name:"Gem"},
    {l:"꒷꒦",           r:"꒦꒷",           name:"Wave"},
    {l:"⋅˚₊‧ ୨",       r:"୧ ‧₊˚⋅",       name:"Petal frame"},
    {l:"♡｡",           r:"｡♡",           name:"Heart dot"},
    {l:"˗ˏˋ",          r:"ˎˊ˗",          name:"Quote dash"},
    {l:"⊹˚",           r:"˚⊹",           name:"Cross sparkle"},
    {l:"𓆉",            r:"𓆉",            name:"Turtle"},
    {l:"⋆꙳",           r:"꙳⋆",           name:"Snow star"},
    {l:"❀｡",           r:"｡❀",           name:"Bloom dot"},
    {l:"♪♬",           r:"♬♪",           name:"Music"},
  ]
};

/* ---------- Shared ---------- */
const field=document.getElementById("field"),
      results=document.getElementById("results"),
      builder=document.getElementById("builder"),
      countEl=document.getElementById("count"),
      toast=document.getElementById("toast"),
      styleControls=document.getElementById("styleControls"),
      paneStyles=document.getElementById("paneStyles"),
      paneBuilder=document.getElementById("paneBuilder");
let filter="all", mode="styles";
let letterChoices=[]; // index of GLYPH_FONTS per character position
let flairLeft="", flairRight=""; // chosen template affixes (raw strings)
let caretPos=null; // last known caret index in the field (code-unit based)
let flairTab="symbols"; // which flair tab is open (persists across re-renders)

const COPY_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const CHECK_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

function escapeHtml(s){return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}

/* ---------- Mode A: whole-word styles ---------- */
function renderStyles(){
  const raw=field.value||"player";
  let list=STYLES.filter(s=>filter==="all"||s.g===filter);
  if(defaultStyleName){
    const idx=list.findIndex(s=>s.n===defaultStyleName);
    if(idx>0){const[item]=list.splice(idx,1);list.unshift(item);}
  }
  countEl.textContent=`${list.length} styles`;
  results.innerHTML="";
  list.forEach((s,i)=>{
    const out=s.f(raw);
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`<span class="name">${s.n}</span><div class="out">${escapeHtml(out)}</div><button class="copybtn" aria-label="Copy ${s.n}">${COPY_ICON}</button>`;
    card.onclick=()=>copy(out,card,"card");
    results.appendChild(card);
    if(i===5){
      const ad=document.createElement("div");
      ad.className="adInline";
      ad.innerHTML='<span class="tag">Ad</span><div class="adbox" style="min-height:90px">In-feed native ad · responsive (AdSense)</div>';
      results.appendChild(ad);
    }
  });
}

/* ---------- Mode B: per-letter builder ---------- */
function syncLetterChoices(){
  const chars=[...(field.value||"")];
  // keep existing choices where possible
  letterChoices=chars.map((c,i)=>letterChoices[i]??0);
}

const STYLABLE=/[a-zA-Z0-9]/;
function glyphFor(ch,fontIdx){
  if(!STYLABLE.test(ch)) return ch; // spaces, symbols, emojis pass through untouched
  return GLYPH_FONTS[fontIdx].f(ch);
}

function assembledString(){
  const core=[...(field.value||"")].map((c,i)=>glyphFor(c,letterChoices[i]??0)).join("");
  if(!core) return "";
  const lead = flairLeft ? flairLeft+" " : "";
  const trail = flairRight ? " "+flairRight : "";
  return lead+core+trail;
}

/* ---------- Game / platform compatibility ----------
   Grounded in documented behavior (mid-2026). Char limits and Unicode tolerance
   are well-attested estimates, not official guarantees:
   - Games (Brawl Stars 15, Free Fire 12, PUBG Mobile 15, Valorant 16, Fortnite 16,
     Roblox display 20): support Unicode math fonts + ꧁꧂ brackets, but complex emoji
     and obscure/decorative blocks often render as boxes. Free Fire / PUBG / Roblox
     don't take native spaces.
   - Social (TikTok display 30, Instagram 30, Discord 32, X 50): full Unicode + emoji.
     Discord flags decorative blocks since fraktur/double-struck box out on some
     Android/web clients. (TikTok @handle is plain ASCII; this checks the display name.)
   We classify each codepoint and flag length, emoji, risky symbols, and spaces. */
const PLATFORMS=[
  {key:"brawl",  name:"Brawl Stars",   max:15, emoji:"risky", risky:"risky", space:true},
  {key:"ff",     name:"Free Fire",     max:12, emoji:"risky", risky:"risky", space:false},
  {key:"pubg",   name:"PUBG Mobile",   max:15, emoji:"risky", risky:"risky", space:false},
  {key:"valorant",name:"Valorant",     max:16, emoji:"risky", risky:"risky", space:true},
  {key:"fortnite",name:"Fortnite",     max:16, emoji:"risky", risky:"risky", space:true},
  {key:"roblox", name:"Roblox name",   max:20, emoji:"risky", risky:"risky", space:false},
  {key:"tiktok", name:"TikTok name",   max:30, emoji:"ok",    risky:"ok",    space:true},
  {key:"insta",  name:"Instagram",     max:30, emoji:"ok",    risky:"ok",    space:true},
  {key:"discord",name:"Discord",       max:32, emoji:"ok",    risky:"risky", space:true},
  {key:"x",      name:"X / Twitter",   max:50, emoji:"ok",    risky:"ok",    space:true},
];

function isEmoji(cp){
  return (cp>=0x1F300&&cp<=0x1FAFF)||(cp>=0x2600&&cp<=0x27BF)|| // misc symbols, dingbats, emoji blocks
         (cp>=0x1F000&&cp<=0x1F2FF)||cp===0x2B50||cp===0x2764||
         (cp>=0x1F1E6&&cp<=0x1F1FF); // regional indicators
}
// "Risky" = decorative blocks games often fail to render: enclosed alphanumerics,
// CJK-style decorations, rare symbol blocks. Math alphanumerics are treated as SAFE.
function isRisky(cp){
  if(cp>=0x1D400&&cp<=0x1D7FF) return false; // Mathematical Alphanumeric Symbols = safe
  if(cp>=0x2460&&cp<=0x24FF) return true;    // enclosed alphanumerics (bubbles)
  if(cp>=0x1F100&&cp<=0x1F1FF) return true;  // enclosed alphanumeric supplement (squares/dark)
  if(cp>=0x1F130&&cp<=0x1F19F) return true;  // squared latin
  if(cp>=0xA900&&cp<=0xA92F) return true;    // kayah li (꧁꧂ are 0xA9C1/0xA9C2 nearby)
  if(cp===0xA9C1||cp===0xA9C2) return false; // ꧁ ꧂ are widely supported in games — safe
  if(cp>=0x0300&&cp<=0x036F) return true;    // combining diacritics (zalgo-ish)
  if(cp>=0x13000&&cp<=0x1342F) return true;  // egyptian hieroglyphs (𓆉 etc.)
  if(cp>=0xA67C&&cp<=0xA67D) return true;    // combining cyrillic marks
  return false;
}

/* Analyze the name per source-character so we can point at the culprit. */
function analyzeChars(){
  const src=[...(field.value||"")];
  const parts=[];
  src.forEach((ch,idx)=>{
    const g=glyphFor(ch,letterChoices[idx]??0);
    const cps=[...g].map(c=>c.codePointAt(0));
    parts.push({idx, raw:ch, glyph:g, emoji:cps.some(isEmoji), risky:cps.some(isRisky), space:/\s/.test(ch)});
  });
  if(flairLeft){const cps=[...flairLeft].map(c=>c.codePointAt(0));parts.unshift({idx:-1,raw:flairLeft,glyph:flairLeft,emoji:cps.some(isEmoji),risky:cps.some(isRisky),space:true,tmpl:true});}
  if(flairRight){const cps=[...flairRight].map(c=>c.codePointAt(0));parts.push({idx:-2,raw:flairRight,glyph:flairRight,emoji:cps.some(isEmoji),risky:cps.some(isRisky),space:true,tmpl:true});}
  return parts;
}

function checkCompatibility(){
  const s=assembledString();
  const len=[...s].length;
  const parts=analyzeChars();
  const emojiParts=parts.filter(p=>p.emoji);
  const riskyParts=parts.filter(p=>p.risky);
  const hasSpace=/\s/.test(s) || (flairLeft||flairRight);
  return PLATFORMS.map(p=>{
    const issues=[];
    if(len>p.max) issues.push({msg:`Over ${p.max}-char limit (${len})`, idxs:[]});
    if(emojiParts.length && p.emoji==="risky")
      issues.push({msg:`Emoji may not display: ${emojiParts.map(x=>x.glyph).join(" ")}`, idxs:emojiParts.map(x=>x.idx)});
    if(riskyParts.length && p.risky==="risky")
      issues.push({msg:`May box out: ${riskyParts.map(x=>x.glyph).join(" ")}`, idxs:riskyParts.map(x=>x.idx)});
    if(hasSpace && !p.space) issues.push({msg:"Spaces not supported", idxs:[]});
    let level="good";
    if(issues.some(i=>i.msg.includes("limit")||i.msg.includes("Spaces"))) level="bad";
    else if(issues.length) level="warn";
    return {...p, level, issues, len, parts};
  });
}

function renderCompatRow(){
  const wrap=document.createElement("div");
  wrap.className="compat";
  const checks=checkCompatibility();
  const ICON={good:"✓",warn:"!",bad:"✕"};
  wrap.innerHTML=`<span class="compatLbl">Works in</span>`;
  const chips=document.createElement("div");
  chips.className="compatChips";
  checks.forEach(c=>{
    const chip=document.createElement("button");
    chip.className=`compatChip ${c.level}`;
    chip.dataset.key=c.key;
    chip.innerHTML=`<span class="ci">${ICON[c.level]}</span>${c.name}`;
    chip.title = c.issues.length ? c.issues.map(i=>i.msg).join(" · ") : "Looks good";
    chip.onclick=()=>{
      const wasActive=chip.classList.contains("active");
      wrap.querySelectorAll(".compatChip.active").forEach(x=>x.classList.remove("active"));
      let d=wrap.querySelector(".compatDetail"); if(d) d.remove();
      if(wasActive) return; // toggle off
      chip.classList.add("active");
      d=document.createElement("div");
      d.className="compatDetail";d.dataset.k=c.key;
      if(c.issues.length){
        d.innerHTML=`<b>${c.name}</b>`+c.issues.map(i=>`<div class="issueLine">${escapeHtml(i.msg)}</div>`).join("");
      }else{
        d.innerHTML=`<b>${c.name}</b><div class="issueLine">Renders cleanly — ${c.len}/${c.max} characters.</div>`;
      }
      wrap.appendChild(d);
    };
    chips.appendChild(chip);
  });
  wrap.appendChild(chips);

  const note=document.createElement("div");
  note.className="compatNote";
  note.innerHTML="Estimates, not guarantees — games and devices vary. Always test the name in-game before saving.";
  wrap.appendChild(note);
  return wrap;
}

/* Insert a flair character into the username at the caret (or at the end).
   Works on the array-of-codepoints model so emojis count as one position,
   and shifts letterChoices to keep existing letters' fonts intact. */
function insertFlair(str){
  const chars=[...(field.value||"")];
  // map the field's code-unit caret to a codepoint index
  let cp = caretPos==null ? chars.length : codeUnitToCodepoint(field.value, caretPos);
  cp=Math.max(0,Math.min(cp,chars.length));
  chars.splice(cp,0,str);
  // shift font choices so letters after the insert keep their font
  letterChoices.splice(cp,0,0);
  field.value=chars.join("");
  // place caret right after the inserted glyph
  const newUnit=codepointToCodeUnit(field.value, cp+1);
  caretPos=newUnit;
  renderBuilder();
  // restore focus + caret to the field for continued typing
  field.focus();
  try{field.setSelectionRange(newUnit,newUnit);}catch(e){}
}
function codeUnitToCodepoint(s,unit){let cp=0,i=0;for(const ch of s){if(i>=unit)break;i+=ch.length;cp++;}return cp;}
function codepointToCodeUnit(s,cpIdx){let i=0,cp=0;for(const ch of s){if(cp>=cpIdx)break;i+=ch.length;cp++;}return i;}

function renderBuilder(){
  syncLetterChoices();
  builder.innerHTML="";
  const chars=[...(field.value||"")];

  // assembled preview bar (sticky)
  const bar=document.createElement("div");
  bar.className="assembled";
  const asm=assembledString();
  bar.innerHTML=`<span class="lbl">Result</span>
    <div class="res">${asm? escapeHtml(asm) : '<span class="ph">Type a username above…</span>'}</div>
    <button class="bigcopy" id="bigcopy">${COPY_ICON}<span>Copy</span></button>`;
  builder.appendChild(bar);
  bar.querySelector("#bigcopy").onclick=()=>{
    const btn=bar.querySelector("#bigcopy");
    copy(assembledString(),btn,"big");
  };

  // compatibility row (only when there's a name)
  if(asm){
    builder.appendChild(renderCompatRow());
  }

  if(!chars.filter(c=>STYLABLE.test(c)).length){
    const e=document.createElement("div");
    e.className="builderEmpty";
    e.textContent="Type a username above, then style each letter and drop in symbols or emojis.";
    builder.appendChild(e);
    builder.appendChild(renderFlairSection());
    return;
  }

  // quick-apply row: set ALL letters to one font fast
  const qa=document.createElement("div");
  qa.className="quickApply";
  qa.innerHTML=`<span style="font-size:13px;color:var(--ink-soft);align-self:center;font-weight:600">Apply to all:</span>`;
  GLYPH_FONTS.slice(0,6).forEach((font,fi)=>{
    const b=document.createElement("button");
    b.className="qa";
    b.innerHTML=`<span class="pv">${escapeHtml(font.f("Aa"))}</span>${font.n}`;
    b.onclick=()=>{letterChoices=chars.map(()=>fi);renderBuilder()};
    qa.appendChild(b);
  });
  const rnd=document.createElement("button");
  rnd.className="qa";rnd.innerHTML="🎲 Randomize";
  rnd.onclick=()=>{letterChoices=chars.map(()=>Math.floor(Math.random()*GLYPH_FONTS.length));renderBuilder()};
  qa.appendChild(rnd);
  builder.appendChild(qa);

  const hint=document.createElement("p");
  hint.className="builderHint";
  hint.innerHTML="Tap a tile under each letter to set its font. Add symbols or emojis between letters from the <b>Add flair</b> section below.";
  builder.appendChild(hint);

  // one row per character: editable font picker for letters, compact chip for inserted flair
  chars.forEach((ch,idx)=>{
    if(/\s/.test(ch)) return; // plain spaces: kept in output, no row
    if(!STYLABLE.test(ch)){
      // inserted symbol or emoji — show a compact, removable chip row (no font picker)
      const fr=document.createElement("div");
      fr.className="flairRow";
      fr.dataset.idx=idx;
      fr.innerHTML=`<div class="glyph fr-glyph">${escapeHtml(ch)}</div>
        <div class="meta"><div class="orig">Added flair</div>
        <div class="cur">Symbol / emoji — not a letter</div></div>
        <button class="frRemove" aria-label="Remove this flair">Remove</button>`;
      fr.querySelector(".frRemove").onclick=()=>{
        const arr=[...(field.value||"")]; arr.splice(idx,1);
        letterChoices.splice(idx,1);
        field.value=arr.join(""); caretPos=null; renderBuilder();
      };
      builder.appendChild(fr);
      return;
    }
    const cur=letterChoices[idx]??0;
    const row=document.createElement("div");
    row.className="letterRow";
    row.dataset.idx=idx;

    const head=document.createElement("div");
    head.className="letterHead";
    head.innerHTML=`<div class="glyph">${escapeHtml(glyphFor(ch,cur))}</div>
      <div class="meta"><div class="orig">Letter “${escapeHtml(ch)}”</div>
      <div class="cur">${GLYPH_FONTS[cur].n}</div></div>
      <div class="nav-mini">
        <button class="miniBtn" data-d="-1" aria-label="Previous font">‹</button>
        <button class="miniBtn" data-d="1" aria-label="Next font">›</button>
      </div>`;
    row.appendChild(head);

    const opts=document.createElement("div");
    opts.className="options";
    GLYPH_FONTS.forEach((font,fi)=>{
      const o=document.createElement("div");
      o.className="opt"+(fi===cur?" sel":"");
      o.textContent=glyphFor(ch,fi);
      o.title=font.n;
      o.onclick=()=>{letterChoices[idx]=fi;renderBuilder()};
      opts.appendChild(o);
    });
    row.appendChild(opts);

    head.querySelectorAll(".miniBtn").forEach(b=>b.onclick=()=>{
      const d=parseInt(b.dataset.d);
      letterChoices[idx]=(cur+d+GLYPH_FONTS.length)%GLYPH_FONTS.length;
      renderBuilder();
    });

    builder.appendChild(row);
  });

  // ---------- Add flair section ----------
  builder.appendChild(renderFlairSection());
}

function renderFlairSection(){
  const sec=document.createElement("div");
  sec.className="flairSection";

  const hasTemplate = flairLeft || flairRight;
  sec.innerHTML=`
    <div class="flairHead">
      <div>
        <div class="flairTitle">Add flair</div>
        <div class="flairSub">Tap a symbol or emoji to drop it into your name at the cursor</div>
      </div>
    </div>`;

  // tabs
  const tabs=document.createElement("div");
  tabs.className="flairTabs";
  tabs.innerHTML=`
    <button class="ftab ${flairTab==='symbols'?'on':''}" data-t="symbols">Symbols</button>
    <button class="ftab ${flairTab==='emojis'?'on':''}" data-t="emojis">Emojis</button>
    <button class="ftab ${flairTab==='templates'?'on':''}" data-t="templates">Templates</button>`;
  sec.appendChild(tabs);

  const panel=document.createElement("div");
  panel.className="flairPanel";
  sec.appendChild(panel);

  // --- single-char insert palette (symbols or emojis) ---
  const drawPalette=(items,cls)=>{
    panel.innerHTML="";
    const note=document.createElement("p");
    note.className="flairNote";
    note.innerHTML="Tap to insert at your cursor — place it anywhere: <b>before</b>, <b>between</b>, or <b>after</b> letters.";
    panel.appendChild(note);
    const grid=document.createElement("div");
    grid.className=cls;
    items.forEach(ch=>{
      const tile=document.createElement("button");
      tile.className=(cls==="emojiGrid"?"emojiTile":"symTile");
      tile.textContent=ch;
      tile.onclick=()=>insertFlair(ch);
      grid.appendChild(tile);
    });
    panel.appendChild(grid);
  };

  // --- bookend templates ---
  const drawTemplates=()=>{
    panel.innerHTML="";
    const note=document.createElement("p");
    note.className="flairNote";
    note.innerHTML="Wrap your whole name in a matched pair. Tap again to remove.";
    panel.appendChild(note);
    const grid=document.createElement("div");
    grid.className="flairGrid";
    FLAIR.templates.forEach(s=>{
      const tile=document.createElement("button");
      tile.className="flairTile";
      const active = flairLeft===s.l && flairRight===s.r;
      if(active) tile.classList.add("sel");
      tile.innerHTML=`<span class="ft-glyph">${escapeHtml(s.l)} ᴀʙ ${escapeHtml(s.r)}</span><span class="ft-name">${s.name}</span>`;
      tile.onclick=()=>{
        if(active){flairLeft="";flairRight="";}
        else{flairLeft=s.l;flairRight=s.r;}
        renderBuilder();
      };
      grid.appendChild(tile);
    });
    panel.appendChild(grid);
    if(hasTemplate){
      const clr=document.createElement("button");
      clr.className="flairClear";clr.textContent="Remove template";
      clr.style.marginTop="14px";
      clr.onclick=()=>{flairLeft="";flairRight="";renderBuilder()};
      panel.appendChild(clr);
    }
  };

  const draw=()=>{
    if(flairTab==="symbols") drawPalette(FLAIR.symbols,"symGrid");
    else if(flairTab==="emojis") drawPalette(FLAIR.emojis,"emojiGrid");
    else drawTemplates();
  };
  draw();

  tabs.querySelectorAll(".ftab").forEach(b=>b.onclick=()=>{
    flairTab=b.dataset.t;
    tabs.querySelectorAll(".ftab").forEach(x=>x.classList.toggle("on",x.dataset.t===flairTab));
    draw();
  });

  return sec;
}

/* ---------- Copy ---------- */
function copy(text,el,kind){
  const done=()=>{
    showToast();
    if(kind==="card"){el.classList.add("copied");el.querySelector(".copybtn").innerHTML=CHECK_ICON;
      setTimeout(()=>{el.classList.remove("copied");el.querySelector(".copybtn").innerHTML=COPY_ICON},1400);}
    else{el.classList.add("copied");const sp=el.querySelector("span:last-child");const old=sp?sp.textContent:"";if(sp)sp.textContent="Copied!";
      setTimeout(()=>{el.classList.remove("copied");if(sp)sp.textContent=old},1400);}
  };
  navigator.clipboard.writeText(text).then(done).catch(()=>{
    const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();done();
  });
}
let toastT;
function showToast(){clearTimeout(toastT);toast.classList.add("show");toastT=setTimeout(()=>toast.classList.remove("show"),1600)}

/* ---------- Mode switching ---------- */
function setMode(m){
  mode=m;
  document.querySelectorAll(".modes button").forEach(b=>b.classList.toggle("on",b.dataset.mode===m));
  const isStyles=m==="styles";
  paneStyles.classList.toggle("hidden",!isStyles);
  paneBuilder.classList.toggle("hidden",isStyles);
  styleControls.classList.toggle("hidden",!isStyles);
  field.placeholder = isStyles ? "Type your username…" : "Type a username to style letter-by-letter…";
  if(isStyles) renderStyles(); else renderBuilder();
}

/* ---------- Events ---------- */
field.addEventListener("input",()=> mode==="styles"?renderStyles():renderBuilder());
["keyup","click","focus","select"].forEach(ev=>field.addEventListener(ev,()=>{caretPos=field.selectionStart;}));
document.getElementById("clear").onclick=()=>{field.value="";letterChoices=[];flairLeft="";flairRight="";caretPos=null;field.focus();mode==="styles"?renderStyles():renderBuilder()};
document.querySelectorAll(".chip").forEach(c=>c.onclick=()=>{
  document.querySelectorAll(".chip").forEach(x=>x.classList.remove("on"));c.classList.add("on");filter=c.dataset.f;renderStyles();
});
document.querySelectorAll(".modes button, .nav a[data-mode]").forEach(b=>b.onclick=e=>{e.preventDefault();setMode(b.dataset.mode)});

    /* ---------- Page-specific defaults (from build config) ---------- */
    if (config.defaultInput) field.value = config.defaultInput;
    if (config.defaultStyleFilter && config.defaultStyleFilter !== "all") {
      filter = config.defaultStyleFilter;
      document.querySelectorAll(".chip").forEach((x) => {
        x.classList.toggle("on", x.dataset.f === filter);
      });
    }
    flairTab = config.defaultFlairTab || flairTab;

    setMode(config.defaultMode || "builder");
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);

    if (config.defaultPlatform && mode === "builder") {
      requestAnimationFrame(() => {
        const chip = document.querySelector(`.compatChip[data-key="${config.defaultPlatform}"]`);
        if (chip) chip.click();
      });
    }

    return { STYLES, FLAIR, PLATFORMS, GLYPH_FONTS };
  }

  window.Fonted = { init, DEFAULTS };

  function boot() {
    init(window.__FONTED_AUTO_CONFIG__);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
