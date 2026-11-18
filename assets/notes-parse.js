/* Reading the run notes' Markdown into items the notes page draws. No page or browser needed, so it's
   tested with Node: run "node --test" in the repository folder

   An area's text goes through two steps:
   1. applyVariants: the ":::if" sections are kept, dropped or labelled for the chosen route toggles
   2. parseArea: the lines become items: numbered steps, blocks (":::battle …"), questions, paragraphs

   Route toggles need the category's list of them, so they come from create(variants), where each is
   { key, name, options: [{ id, label }] }. The rest doesn't depend on the category. */
(() => {
  /* 1. Route variants.
     ":::if blitz=loss" keeps its lines only on Blitz Loss. Conditions combine ("blitz=loss spheres=return4")
     and a condition can allow several options ("spheres=return4,return2").
     When a variant isn't chosen yet, every option's lines stay, labelled:
     - outside a block they're wrapped in ":::vgroup <label>", drawn as a labelled group
     - inside a block they go under a "⟦label⟧" list item, drawn as a labelled branch
     - "route:" lines get " | label" so each option's grid is drawn and labelled */
  const parseCond = s => s.trim().split(/\s+/).map(p => {
    const [key, vals = ""] = p.split("=");
    return { key: key.trim(), values: vals.split(",").map(v => v.trim()).filter(Boolean) };
  });

  function create(variants, { warn = msg => console.warn(msg) } = {}) {
    const VARIANT = Object.fromEntries(variants.map(v => [v.key, v]));
    const condLabel = c => {
      const v = VARIANT[c.key];
      return `${v.name}: ${c.values.map(id => v.options.find(o => o.id === id)?.label || id).join(" or ")}`;
    };
    /* "keep", "drop", or the label to show while the variants involved aren't chosen */
    function evalCond(conds, vars) {
      const open = [];
      for (const c of conds) {
        if (!VARIANT[c.key]) { warn(`:::if ${c.key}=... isn't one of the route toggles in category.yml`); continue; }
        if (vars[c.key]) { if (!c.values.includes(vars[c.key])) return "drop"; }
        else open.push(c);
      }
      return open.length ? open.map(condLabel).join(" · ") : "keep";
    }
    function applyVariants(text, vars) {
      const root = { lines: [] }, stack = [root];
      const sink = () => [...stack].reverse().find(f => f.lines).lines;
      for (const line of text.split("\n")) {
        const open = line.match(/^:::(\w+)\s*(.*)$/);
        if (open && ONE_LINE.includes(open[1])) { sink().push(line); continue; }
        if (open && open[1] === "if") {
          stack.push({ isIf: true, lines: [], decision: evalCond(parseCond(open[2]), vars), inBlock: stack.some(f => f.block) });
          continue;
        }
        if (line.trim() === ":::" && stack.length > 1) {
          const f = stack.pop();
          if (!f.isIf) { sink().push(line); continue; }
          const out = sink();
          if (f.decision === "keep") out.push(...f.lines);
          else if (f.decision !== "drop") {
            const label = f.decision;
            if (!f.inBlock) out.push(`:::vgroup ${label}`, ...f.lines, ":::");
            else {
              const routes = f.lines.filter(l => /^\s*route:/.test(l)), rest = f.lines.filter(l => l.trim() && !/^\s*(route:|!\[)/.test(l));   // images inside blocks aren't shown
              out.push(...routes.map(l => `${l.trim()} | ${label}`));
              if (rest.length) {
                const ind = Math.min(...rest.map(l => l.match(/^\s*/)[0].length));
                out.push(`${" ".repeat(ind)}- ⟦${label}⟧`, ...rest.map(l => "  " + l));
              }
            }
          }
          continue;
        }
        if (open) stack.push({ block: open[1] !== "optional" });   // an optional group holds steps, like the page itself
        sink().push(line);
      }
      return root.lines;
    }
    return { VARIANT, evalCond, applyVariants };
  }

  /* directives that are one line, with no closing ":::" */
  const ONE_LINE = ["use", "ask"];

  /* 2. Bullet lists into a tree; lines that aren't bullets become paragraphs */
  function parseList(lines) {
    const root = { children: [], paras: [] }, stack = [{ depth: -1, node: root }];
    for (const raw of lines) {
      if (!raw.trim()) continue;
      const m = raw.match(/^(\s*)(?:[-*]|\d+\.)\s+(.*)$/);
      if (!m) { root.paras.push({ text: raw.trim(), after: root.children.length }); continue; }
      const depth = Math.floor(m[1].length / 2), item = { text: m[2], children: [] };
      while (stack.at(-1).depth >= depth) stack.pop();
      stack.at(-1).node.children.push(item);
      stack.push({ depth, node: item });
    }
    return root;
  }
  /* a list item that labels the lines of a variant not chosen yet (see applyVariants) */
  const VLABEL = /^⟦(.+)⟧$/;

  /* 3. The body of the area: numbered steps, blocks, paragraphs */
  function parseArea(lines) {
    const items = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim() || /^# /.test(line)) continue;
      const open = line.match(/^:::(\w+)\s*(.*)$/);
      if (open && open[1] === "use") { items.push({ kind: "use", name: open[2].trim() }); continue; }
      // ":::ask blitz | Did you win Blitzball?": a question that sets a route toggle
      if (open && open[1] === "ask") {
        const [key, question] = open[2].split("|").map(s => s.trim());
        items.push({ kind: "ask", key, question });
        continue;
      }
      if (open) {
        const inner = []; let depth = 1;
        for (i++; i < lines.length; i++) {
          const o = lines[i].match(/^:::(\w+)/);
          if (o && !ONE_LINE.includes(o[1])) depth++;
          else if (lines[i].trim() === ":::" && --depth === 0) break;
          inner.push(lines[i]);
        }
        const [title, extra] = open[2].split("|").map(s => s.trim());
        items.push({ kind: "block", type: open[1], title, extra, lines: inner });
        continue;
      }
      const step = line.match(/^\d+\.\s+(.*)$/);
      if (step) {
        const sub = [];
        while (i + 1 < lines.length && /^\s+[-*\d]/.test(lines[i + 1])) sub.push(lines[++i]);
        // "1. ! …" marks a step to keep even in a lighter view
        const important = /^!\s+/.test(step[1]);
        items.push({ kind: "step", text: step[1].replace(/^!\s+/, ""), important, sub: parseList(sub.map(s => s.replace(/^  /, ""))).children });
        continue;
      }
      const pm = line.match(/^party:\s*(.+)$/);
      if (pm) { items.push({ kind: "party", names: pm[1].split(",").map(s => s.trim()).filter(Boolean) }); continue; }
      const img = line.match(/^!\[(.*?)\]\((.+?)\)/);
      if (img) { items.push({ kind: "image", src: img[2] }); continue; }
      items.push({ kind: "para", text: line });
    }
    return items;
  }

  /* a labelled group (a variant not chosen yet) or an optional group holds its own items */
  const GROUPS = ["vgroup", "optional"];
  const flatItems = items => items.flatMap(it => GROUPS.includes(it.type) ? flatItems(parseArea(it.lines)) : [it]);
  /* ":::use name" finds the block in the same area with "id: name", or else "route: name" */
  const blockNamed = (blocks, name) => {
    const has = key => b => b.lines.some(l => l.trim().replace(/\s*\|.*$/, "") === `${key}: ${name}`);
    return blocks.find(has("id")) || blocks.find(has("route"));
  };

  const api = { create, parseCond, parseList, parseArea, VLABEL, GROUPS, flatItems, blockNamed };
  if (typeof module === "object" && module.exports) module.exports = api;   // Node, for the tests
  else window.NotesParse = api;
})();
