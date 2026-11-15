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
  /* data-theme is the choice (missing for Auto); data-mode is what the page actually is, light or dark, so pages
     can style either one simply (the notes' light-mode cards use :root[data-mode="light"]) */
  const darkDevice = matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = t => {
    const root = document.documentElement;
    if (t === "light" || t === "dark") root.dataset.theme = t; else delete root.dataset.theme;
    root.dataset.mode = t === "light" || t === "dark" ? t : darkDevice.matches ? "dark" : "light";
  };
  applyTheme(store.get("ffx-theme", ""));
  darkDevice.addEventListener("change", () => applyTheme(store.get("ffx-theme", "")));

  /* ---------- navigation bar ---------- */
  const NAV_CSS = `
  .site-nav { position: sticky; top: 0; z-index: 50; background: linear-gradient(90deg, #1d2058, #34397e); color: #fff;
              font-family: "Ubuntu", "Segoe UI", sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,.25); text-shadow: none; }
  .site-nav .in { max-width: 1120px; margin: 0 auto; padding: 0 16px; display: flex; align-items: center; gap: 6px; min-height: 52px; }
  .site-nav .brand { color: #fff; text-decoration: none; font-weight: 700; font-size: 1.05rem; margin-right: 12px; white-space: nowrap; letter-spacing: .01em; }
  .site-nav .brand span { color: #ffd84a; }
  .site-nav .brand img { display: block; height: 40px; width: auto; }
  .site-nav .links { display: flex; align-items: center; gap: 2px; flex: 1; }
  .site-nav .links a { position: relative; color: #dfe1ff; text-decoration: none; padding: 7px 11px; border-radius: 6px; font-size: .93rem; font-weight: 500; white-space: nowrap; }
  .site-nav .links a:hover { background: rgba(255,255,255,.1); color: #fff; }
  .site-nav .links a.here { color: #fff; background: rgba(255,255,255,.14); box-shadow: inset 0 -2px 0 #ffd84a; }
  .site-nav button { font: inherit; color: #fff; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.25); border-radius: 6px;
                     padding: 4px 9px; cursor: pointer; font-size: .9rem; }
  .site-nav button:hover { background: rgba(255,255,255,.2); filter: none; }
  /* the in-game pages style every button their own way; the bar's buttons keep the bar's look */
  .site-nav button { flex: none; width: auto; box-shadow: none; text-shadow: none; line-height: normal; }
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
      <a class="brand" href="${url("")}"><img src="${url("assets/logo/logo-small.png")}" srcset="${url("assets/logo/logo-small.png")} 1x, ${url("assets/logo/logo-small@2x.png")} 2x, ${url("assets/logo/logo-small@3x.png")} 3x" alt="FFX Speedrun" width="109" height="40"></a>
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
    f.innerHTML = `<div class="wrap"><span>Final Fantasy X, character names, logos, and related imagery are registered trademarks and copyright material of Square Enix Co., Ltd. This is an unofficial, community-driven speedrunning resource and fan site. It is not affiliated with, endorsed by, or sponsored by Square Enix.</span>
      <span><a href="${url("pages/legal.html")}">Privacy and legal</a> · <a href="https://github.com/lukeroddis/FFX-Speedrun">Contribute on GitHub</a></span></div>`;
    document.body.appendChild(f);
  }

  /* ---------- data ---------- */
  const yaml = async path => NotesConfig.parseYaml(await NotesConfig.fetchText(url(path)));
  const links = () => yaml("hub/links.yml").catch(() => ({}));
  /* the skips, from skips/index.json, which the build makes from hub/skips/*.md (null when the site isn't built) */
  async function skips() {
    try { return (await NotesConfig.fetchJson(url("skips/index.json"))).map(s => ({ ...s, link: url(s.url) })); }
    catch { return null; }
  }
  /* a skip's card: its video's thumbnail and name link to its page */
  function skipCardHTML(s) {
    const v = s.versions.find(x => x.video) || s.versions[0] || {}, id = youtubeId(v.video);
    const by = [...new Set(s.versions.map(x => x.by).filter(Boolean))];
    const labels = s.versions.flatMap(x => x.labels || [x.label]).filter(Boolean);   // a tag per version, also for a shared tab
    return `<div class="card skipcard">
      ${id ? `<a class="video" href="${esc(s.link)}" aria-label="${esc(s.name)}"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy"></a>` : ""}
      <h3><a href="${esc(s.link)}">${esc(s.name)}</a></h3>
      ${s.area ? `<p><b>${esc(s.area)}</b></p>` : ""}${starsHTML(s.difficulty)}
      ${s.summary ? `<p>${esc(s.summary)}</p>` : ""}
      ${by.length ? `<p class="by">Video${s.versions.length > 1 ? "s" : ""} by ${by.map(esc).join(" and ")}</p>` : ""}
      <div class="foot">${labels.map(l => `<span class="tag">${esc(l)}</span>`).join("")}${(s.categoryNames || []).map(c => `<span class="tag soon">${esc(c)}</span>`).join("")}</div></div>`;
  }
  const notBuilt = `<p class="muted">The skips list is made when the site is built. Locally, run <code>node .github/scripts/build-site.mjs</code> and open the site from <code>_site/</code> (see DEVELOPER_GUIDE.md).</p>`;
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
  /* a runner from speedrun.com's API: name, profile link and country */
  const person = p => p.rel === "guest" ? { name: p.name } : {
    name: p.names?.international || p.name || "?", link: p.weblink,
    country: p.location?.country?.code || "", countryName: p.location?.country?.names?.international || "",
  };
  /* a runner as HTML: their flag (speedrun.com's own images; a code like "gb/eng" is a region with its own)
     and their name, linked to their profile */
  const flagHTML = p => p.country ? `<img class="flag" src="https://www.speedrun.com/images/flags/${esc(p.country)}.png" alt="${esc(p.countryName)}" title="${esc(p.countryName)}" onerror="this.remove()">` : "";
  const personHTML = p => flagHTML(p) + (p.link ? `<a href="${esc(p.link)}">${esc(p.name)}</a>` : esc(p.name));
  const runDate = d => { const t = Date.parse(d); return isNaN(t) ? "" : new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); };
  const DAY = 24 * 60 * 60 * 1000;
  async function boards() {
    const y = await yaml("hub/leaderboards.yml");
    return Object.entries(y.boards || {}).map(([id, b]) => ({ id, game: y.game, ...b }));
  }
  async function board(b, top = 5) {
    const key = `ffx-board-v2-${b.id}-${top}`;
    try { const c = JSON.parse(store.get(key, "null")); if (c && Date.now() - c.at < DAY) return { ...c.data, at: c.at }; } catch {}
    const vars = String(b.vars || "").split(",").map(s => s.trim()).filter(Boolean).map(v => { const [k, val] = v.split("="); return `var-${k}=${val}`; });
    const api = `https://www.speedrun.com/api/v1/leaderboards/${b.game}/category/${b.category}?${[...vars, `top=${top}`, "embed=players"].join("&")}`;
    const j = await fetch(api).then(r => { if (!r.ok) throw new Error(`speedrun.com answered ${r.status}`); return r.json(); });
    const people = new Map((j.data.players?.data || []).map(p => [p.id, person(p)]));
    const data = {
      link: j.data.weblink,
      runs: j.data.runs.map(x => ({
        place: x.place, time: x.run.times.primary_t, date: x.run.date, video: x.run.videos?.links?.[0]?.uri || "", link: x.run.weblink,
        players: x.run.players.map(p => p.rel === "user" ? (people.get(p.id) || { name: "?" }) : { name: p.name }),
      })),
    };
    const at = Date.now();
    store.set(key, JSON.stringify({ at, data }));
    return { ...data, at };
  }
  /* the newest runs in any category (full game only, not single levels), newest first by the date they were
     run, as on speedrun.com, and kept for a day. A run its runner has since beaten in the same category and
     subcategory is left out, as speedrun.com does. Each says its category with its subcategory
     ("Cutscene Remover · True RNG") and the date it was run. */
  async function recentRuns(count = 5) {
    const game = (await yaml("hub/leaderboards.yml")).game;
    const key = `ffx-recent-v3-${game}-${count}`;
    try { const c = JSON.parse(store.get(key, "null")); if (c && Date.now() - c.at < DAY) return { ...c.data, at: c.at }; } catch {}
    const get = u => fetch(`https://www.speedrun.com/api/v1/${u}`).then(r => { if (!r.ok) throw new Error(`speedrun.com answered ${r.status}`); return r.json(); });
    const [runs, vars] = await Promise.all([
      get(`runs?game=${game}&status=verified&orderby=date&direction=desc&max=50&embed=players,category`),
      get(`games/${game}/variables`),
    ]);
    const subs = new Map(vars.data.filter(v => v["is-subcategory"]).map(v => [v.id, v.values.values]));
    // the same runner(s), category and subcategory: one leaderboard entry
    const entry = r => [(r.players?.data || []).map(p => p.id || p.name).sort().join("+"), r.category?.data?.id,
      ...Object.entries(r.values || {}).filter(([k]) => subs.has(k)).sort().map(([k, v]) => `${k}=${v}`)].join("|");
    // runs on the same day: the later submission first
    const full = runs.data.filter(r => !r.level)
      .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.submitted || "").localeCompare(a.submitted || ""));
    const best = new Map();
    for (const r of full) { const k = entry(r); if (!best.has(k) || r.times.primary_t < best.get(k)) best.set(k, r.times.primary_t); }
    const shown = full.filter(r => r.times.primary_t <= best.get(entry(r))).slice(0, count);
    // each run's place: its category's board, with the subcategory picked (one request per board, not per run)
    const boardOf = r => `category/${r.category?.data?.id}?${Object.entries(r.values || {}).filter(([k]) => subs.has(k)).map(([k, v]) => `var-${k}=${v}`).join("&")}`;
    const places = new Map();
    await Promise.all([...new Set(shown.map(boardOf))].map(b => get(`leaderboards/${game}/${b}`)
      .then(j => j.data.runs.forEach(x => places.set(x.run.id, x.place))).catch(() => {})));
    const data = {
      runs: shown.map(r => ({
        category: [r.category?.data?.name, ...Object.entries(r.values || {}).map(([k, v]) => subs.get(k)?.[v]?.label)].filter(Boolean).join(" · "),
        time: r.times.primary_t, date: r.date || "", link: r.weblink, place: places.get(r.id) || 0,
        players: (r.players?.data || []).map(person),
      })),
    };
    const at = Date.now();
    store.set(key, JSON.stringify({ at, data }));
    return { ...data, at };
  }
  const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th");
  /* opts.title: false leaves out the card's own heading (the home page has one above it);
     opts.wide: a full-width card, with each run's category beside the runner rather than under them */
  function recentHTML(data, { title = true, wide = false } = {}) {
    const head = title ? `<h3>Recent runs</h3>` : "";
    if (!data) return `<div class="card board recent${wide ? " wide" : ""}${title ? "" : " untitled"}">${head}<div class="err">Couldn't reach speedrun.com just now.</div></div>`;
    if (!data.runs.length) return `<div class="card board recent${wide ? " wide" : ""}${title ? "" : " untitled"}">${head}<div class="err">No runs yet.</div></div>`;
    return `<div class="card board recent${wide ? " wide" : ""}${title ? "" : " untitled"}">${head}<table>${data.runs.map(r => `<tr class="${r.place === 1 ? "first" : ""}">
        <td class="place" title="${r.place ? `${ordinal(r.place)} on the leaderboard` : ""}">${r.place ? ordinal(r.place) : "–"}</td>
        <td>${r.players.map(personHTML).join(", ")}<span class="cat">${esc(r.category)}<span class="d"> · ${esc(runDate(r.date))}</span></span></td>
        <td class="time"><a href="${esc(r.link)}" title="See the run on speedrun.com">${time(r.time)}</a></td>
        <td class="date" title="When it was run">${esc(runDate(r.date))}</td></tr>`).join("")}</table></div>`;
  }
  function time(sec) {
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = Math.floor(sec % 60), ms = Math.round((sec % 1) * 1000);
    return (h ? `${h}:${String(m).padStart(2, "0")}` : `${m}`) + `:${String(s).padStart(2, "0")}` + (ms ? `.${String(ms).padStart(3, "0")}` : "");
  }
  /* a board as a card: name, top runs, link to the full board */
  function boardHTML(b, data, rows = 5) {
    // the title links to the full board on speedrun.com
    const title = data?.link ? `<h3><a class="board-link" href="${esc(data.link)}" title="The full leaderboard on speedrun.com">${esc(b.name)}<span aria-hidden="true">↗</span></a></h3>` : `<h3>${esc(b.name)}</h3>`;
    if (!data) return `<div class="card board">${title}<div class="err">Couldn't reach speedrun.com just now.</div></div>`;
    return `<div class="card board">${title}<table>${data.runs.slice(0, rows).map(r => `<tr class="${r.place === 1 ? "first" : ""}">
        <td class="place">${r.place}</td>
        <td class="runner" title="${esc(r.players.map(p => p.name).join(", "))}">${r.players.map(personHTML).join(", ")}</td>
        <td class="time">${r.video ? `<a href="${esc(r.video)}" title="Watch the run">${time(r.time)}</a>` : time(r.time)}</td>
        <td class="date" title="When it was run">${esc(runDate(r.date))}</td></tr>`).join("")}</table></div>`;
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
  const staleHTML = data => data && Date.now() - new Date(data.updated) > 15 * 60000 ? `<p class="muted" style="font-size:.85rem">Last checked ${ago(data.updated)} ago.</p>` : "";
  /* one stream's card. controls: the Community page's expand button. A stream named in a watch link that isn't
     in the live list ({ login, offline: true }) gets a card that can still try to play it. */
  function streamCardHTML(s, data, controls = false) {
    const thumb = s.offline
      ? `<span class="offline-note">Not in the live list right now. Click to try playing it anyway.</span>`
      : `<img src="${esc(s.thumbnail)}?t=${Date.parse(data?.updated) || ""}" alt="" loading="lazy"><span class="tag live" style="position:absolute;left:8px;top:8px">LIVE</span>`;
    const name = `<h3><a href="https://www.twitch.tv/${esc(s.login)}">${esc(s.name || s.login)}</a></h3>`;
    return `<div class="card${s.watched ? " watched" : ""}">
        <div class="video twitch${s.offline ? " offline" : ""}" data-ch="${esc(s.login)}" role="button" tabindex="0" aria-label="Watch ${esc(s.name || s.login)}">${thumb}</div>
        ${controls ? `<div class="shead">${name}<button class="sbtn expand" aria-pressed="false" title="Make this stream full width">⤢</button></div>` : name}
        ${s.offline ? "" : `<p>${esc(s.title)}</p>
        <div class="foot"><span class="tag">${esc(s.viewers)} watching</span><span class="muted" style="font-size:.82rem">live for ${ago(s.started)} · ${esc(s.game)}</span></div>`}
      </div>`;
  }
  function liveHTML(data, max = 50) {
    if (!data) return `<p class="muted">The live check isn't running yet, so streams can't be listed here. Find runners in the Discord in the meantime.</p>`;
    if (!data.streams.length) return `<p class="muted">No one's streaming an FFX speedrun right now. Check back later, or ask in the Discord.</p>${staleHTML(data)}`;
    return `<div class="grid streams">${data.streams.slice(0, max).map(s => streamCardHTML(s, data)).join("")}</div>${staleHTML(data)}`;
  }

  /* ---------- the Community page's stream viewer ----------
     Everything liveHTML shows, plus:
     - a layout picker (Auto, or 1–3 streams per row), remembered in this browser;
     - an expand button on each stream, making it full width;
     - while a stream plays, its card hides the title and viewer count, so videos sit closer together;
     - a watch link: ?watch=runner1,runner2 puts those streams first, side by side, with a Play all button.
       Streams playing can be shared as such a link with Copy watch link. */
  const LOGIN = /^[a-z0-9_]{1,25}$/;
  const LAYOUTS = ["auto", "1", "2", "3"];
  async function streamViewer(el, data) {
    const watch = [...new Set((new URLSearchParams(location.search).get("watch") || "").toLowerCase().split(",").map(s => s.trim()))]
      .filter(l => LOGIN.test(l)).slice(0, 6);
    if (!watch.length && !data?.streams?.length) { el.innerHTML = liveHTML(data); return; }
    // channels the live check never lists (hub/twitch.yml "exclude") aren't shown from a watch link either
    let excluded = [];
    try { const t = await yaml("hub/twitch.yml"); excluded = (Array.isArray(t.exclude) ? t.exclude : []).map(l => l.toLowerCase()); } catch {}
    const streams = data?.streams || [];
    const watched = watch.filter(l => !excluded.includes(l))
      .map(l => ({ ...(streams.find(s => s.login.toLowerCase() === l) || { login: l, offline: true }), watched: true }));
    const rest = streams.filter(s => !watch.includes(s.login.toLowerCase()));
    let layout = store.get("ffx-stream-layout", "auto");
    if (watched.length > 1) layout = String(Math.min(watched.length, 3));   // a race: side by side
    if (!LAYOUTS.includes(layout)) layout = "auto";

    el.innerHTML = `<div class="stream-wide">
      <div class="stream-bar">
        <div class="seg" role="group" aria-label="Streams per row"><span>Layout</span>${LAYOUTS.map(l =>
          `<button data-layout="${l}" aria-pressed="${l === layout}" title="${l === "auto" ? "Two per row, and the stream you play goes full width" : `${l} per row`}">${l === "auto" ? "Auto" : l}</button>`).join("")}</div>
        ${watched.length ? `<button class="btn small primary" data-act="play">▶ Play ${watched.length > 1 ? "all" : "it"}</button>` : ""}
        <button class="btn small plain" data-act="link" hidden>🔗 Copy watch link</button>
        <span class="muted copied" hidden></span>
      </div>
      <div class="grid streams controls cols-${layout}">${[...watched, ...rest].map(s => streamCardHTML(s, data, true)).join("")}</div>
    </div>${staleHTML(data)}`;

    const grid = el.querySelector(".grid.streams"), linkBtn = el.querySelector('[data-act="link"]'), note = el.querySelector(".copied");
    const setLayout = l => {
      layout = l;
      grid.className = `grid streams controls cols-${l}`;
      el.querySelectorAll("[data-layout]").forEach(b => b.setAttribute("aria-pressed", b.dataset.layout === l));
    };
    const setExpanded = (card, on) => { card.classList.toggle("expanded", on); card.querySelector(".expand").setAttribute("aria-pressed", on); };
    const playingLogins = () => [...grid.querySelectorAll(".video.playing")].map(v => v.dataset.ch);

    el.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (b?.dataset.layout) { setLayout(b.dataset.layout); store.set("ffx-stream-layout", b.dataset.layout); return; }
      if (b?.classList.contains("expand")) { const c = b.closest(".card"); setExpanded(c, !c.classList.contains("expanded")); return; }
      if (b?.dataset.act === "play") { grid.querySelectorAll(".card.watched .video:not(.playing)").forEach(playTwitch); return; }
      if (b?.dataset.act === "link") {
        const u = new URL(location.href);
        u.search = `?watch=${playingLogins().join(",")}`;
        const done = msg => { note.textContent = msg; note.hidden = false; };
        navigator.clipboard?.writeText(u.href).then(() => done("Link copied"), () => done(u.href)) ?? done(u.href);
      }
    });
    // started a stream: in Auto it goes full width; and the page can now offer a link to what's playing
    el.addEventListener("twitch-play", e => {
      if (layout === "auto") setExpanded(e.target.closest(".card"), true);
      linkBtn.hidden = false; note.hidden = true;
    });
  }

  /* ---------- YouTube: a thumbnail that becomes the player when clicked ---------- */
  const youtubeId = link => (String(link).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/) || [])[1] || "";
  function videoHTML(link, title = "") {
    const id = youtubeId(link);
    if (!id) return link ? `<a href="${esc(link)}">Watch the video ↗</a>` : "";
    return `<div class="video" data-yt="${id}" role="button" tabindex="0" aria-label="Play ${esc(title)}"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy"></div>`;
  }
  /* a Twitch thumbnail becomes the player. Twitch's player needs to know which site it's on. */
  function playTwitch(t) {
    if (t.classList.contains("playing")) return;
    t.classList.add("playing");
    t.innerHTML = `<iframe src="https://player.twitch.tv/?channel=${encodeURIComponent(t.dataset.ch)}&parent=${location.hostname}&autoplay=true" title="Twitch stream" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    t.dispatchEvent(new Event("twitch-play", { bubbles: true }));
  }
  document.addEventListener("click", e => {
    const t = e.target.closest(".video[data-ch]");
    if (t) { playTwitch(t); return; }
    const v = e.target.closest(".video[data-yt]"); if (!v || v.classList.contains("playing")) return;
    v.classList.add("playing");
    v.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  });
  document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches?.(".video[data-yt], .video[data-ch]")) e.target.click(); });

  /* "Updated 3 hours ago from speedrun.com": the oldest of these boards' fetch times */
  function updatedText(datas) {
    const ats = datas.filter(Boolean).map(d => d.at).filter(Boolean);
    if (!ats.length) return "";
    return `Updated ${ago(new Date(Math.min(...ats)).toISOString())} ago from speedrun.com · refreshes once a day`.replace("Updated 0 min ago", "Updated just now");
  }

  window.Hub = { url, esc, nav, footer, links, skips, skipCardHTML, notBuilt, tools, byHTML, starsHTML, categories, notesUrl, boards, board, boardHTML, personHTML, recentRuns, recentHTML, time, videoHTML, youtubeId, live, liveHTML, streamViewer, updatedText };
})();
