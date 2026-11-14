/* Where things live, shared by every page.

   notes/categories.yml              the categories on the site
   notes/glossary/terms.yml          the game's languages, and every in-game name's type and icon (shared by all categories)
   notes/glossary/<language>.yml     those names in one game language
   notes/maps/<name>.txt             area maps (no language: any category's notes can show them)
   notes/<category>/category.yml     settings shared by every language: grid, languages, toggles, targets, area order
   notes/<category>/sphere-grid/     Sphere Grid route files (no language: shared by every language)
   notes/<category>/<language>/      the notes: index.md (wording) and one Markdown file per area
   sphere-grid/<grid>.json           a whole Sphere Grid (standard.json; an Expert grid would sit beside it)

   Pages pick the category and language from the address: ?cat=any&lang=en (the defaults). */
(function () {
  const ROOT = new URL("..", document.currentScript.src).href;   // the site root, wherever the page is
  const DEFAULT_CATEGORY = "any", DEFAULT_LANGUAGE = "en";

  /* The settings files are a small YAML subset: "key: value", indented maps, [a, b] lists and # comments */
  function parseYaml(src) {
    const root = {}, stack = [{ indent: -1, obj: root }];
    for (const raw of String(src).replace(/\r/g, "").split("\n")) {
      const line = raw.replace(/\s+#.*$/, "");
      if (!line.trim() || line.trim().startsWith("#")) continue;
      const indent = line.match(/^\s*/)[0].length, m = line.trim().match(/^([^:]+?):\s*(.*)$/);
      if (!m) continue;
      while (stack.at(-1).indent >= indent) stack.pop();
      const parent = stack.at(-1).obj, key = m[1].trim(), val = m[2].trim();
      if (val === "") stack.push({ indent, obj: parent[key] = {} });
      else parent[key] = /^\[.*\]$/.test(val) ? val.slice(1, -1).split(",").map(s => s.trim()).filter(Boolean) : val;
    }
    return root;
  }

  const params = () => {
    const qs = new URLSearchParams(location.search);
    return { cat: (qs.get("cat") || DEFAULT_CATEGORY).replace(/[^\w-]/g, ""), lang: (qs.get("lang") || "").replace(/[^\w-]/g, "") };
  };
  const paths = {
    categories: () => `${ROOT}notes/categories.yml`,
    glossaryTerms: () => `${ROOT}notes/glossary/terms.yml`,
    glossary: lang => `${ROOT}notes/glossary/${encodeURIComponent(lang)}.yml`,
    map: name => `${ROOT}notes/maps/${encodeURIComponent(name)}.txt`,
    category: cat => `${ROOT}notes/${cat}/category.yml`,
    route: (cat, name) => `${ROOT}notes/${cat}/sphere-grid/${encodeURIComponent(name)}.json`,
    notes: (cat, lang, file) => `${ROOT}notes/${cat}/${lang}/${file}`,
    grid: name => `${ROOT}sphere-grid/${encodeURIComponent(name || "standard")}.json`,
  };
  /* "no-cache": the browser always asks the server whether a file changed (a quick "not modified" when it
     hasn't), so an edited notes or settings file shows up on the next refresh instead of an old copy */
  const fetchText = url => fetch(url, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(`${url} wasn't found`); return r.text(); });
  const fetchJson = url => fetch(url, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(`${url} wasn't found`); return r.json(); });

  /* a category's shared settings, with defaults filled in */
  async function loadCategory(cat) {
    const y = parseYaml(await fetchText(paths.category(cat)));
    return {
      id: cat,
      grid: y.grid || "standard",
      languages: Array.isArray(y.languages) && y.languages.length ? y.languages : [DEFAULT_LANGUAGE],
      variants: y.variants || {},
      targets: y.targets || {},
      areas: Array.isArray(y.areas) ? y.areas : [],
    };
  }
  /* { id: { name, about, boards, status } } from notes/categories.yml, in order */
  async function loadCategories() {
    let y;
    try { y = parseYaml(await fetchText(paths.categories())); } catch { y = { [DEFAULT_CATEGORY]: DEFAULT_CATEGORY }; }
    return Object.fromEntries(Object.entries(y).map(([id, v]) => [id, typeof v === "object"
      ? { name: v.name || id, about: v.about || "", boards: Array.isArray(v.boards) ? v.boards : [], status: v.status || "" }
      : { name: v || id, about: "", boards: [], status: "" }]));
  }
  /* The glossary: { languages: { en: "English", … }, terms: { id: { type, icon } } } */
  async function loadGlossary() {
    try {
      const y = parseYaml(await fetchText(paths.glossaryTerms()));
      return { languages: y.languages || {}, terms: y.terms || {} };
    } catch { return { languages: {}, terms: {} }; }
  }
  /* One game language's names: { id: ["Name", "other form", …] }; the first form is the one shown.
     Each language is fetched once, and only when a page needs it. */
  const namesCache = new Map();
  function loadGlossaryNames(lang) {
    if (!namesCache.has(lang)) namesCache.set(lang, fetchText(paths.glossary(lang))
      .then(t => Object.fromEntries(Object.entries(parseYaml(t)).filter(([, v]) => typeof v === "string")
        .map(([id, v]) => [id, v.split("|").map(s => s.trim()).filter(Boolean)])))
      .catch(() => ({})));
    return namesCache.get(lang);
  }
  const loadGrid = cfg => fetchJson(paths.grid(cfg.grid));
  /* a route loader for RouteEngine.resolve, cached */
  function routeLoader(cat) {
    const cache = new Map();
    return name => {
      if (!cache.has(name)) cache.set(name, fetch(paths.route(cat, name)).then(r => { if (!r.ok) throw new Error(`No route called "${name}" in ${cat}`); return r.json(); }));
      return cache.get(name);
    };
  }

  window.NotesConfig = { DEFAULT_CATEGORY, DEFAULT_LANGUAGE, parseYaml, params, paths, fetchText, fetchJson, loadCategory, loadCategories, loadGlossary, loadGlossaryNames, loadGrid, routeLoader };
})();
