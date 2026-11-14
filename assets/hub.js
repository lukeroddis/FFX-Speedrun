/* The site's shared navigation bar, footer, theme switch and hub data (links, leaderboards, skips, tools, categories).
   Any page can show the navigation bar:  <script src="…/assets/notes-config.js"></script><script src="…/assets/hub.js"></script>
   then  Hub.nav("skips")  (the name of the current section). The bar brings its own styles, so it also
   works on pages that don't use hub.css, such as the notes. */
(function () {
  const ROOT = new URL("..", document.currentScript.src).href;   // the site root, wherever the page is
  const url = p => ROOT + p;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = { get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

  const SECTIONS = [
    ["home", "Home", ""],
    ["notes", "Notes", "pages/categories.html"],
    ["skips", "Skips", "pages/skips.html"],
    ["boards", "Leaderboards", "pages/leaderboards.html"],
    ["community", "Community", "pages/community.html"],
    ["tools", "Tools", "pages/tools.html"],
  ];

  /* ---------- theme: light, dark, or the device's setting ---------- */
  const applyTheme = t => { if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; };
  applyTheme(store.get("ffx-theme", ""));

  /* ---------- navigation bar ---------- */
  const NAV_CSS = `
  .site-nav { position: sticky; top: 0; z-index: 50; background: linear-gradient(90deg, #1d2058, #34397e); color: #fff;
              font-family: "Ubuntu", "Segoe UI", sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,.25); text-shadow: none; }
  .site-nav .in { max-width: 1120px; margin: 0 auto; padding: 0 16px; display: flex; align-items: center; gap: 6px; min-height: 52px; }
  .site-nav .brand { color: #fff; text-decoration: none; font-weight: 700; font-size: 1.05rem; margin-right: 12px; white-space: nowrap; letter-spacing: .01em; }
  .site-nav .brand span { color: #ffd84a; }
  .site-nav .links { display: flex; align-items: center; gap: 2px; flex: 1; }
  .site-nav .links a { position: relative; color: #dfe1ff; text-decoration: none; padding: 7px 11px; border-radius: 6px; font-size: .93rem; font-weight: 500; white-space: nowrap; }
  .site-nav .links a:hover { background: rgba(255,255,255,.1); color: #fff; }
  .site-nav .links a.here { color: #fff; background: rgba(255,255,255,.14); box-shadow: inset 0 -2px 0 #ffd84a; }
  .site-nav button { font: inherit; color: #fff; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.25); border-radius: 6px;
                     padding: 4px 9px; cursor: pointer; font-size: .9rem; }
  .site-nav button:hover { background: rgba(255,255,255,.2); }
  .site-nav .menu-btn { display: none; }
  @media (max-width: 820px) {
    .site-nav .menu-btn { display: inline-block; margin-left: auto; }
    .site-nav .links { display: none; position: absolute; left: 0; right: 0; top: 52px; flex-direction: column; align-items: stretch;
                       padding: 8px 12px 12px; background: #262a68; box-shadow: 0 8px 16px rgba(0,0,0,.3); }
    .site-nav.open .links { display: flex; }
  }`;
  function nav(active) {
    if (!document.getElementById("site-nav-css")) {
      const st = document.createElement("style"); st.id = "site-nav-css"; st.textContent = NAV_CSS; document.head.appendChild(st);
    }
    const bar = document.createElement("header");
    bar.className = "site-nav";
    const mode = () => store.get("ffx-theme", "");
    const themeLabel = () => ({ light: "☀ Light", dark: "☾ Dark" })[mode()] || "◐ Auto";
    bar.innerHTML = `<div class="in">
      <a class="brand" href="${url("")}">FFX <span>Speedrun</span></a>
      <nav class="links" aria-label="Site">${SECTIONS.map(([id, label, href]) => `<a href="${url(href)}" class="${id === active ? "here" : ""}">${esc(label)}</a>`).join("")}</nav>
      <button class="theme" title="Light, dark, or your device's setting">${themeLabel()}</button>
      <button class="menu-btn" aria-label="Menu">☰</button></div>`;
    document.body.prepend(bar);
    bar.querySelector(".theme").onclick = e => {
      const next = { "": "light", light: "dark", dark: "" }[mode()];
      store.set("ffx-theme", next); applyTheme(next); e.currentTarget.textContent = themeLabel();
    };
    bar.querySelector(".menu-btn").onclick = () => bar.classList.toggle("open");
  }
  function footer() {
    const f = document.createElement("footer");
    f.className = "site-foot";
    f.innerHTML = `<div class="wrap"><span>Final Fantasy X and the Sphere Grid are © Square Enix. This is an unofficial fan project, not affiliated with or endorsed by Square Enix.</span>
      <span><a href="https://github.com/lukeroddis/FFX-Speedrun">Contribute on GitHub</a></span></div>`;
    document.body.appendChild(f);
  }

  /* ---------- data ---------- */
  const yaml = async path => NotesConfig.parseYaml(await NotesConfig.fetchText(url(path)));
  const links = () => yaml("hub/links.yml").catch(() => ({}));
  async function skips() {
    const y = await yaml("hub/skips.yml").catch(() => ({}));
    return Object.entries(y).map(([id, t]) => ({ id, ...t, categories: Array.isArray(t.categories) ? t.categories : [] }));
  }
  async function tools() {
    const y = await yaml("hub/tools.yml").catch(() => ({}));
    return Object.entries(y).map(([id, t]) => ({ id, ...t, link: /^https?:/.test(t.link || "") ? t.link : url(t.link || "") }));
  }
  /* difficulty 1–5 as stars, e.g. ★★☆☆☆ */
  function starsHTML(n) {
    const d = Math.max(0, Math.min(5, Math.round(+n || 0)));
    if (!d) return "";
    return `<p class="difficulty">Difficulty <span class="stars" role="img" aria-label="${d} out of 5" title="${d} out of 5">`
      + `<span class="on">${"★".repeat(d)}</span><span class="off">${"★".repeat(5 - d)}</span></span></p>`;
  }
  /* "By …" credit for a skip video or a tool: by (a name) and by_url (an optional link) */
  const byHTML = it => it.by ? `<p class="by">By ${it.by_url ? `<a href="${esc(it.by_url)}">${esc(it.by)}</a>` : esc(it.by)}</p>` : "";
  /* each category with notes, plus its languages (from its category.yml) */
  async function categories() {
    const cats = await NotesConfig.loadCategories();
    return Promise.all(Object.entries(cats).map(async ([id, c]) => {
      if (c.status === "coming-soon") return { id, ...c, languages: [] };
      try { return { id, ...c, languages: (await NotesConfig.loadCategory(id)).languages }; }
      catch { return { id, ...c, languages: [], status: c.status || "coming-soon" }; }
    }));
  }
  const notesUrl = (cat, lang) => url(`pages/notes.html?cat=${encodeURIComponent(cat)}${lang && lang !== "en" ? `&lang=${encodeURIComponent(lang)}` : ""}`);

  /* ---------- leaderboards from speedrun.com, kept for a day in this browser ---------- */
  const DAY = 24 * 60 * 60 * 1000;
  async function boards() {
    const y = await yaml("hub/leaderboards.yml");
    return Object.entries(y.boards || {}).map(([id, b]) => ({ id, game: y.game, ...b }));
  }
  async function board(b, top = 5) {
    const key = `ffx-board-${b.id}-${top}`;
    try { const c = JSON.parse(store.get(key, "null")); if (c && Date.now() - c.at < DAY) return c.data; } catch {}
    const vars = String(b.vars || "").split(",").map(s => s.trim()).filter(Boolean).map(v => { const [k, val] = v.split("="); return `var-${k}=${val}`; });
    const api = `https://www.speedrun.com/api/v1/leaderboards/${b.game}/category/${b.category}?${[...vars, `top=${top}`, "embed=players"].join("&")}`;
    const j = await fetch(api).then(r => { if (!r.ok) throw new Error(`speedrun.com answered ${r.status}`); return r.json(); });
    const people = new Map((j.data.players?.data || []).map(p => [p.id, { name: p.names?.international || p.name, link: p.weblink }]));
    const data = {
      link: j.data.weblink,
      runs: j.data.runs.map(x => ({
        place: x.place, time: x.run.times.primary_t, date: x.run.date, video: x.run.videos?.links?.[0]?.uri || "", link: x.run.weblink,
        players: x.run.players.map(p => p.rel === "user" ? (people.get(p.id) || { name: "?" }) : { name: p.name }),
      })),
    };
    store.set(key, JSON.stringify({ at: Date.now(), data }));
    return data;
  }
  function time(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = Math.floor(sec % 60), ms = Math.round((sec % 1) * 1000);
    return (h ? `${h}:${String(m).padStart(2, "0")}` : `${m}`) + `:${String(s).padStart(2, "0")}` + (ms ? `.${String(ms).padStart(3, "0")}` : "");
  }
  /* a board as a card: name, top runs, link to the full board */
  function boardHTML(b, data, rows = 5) {
    if (!data) return `<div class="card board"><h3>${esc(b.name)}</h3><div class="err">Couldn't reach speedrun.com just now.</div></div>`;
    return `<div class="card board"><h3>${esc(b.name)}</h3><table>${data.runs.slice(0, rows).map(r => `<tr class="${r.place === 1 ? "first" : ""}">
        <td class="place">${r.place}</td>
        <td>${r.players.map(p => p.link ? `<a href="${esc(p.link)}">${esc(p.name)}</a>` : esc(p.name)).join(", ")}</td>
        <td class="time">${r.video ? `<a href="${esc(r.video)}" title="Watch the run">${time(r.time)}</a>` : time(r.time)}</td>
        <td class="date">${esc(r.date || "")}</td></tr>`).join("")}</table>
      <div class="more"><a href="${esc(data.link)}">Full leaderboard on speedrun.com ↗</a></div></div>`;
  }

  /* ---------- who's live on Twitch: live.json from the Twitch live check ---------- */
  /* → { updated, streams: [...] }, or null when the check isn't running yet. ?live=<file> reads another file (for testing). */
  async function live() {
    const test = new URLSearchParams(location.search).get("live");
    const src = test ? url(test) : (await links()).live;
    if (!src) return null;
    try { const r = await fetch(src, { cache: "no-store" }); return r.ok ? await r.json() : null; } catch { return null; }
  }
  const ago = iso => {
    const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
  };
  function liveHTML(data, max = 50) {
    if (!data) return `<p class="muted">The live check isn't running yet, so streams can't be listed here. Find runners in the Discord in the meantime.</p>`;
    const stale = Date.now() - new Date(data.updated) > 30 * 60000 ? `<p class="muted" style="font-size:.85rem">Last checked ${ago(data.updated)} ago.</p>` : "";
    if (!data.streams.length) return `<p class="muted">No one's streaming an FFX speedrun right now. Check back later, or ask in the Discord.</p>${stale}`;
    return `<div class="grid">${data.streams.slice(0, max).map(s => `<div class="card">
        <div class="video twitch" data-ch="${esc(s.login)}" role="button" tabindex="0" aria-label="Watch ${esc(s.name)}">
          <img src="${esc(s.thumbnail)}?t=${Date.parse(data.updated) || ""}" alt="" loading="lazy"><span class="tag live" style="position:absolute;left:8px;top:8px">LIVE</span></div>
        <h3><a href="https://www.twitch.tv/${esc(s.login)}">${esc(s.name)}</a></h3>
        <p>${esc(s.title)}</p>
        <div class="foot"><span class="tag">${esc(s.viewers)} watching</span><span class="muted" style="font-size:.82rem">live for ${ago(s.started)} · ${esc(s.game)}</span></div>
      </div>`).join("")}</div>${stale}`;
  }

  /* ---------- YouTube: a thumbnail that becomes the player when clicked ---------- */
  const youtubeId = link => (String(link).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/) || [])[1] || "";
  function videoHTML(link, title = "") {
    const id = youtubeId(link);
    if (!id) return link ? `<a href="${esc(link)}">Watch the video ↗</a>` : "";
    return `<div class="video" data-yt="${id}" role="button" tabindex="0" aria-label="Play ${esc(title)}"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy"></div>`;
  }
  document.addEventListener("click", e => {
    const t = e.target.closest(".video[data-ch]");
    if (t && !t.classList.contains("playing")) {   // Twitch's player needs to know which site it's on
      t.classList.add("playing");
      t.innerHTML = `<iframe src="https://player.twitch.tv/?channel=${encodeURIComponent(t.dataset.ch)}&parent=${location.hostname}&autoplay=true" title="Twitch stream" allowfullscreen></iframe>`;
      return;
    }
    const v = e.target.closest(".video[data-yt]"); if (!v || v.classList.contains("playing")) return;
    v.classList.add("playing");
    v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  });
  document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches?.(".video[data-yt], .video[data-ch]")) e.target.click(); });

  window.Hub = { url, esc, nav, footer, links, skips, tools, byHTML, starsHTML, categories, notesUrl, boards, board, boardHTML, time, videoHTML, youtubeId, live, liveHTML };
})();
