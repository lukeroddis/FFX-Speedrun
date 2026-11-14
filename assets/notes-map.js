/* Maps in the notes, drawn as an SVG. Shared by the notes page and the map editor.

   A map is a few lines of text, kept in its own file in notes/maps/ (kilika-woods.txt), so any category
   or language can use it:

   size: 100x125                      width x height (only the shape matters); 100x100 if left out
   trail: 50,95 50,60 46,40 50,8      a path on the map, drawn muted (one line per path)
   route: 50,95 50,70 44,66 50,8      the way to go, drawn gold with an arrow at its end (more than one is fine)
   chest: 45,68 Scout                 a chest to open: a marker, and the item's name like in the notes
   label: 50,4 To Kilika Temple       any other place worth naming, drawn plainer
   by: Someone                        optional: credit, when the map is based on someone else's

   The notes show it with a block naming the file:

   :::map Kilika Woods
   file: kilika-woods
   :::

   Lines in the block are added to the file's, so a category can add its own chests. If the block has
   route lines, they replace the file's route (a category that goes another way).
   The whole map can also be written inside the block instead of a file.

   Positions are "x,y" as a percentage of the map's width and height, measured from the top left.
   A chest's or label's name sits to the right of its point, or to the left near the right-hand edge. After a
   "|" you can choose: "| left", "| right", "| above", "| below", or an offset "| 8,-5" that puts the name's
   centre that far from the point (drawn with a thin line back to it). The map editor (tools/map-editor.html)
   writes all of this for you: trace over a screenshot, and drag the names where they fit. */
