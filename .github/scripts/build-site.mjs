// Builds the site into _site/: a copy of the repository, plus a real page for every skip
// (skips/<id>/index.html, from hub/skips/<id>.md), skips/index.json for the pages that list skips,
// and sitemap.xml + robots.txt for search engines.
//
//   node .github/scripts/build-site.mjs        then serve _site/, e.g.  python -m http.server 8765 -d _site
//
// Run by .github/workflows/pages.yml on every push to main, which publishes _site/ to GitHub Pages.
import { readFile, writeFile, mkdir, readdir, rm, cp, stat } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseYaml } from "./twitch-live.mjs";

const OUT = "_site";
const SKIP_DIR = "hub/skips";
const LEAVE_OUT = new Set([".git", ".github", OUT, "reference", ".claude", "node_modules"]);
const VERSION_LABEL = { hd: "HD Remaster", ps2: "PS2" };

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const exists = p => stat(p).then(() => true, () => false);
const list = v => (Array.isArray(v) ? v : v ? [v] : []);
const youtubeId = link => (String(link || "").match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/) || [])[1] || "";

/* ---------- Markdown for the skip guides ---------- */
/* Headings, paragraphs, lists (one level of nesting), **bold**, *italic*, `code`, [links](…), images,
   ":::if version=ps2 … :::" (text for one version) and ":::tip / :::warning … :::" boxes.
   Image paths are relative to hub/skips/; the page sits two folders down, so they're rewritten. */
function inline(text, imgBase) {
  return esc(text)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => `<img src="${/^https?:/.test(src) ? src : imgBase + src}" alt="${alt}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code>$1</code>");
}
export function renderGuide(md, imgBase = "") {
  const lines = md.replace(/\r/g, "").split("\n"), out = [];
  let para = [], listItems = null, listTag = "";
  const flushPara = () => { if (para.length) out.push(`<p>${inline(para.join(" "), imgBase)}</p>`); para = []; };
  const flushList = () => {
    if (!listItems) return;
    out.push(`<${listTag}>${listItems.map(it => `<li>${inline(it.text, imgBase)}${it.sub.length ? `<ul>${it.sub.map(s => `<li>${inline(s, imgBase)}</li>`).join("")}</ul>` : ""}</li>`).join("")}</${listTag}>`);
    listItems = null;
  };
  const flush = () => { flushPara(); flushList(); };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flush(); continue; }
    if ((m = line.match(/^:::if\s+version=([\w,]+)\s*$/))) { flush(); out.push(`<div class="vtext" data-version="${esc(m[1].replace(/,/g, " "))}">`); continue; }
    if ((m = line.match(/^:::(tip|warning|note)\s*(.*)$/))) { flush(); out.push(`<div class="callout ${m[1]}">${m[2] ? `<p class="callout-title">${inline(m[2], imgBase)}</p>` : ""}`); continue; }
    if (line.trim() === ":::") { flush(); out.push("</div>"); continue; }
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { flush(); const h = Math.min(4, Math.max(2, m[1].length)); out.push(`<h${h}>${inline(m[2], imgBase)}</h${h}>`); continue; }
    if ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/))) {   // an image on its own line: a figure with a caption
      flush();
      const src = /^https?:/.test(m[2]) ? m[2] : imgBase + m[2];
      out.push(`<figure><img src="${esc(src)}" alt="${esc(m[1])}" loading="lazy">${m[1] ? `<figcaption>${inline(m[1], imgBase)}</figcaption>` : ""}</figure>`);
      continue;
    }
    if ((m = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/))) {
      flushPara();
      const tag = /\d/.test(m[2]) ? "ol" : "ul";
      if (m[1].length >= 2 && listItems?.length) { listItems.at(-1).sub.push(m[3]); continue; }
      if (listItems && listTag !== tag) flushList();
      listTag = tag; (listItems ||= []).push({ text: m[3], sub: [] });
      continue;
    }
    flushList(); para.push(line.trim());
  }
  flush();
  return out.join("\n");
}

/* ---------- one skip ---------- */
function frontMatter(text) {
  const m = text.replace(/\r/g, "").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { meta: parseYaml(m[1]), body: m[2] } : { meta: {}, body: text };
}
/* the versions with a video: [{ key, label, video, by, by_url }]; a skip with one video for every version has key "" */
function versionsOf(meta) {
  if (meta.versions && typeof meta.versions === "object")
    return Object.entries(meta.versions).map(([key, v]) => ({ key, label: VERSION_LABEL[key] || key, video: v.video || "", by: v.by || "", by_url: v.by_url || "" }));
  return [{ key: "", label: "", video: meta.video || "", by: meta.by || "", by_url: meta.by_url || "" }];
}
async function readSkips(notesAreas, categoryNames) {
  const files = (await readdir(SKIP_DIR)).filter(f => f.endsWith(".md") && f.toLowerCase() !== "readme.md").sort();
  const skips = [];
  for (const f of files) {
    const { meta, body } = frontMatter(await readFile(join(SKIP_DIR, f), "utf8"));
    const id = f.replace(/\.md$/, "");
    if (!meta.name) { console.warn(`${f}: no name, left out`); continue; }
    const categories = list(meta.categories);
    // a "Used in the notes" link, when that area of the notes exists
    const notesCat = categories.find(c => notesAreas[c]?.has(meta.notes));
    skips.push({
      id, name: meta.name, aliases: list(meta.aliases), area: meta.area || "", difficulty: +meta.difficulty || 0,
      categories, categoryNames: categories.map(c => categoryNames[c] || c), summary: meta.summary || "",
      notes: notesCat ? `pages/notes.html?cat=${notesCat}#${meta.notes}` : "",
      versions: versionsOf(meta), body,
    });
  }
  return skips;
}

