/* Where things live, shared by every page.

   notes/categories.yml              the categories on the site
   notes/glossary.json               in-game names in every game language (shared by all categories)
   notes/<category>/category.yml     settings shared by every language: grid, languages, toggles, targets, area order
   notes/<category>/sphere-grid/     Sphere Grid route files (no language: shared by every language)
   notes/<category>/<language>/      the notes: index.md (wording) and one Markdown file per area
   sphere-grid/<grid>.json           a whole Sphere Grid (standard.json; an Expert grid would sit beside it)

   Pages pick the category and language from the address: ?cat=any&lang=en (the defaults). */
(function () {
  const ROOT = "../";   // every page lives one folder down (prototypes/, tools/)
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
    glossary: () => `${ROOT}notes/glossary.json`,
    category: cat => `${ROOT}notes/${cat}/category.yml`,
    route: (cat, name) => `${ROOT}notes/${cat}/sphere-grid/${encodeURIComponent(name)}.json`,
    notes: (cat, lang, file) => `${ROOT}notes/${cat}/${lang}/${file}`,
    grid: name => `${ROOT}sphere-grid/${encodeURIComponent(name || "standard")}.json`,
  };
  const fetchText = url => fetch(url).then(r => { if (!r.ok) throw new Error(`${url} wasn't found`); return r.text(); });
  const fetchJson = url => fetch(url).then(r => { if (!r.ok) throw new Error(`${url} wasn't found`); return r.json(); });

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
  async function loadCategories() {
    try { return parseYaml(await fetchText(paths.categories())); } catch { return { [DEFAULT_CATEGORY]: DEFAULT_CATEGORY }; }
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

  window.NotesConfig = { DEFAULT_CATEGORY, DEFAULT_LANGUAGE, parseYaml, params, paths, fetchText, fetchJson, loadCategory, loadCategories, loadGrid, routeLoader };
})();