(function () {
  const NUM = "(-?\\d+(?:\\.\\d+)?)";
  const POINT = new RegExp(`${NUM}\\s*,\\s*${NUM}`, "g");
  const points = s => [...String(s).matchAll(POINT)].map(m => [+m[1], +m[2]]);
  const SIDES = ["left", "right", "above", "below"];

  function parse(lines) {
    const map = { ratio: 1, sized: false, trails: [], routes: [], chests: [], labels: [], by: "", file: "" };
    for (const raw of lines) {
      const m = String(raw).trim().match(/^(\w+):\s*(.*)$/);
      if (!m) continue;
      const [, key, val] = m;
      if (key === "size") {
        const s = val.match(/(\d+(?:\.\d+)?)\s*[x×:]\s*(\d+(?:\.\d+)?)/);
        if (s && +s[1] > 0 && +s[2] > 0) { map.ratio = +s[2] / +s[1]; map.sized = true; }
      } else if (key === "trail" || key === "route") {
        const p = points(val);
        if (p.length > 1) map[key + "s"].push(p);
      } else if (key === "chest" || key === "label") {
        const p = val.match(new RegExp(`^${NUM}\\s*,\\s*${NUM}\\s+(.+)$`));
        if (!p) continue;
        const [name, where = ""] = p[3].split("|").map(s => s.trim());
        const off = where.match(new RegExp(`^${NUM}\\s*,\\s*${NUM}$`));
        map[key + "s"].push({ at: [+p[1], +p[2]], name, side: SIDES.includes(where) ? where : "", off: off ? [+off[1], +off[2]] : null });
      } else if (key === "by") map.by = val;
      else if (key === "file") map.file = val.trim();
    }
    return map;
  }

  /* a map file with a block's own lines added */
  function merge(base, extra) {
    return {
      ...base,
      ratio: extra.sized ? extra.ratio : base.ratio, sized: base.sized || extra.sized,
      trails: [...base.trails, ...extra.trails],
      routes: extra.routes.length ? extra.routes : base.routes,
      chests: [...base.chests, ...extra.chests],
      labels: [...base.labels, ...extra.labels],
      by: extra.by || base.by,
    };
  }

  const n = v => +v.toFixed(2);
  /* rounded corners: each point (but the ends) becomes a curve's control point, so lines bend smoothly */
  function smooth(p) {
    if (p.length < 3) return `M${p.map(q => q.join(" ")).join(" L")}`;
    let d = `M${p[0].join(" ")}`;
    for (let i = 1; i < p.length - 1; i++) d += ` Q${p[i].join(" ")} ${n((p[i][0] + p[i + 1][0]) / 2)} ${n((p[i][1] + p[i + 1][1]) / 2)}`;
    return d + ` L${p.at(-1).join(" ")}`;
  }
  function arrow(p) {
    const end = p.at(-1);
    let from = p.at(-2);
    for (let i = p.length - 2; i >= 0 && Math.hypot(end[0] - p[i][0], end[1] - p[i][1]) < .5; i--) from = p[i];
    const a = Math.atan2(end[1] - from[1], end[0] - from[0]), s = 2.1, w = .55;
    const pt = t => [n(end[0] + Math.cos(a + t) * (t ? -s : s * .35)), n(end[1] + Math.sin(a + t) * (t ? -s : s * .35))];
    return `<polygon class="arrow" points="${[pt(0), pt(w), pt(-w)].map(q => q.join(",")).join(" ")}"/>`;
  }
  const escAttr = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* The map as HTML. opts.label(name, kind) gives a chest's or label's name as HTML (the notes page passes its
     own formatting, so in-game names get their icon and the game-language name). */
  function render(map, opts = {}) {
    const H = n(100 * map.ratio);
    const to = ([x, y]) => [n(x), n(y * map.ratio)];
    const label = opts.label || (s => escAttr(s));
    const trails = map.trails.map(p => smooth(p.map(to)));
    const routes = map.routes.map(p => p.map(to));
    // a name moved away from its point gets a thin line back to it
    const leaders = [...map.chests, ...map.labels].filter(o => o.off && Math.hypot(o.off[0], o.off[1]) > 4).map(o => {
      const [x1, y1] = to(o.at), [x2, y2] = to([o.at[0] + o.off[0], o.at[1] + o.off[1]]);
      return `<line class="leader" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    });
    const svg = `<svg viewBox="0 0 100 ${H}" aria-hidden="true">
      <rect class="bg" width="100" height="${H}" rx="2"/>
      ${trails.map(d => `<path class="trail-edge" d="${d}"/>`).join("")}
      ${trails.map(d => `<path class="trail" d="${d}"/>`).join("")}
      ${routes.map(p => `<path class="route-glow" d="${smooth(p)}"/>`).join("")}
      ${routes.map(p => `<path class="route" d="${smooth(p)}"/>${arrow(p)}<circle class="start" cx="${p[0][0]}" cy="${p[0][1]}" r="1.1"/>`).join("")}
      ${leaders.join("")}
      ${map.chests.map(c => { const [x, y] = to(c.at); return `<circle class="chest-glow" cx="${x}" cy="${y}" r="3"/><circle class="chest" cx="${x}" cy="${y}" r="1.5"/>`; }).join("")}
      ${map.labels.map(l => { const [x, y] = to(l.at); return `<circle class="spot" cx="${x}" cy="${y}" r=".9"/>`; }).join("")}
    </svg>`;
    const place = (o, kind, i) => {
      const [x, y] = o.off ? [o.at[0] + o.off[0], o.at[1] + o.off[1]] : o.at;
      const side = o.off ? "free" : o.side || (x > 62 ? "left" : "right");
      return `<span class="mlabel ${kind} ${side}" data-ref="${kind}s:${i}" style="left:${n(x)}%;top:${n(y)}%">${label(o.name, kind)}</span>`;
    };
    return `<div class="nmap" style="aspect-ratio:100/${H}">${svg}${map.chests.map((c, i) => place(c, "chest", i)).join("")}${map.labels.map((l, i) => place(l, "label", i)).join("")}</div>`
      + (map.by ? `<p class="nmap-by">Map based on one by ${escAttr(map.by)}</p>` : "");
  }

  /* back to text, for the editor: the lines of a map file */
  function serialize(map) {
    const f = v => +v.toFixed(1);
    const pts = p => p.map(q => q.map(f).join(",")).join(" ");
    const one = o => `${f(o.at[0])},${f(o.at[1])} ${o.name}${o.off ? ` | ${f(o.off[0])},${f(o.off[1])}` : o.side ? ` | ${o.side}` : ""}`;
    return [
      ...(Math.abs(map.ratio - 1) > .001 ? [`size: 100x${f(100 * map.ratio)}`] : []),
      ...map.trails.filter(p => p.length > 1).map(p => `trail: ${pts(p)}`),
      ...map.routes.filter(p => p.length > 1).map(p => `route: ${pts(p)}`),
      ...map.chests.map(c => `chest: ${one(c)}`),
      ...map.labels.map(l => `label: ${one(l)}`),
      ...(map.by ? [`by: ${map.by}`] : []),
    ].join("\n");
  }

  window.NotesMap = { parse, merge, render, serialize, points };
})();