/* ---------- the skip's page ---------- */
function stars(n) {
  const d = Math.max(0, Math.min(5, Math.round(n)));
  return d ? `<span class="stars" role="img" aria-label="Difficulty ${d} out of 5" title="Difficulty ${d} out of 5"><span class="on">${"★".repeat(d)}</span><span class="off">${"★".repeat(5 - d)}</span></span>` : "";
}
function skipPage(s, site) {
  const R = "../../";   // from skips/<id>/ back to the site root
  const url = `${site}skips/${s.id}/`;
  const first = s.versions.find(v => v.video) || s.versions[0];
  const thumb = youtubeId(first.video) ? `https://i.ytimg.com/vi/${youtubeId(first.video)}/hqdefault.jpg` : "";
  const title = `${s.name} – Final Fantasy X Speedrun`;
  const description = s.summary || `How to do the ${s.name} in Final Fantasy X speedruns.`;
  const tabs = s.versions.length > 1
    ? `<div class="vtabs" role="tablist" aria-label="Version">${s.versions.map(v => `<button role="tab" data-v="${esc(v.key)}">${esc(v.label)}</button>`).join("")}</div>`
    : s.versions[0].label ? `<p class="vonly">${esc(s.versions[0].label)} only</p>` : "";
  const videos = s.versions.map(v => {
    const id = youtubeId(v.video);
    return `<div class="vblock" data-version="${esc(v.key)}">
      ${id ? `<div class="video big" data-yt="${id}" role="button" tabindex="0" aria-label="Play the ${esc(s.name)} video${v.label ? ` (${esc(v.label)})` : ""}"><img src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'" alt=""></div>`
           : v.video ? `<p><a href="${esc(v.video)}">Watch the video ↗</a></p>` : ""}
      ${v.by ? `<p class="by">Video by ${v.by_url ? `<a href="${esc(v.by_url)}">${esc(v.by)}</a>` : esc(v.by)}${v.video ? ` · <a href="${esc(v.video)}">Watch on YouTube ↗</a>` : ""}</p>` : ""}
    </div>`;
  }).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(s.name)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
${thumb ? `<meta property="og:image" content="${thumb}">\n<meta name="twitter:card" content="summary_large_image">` : ""}
<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${R}assets/hub.css">
<script src="${R}assets/notes-config.js"></script>
<script src="${R}assets/hub.js"></script>
<style>
  .skip-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 16px; margin-top: 10px; color: var(--head-dim); }
  .skip-meta .stars .off { color: rgba(255,255,255,.3); }
  .skip-meta .stars { font-size: 1.2rem; }
  .skip { max-width: 900px; }
  .vtabs { display: flex; gap: 6px; margin-bottom: 12px; }
  .vtabs button { font: inherit; font-weight: 700; padding: 7px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; }
  .vtabs button.on { background: var(--accent); border-color: var(--accent); color: #fff; }
  .vonly { margin: 0 0 12px; font-weight: 700; color: var(--muted); }
  .video.big { border-radius: 12px; box-shadow: var(--shadow); }
  .video.big::after { font-size: 3.4rem; }
  .vblock .by { margin: 10px 0 0; color: var(--muted); font-size: .92rem; }
  .guide { margin-top: 26px; font-size: 1.04rem; line-height: 1.7; }
  .guide h2 { margin: 30px 0 10px; font-size: 1.35rem; }
  .guide h3 { margin: 24px 0 8px; font-size: 1.1rem; }
  .guide img { max-width: 100%; border-radius: 8px; }
  .guide figure { margin: 18px 0; }
  .guide figcaption { color: var(--muted); font-size: .88rem; margin-top: 6px; }
  .guide code { background: var(--surface-2); padding: 1px 5px; border-radius: 4px; }
  .callout { margin: 16px 0; padding: 12px 16px; border-radius: 8px; border-left: 4px solid var(--accent); background: var(--accent-soft); }
  .callout.warning { border-left-color: var(--danger); background: var(--surface-2); }
  .callout.tip { border-left-color: var(--gold); background: var(--gold-soft); }
  .callout p { margin: 6px 0; } .callout-title { font-weight: 700; }
  .used { margin-top: 30px; padding-top: 18px; border-top: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: 10px; }
  /* only the chosen version's video and text show */
  body[data-version] .vblock[data-version]:not([data-version=""]),
  body[data-version] .vtext { display: none; }
${s.versions.filter(v => v.key).map(v => `  body[data-version="${v.key}"] .vblock[data-version="${v.key}"]:not([data-version=""]), body[data-version="${v.key}"] .vtext[data-version~="${v.key}"] { display: block; }`).join("\n")}
</style>
</head>
<body${s.versions.length > 1 ? ` data-version="${esc(s.versions[0].key)}"` : s.versions[0].key ? ` data-version="${esc(s.versions[0].key)}"` : ""}>
<div class="page-head"><div class="wrap">
  <p style="margin:0 0 6px"><a href="${R}pages/skips.html" style="color:var(--head-dim)">← All skips</a></p>
  <h1>${esc(s.name)}</h1>
  <p>${esc(s.summary)}</p>
  <div class="skip-meta">${stars(s.difficulty)}${s.area ? `<span>${esc(s.area)}</span>` : ""}${s.categoryNames.map(c => `<span class="tag">${esc(c)}</span>`).join("")}</div>
</div></div>
<main class="wrap skip">
  ${tabs}
  ${videos}
  <article class="guide">
${renderGuide(s.body, `${R}hub/skips/`)}
  </article>
  <div class="used">
    ${s.notes ? `<a class="btn primary" href="${R}${s.notes}">See it in the notes</a>` : ""}
    <a class="btn plain" href="${R}pages/skips.html">All skips</a>
    <a class="btn plain" href="https://github.com/lukeroddis/FFX-Speedrun/blob/main/hub/skips/${s.id}.md">Improve this page on GitHub</a>
  </div>
</main>
<script>
  Hub.nav("skips");
  Hub.footer();
  // version tabs: remembered, and #ps2 / #hd in the address picks one
  (() => {
    const tabs = [...document.querySelectorAll(".vtabs button")];
    if (!tabs.length) return;
    const keys = tabs.map(t => t.dataset.v);
    const pick = v => {
      document.body.dataset.version = v;
      tabs.forEach(t => t.classList.toggle("on", t.dataset.v === v));
      try { localStorage.setItem("ffx-skip-version", v); } catch {}
    };
    let start = location.hash.slice(1);
    if (!keys.includes(start)) { try { start = localStorage.getItem("ffx-skip-version"); } catch {} }
    pick(keys.includes(start) ? start : keys[0]);
    tabs.forEach(t => t.onclick = () => { pick(t.dataset.v); history.replaceState(null, "", "#" + t.dataset.v); });
  })();
</script>
</body>
</html>
`;
}

/* ---------- the whole site ---------- */
async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  for (const entry of await readdir(".")) {
    if (!LEAVE_OUT.has(entry)) await cp(entry, join(OUT, entry), { recursive: true });
  }
  const links = parseYaml(await readFile("hub/links.yml", "utf8"));
  const site = (links.site || "https://lukeroddis.github.io/FFX-Speedrun/").replace(/\/?$/, "/");

  // which areas of each category's notes exist, for the skips' "See it in the notes" links
  const cats = parseYaml(await readFile("notes/categories.yml", "utf8"));
  const categoryNames = Object.fromEntries(Object.entries(cats).map(([id, c]) => [id, typeof c === "object" ? c.name || id : c]));
  const notesAreas = {};
  for (const id of Object.keys(cats)) {
    try {
      const cfg = parseYaml(await readFile(`notes/${id}/category.yml`, "utf8"));
      const langs = list(cfg.languages).length ? list(cfg.languages) : ["en"];
      notesAreas[id] = new Set();
      for (const area of list(cfg.areas))
        if (await exists(`notes/${id}/${langs[0]}/${area}.md`)) notesAreas[id].add(area.replace(/^\d+-/, ""));
    } catch {}
  }

  const skips = await readSkips(notesAreas, categoryNames);
  for (const s of skips) {
    await mkdir(join(OUT, "skips", s.id), { recursive: true });
    await writeFile(join(OUT, "skips", s.id, "index.html"), skipPage(s, site));
  }
  // the list the Skips page, home page and notes read
  await writeFile(join(OUT, "skips", "index.json"), JSON.stringify(skips.map(({ body, ...s }) => ({ ...s, url: `skips/${s.id}/` })), null, 2));

  // search engines: every page worth finding
  const pages = ["", "pages/notes.html?cat=any", "pages/categories.html", "pages/skips.html", "pages/leaderboards.html", "pages/community.html", "pages/tools.html",
    ...skips.map(s => `skips/${s.id}/`)];
  const today = new Date().toISOString().slice(0, 10);
  await writeFile(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${esc(site + p)}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
  await writeFile(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${site}sitemap.xml\n`);
  console.log(`Built ${OUT}/ with ${skips.length} skip pages: ${skips.map(s => s.id).join(", ")}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error(e); process.exit(1); });
