/* Sphere Grid blocks in the run notes: each ":::spheregrid" block's route, drawn and animated on the grid.
   The route itself is played by assets/route-engine.js, the same engine as the Sphere Grid page.
   A route that says "after": "…" starts where that route ends, so each segment carries on from the last.

   NotesGrid.create(category) gives mountGrid(svg), which draws the route named in the svg's data-route.
   Needs grid-icons.js, grid-layout.js, route-engine.js and notes-config.js first. */
(() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function create(CAT) {
    let gridData, ENGINE;
    const getGrid = () => gridData ||= NotesConfig.loadGrid(CAT).then(g => { ENGINE = RouteEngine.create(g); return g; });
    const loadRoute = NotesConfig.routeLoader(CAT.id);   // notes/<category>/sphere-grid/<name>.json
    async function mountGrid(svg) {
      const name = svg.dataset.route;
      if (!name) { svg.outerHTML = `<div class="gerr">No route linked yet.</div>`; return; }
      if (!svg.isConnected) return;
      let grid, route, start;
      try { grid = await getGrid(); ({ route, start } = await RouteEngine.resolve(ENGINE, name, loadRoute)); }
      catch { svg.outerHTML = `<div class="gerr">Couldn't load route “${esc(name)}”.</div>`; return; }
      const L = window.GridLayout, TYPES = window.GRID_TYPES, CH = window.GRID_CHARACTERS, R = grid.meta.nodeRadius;
      const { N, edgeByKey: edgeBy } = ENGINE;
      const res = ENGINE.run(route, start);
      // frames to animate: the start, then every move, unlock, teleport and activation
      const frames = [{ state: res.start, ev: "start" }, ...res.steps.flatMap(st => st.subs.map(sb => ({ state: sb.state, ev: sb.action, node: sb.node })))];
      const who = new Set(route.steps.map(st => st.character).filter(c => c in res.start.pos));
      const touched = new Set([...[...who].map(c => res.start.pos[c]), ...res.steps.flatMap(st => st.focus)]);
      const t = ENGINE.totals(res), moves = res.steps.reduce((a, st) => a + st.moves, 0);
      const info = svg.closest(".g")?.querySelector(".ginfo");
      if (info) info.innerHTML = [moves ? `${moves} move${moves > 1 ? "s" : ""}` : "",
        ...Object.entries(t.levels).filter(([, v]) => v).map(([c, v]) => `${esc(CH[c]?.name || c)} ${v} S.Lvl`),
        res.problems.length ? `<span class="gwarn" title="${esc(res.problems.join("\n"))}">⚠ ${res.problems.length} problem${res.problems.length > 1 ? "s" : ""}</span>` : ""]
        .filter(Boolean).join(" · ");
      // camera: frame everything this route touches
      const ps = [...touched].map(id => N.get(id));
      let x0 = Math.min(...ps.map(p => p.x)), x1 = Math.max(...ps.map(p => p.x)), y0 = Math.min(...ps.map(p => p.y)), y1 = Math.max(...ps.map(p => p.y));
      let w = Math.max(x1 - x0 + R * 12, R * 22), h = Math.max(y1 - y0 + R * 12, w * 0.75); w = Math.max(w, h / 0.75);
      const box = { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
      svg.setAttribute("viewBox", `${box.x} ${box.y} ${box.w} ${box.h}`);
      const inBox = n => n.x > box.x - R * 6 && n.x < box.x + box.w + R * 6 && n.y > box.y - R * 6 && n.y < box.y + box.h + R * 6;
      const nodes = grid.nodes.filter(inBox), edges = grid.edges.filter(e => inBox(N.get(e.a)) || inBox(N.get(e.b)));
      const icon = (n, cls = "") => `<g class="${cls}" transform="translate(${n.x} ${n.y})"><g><g transform="scale(${L.nodeRadius(n, R)})">${gridIcon(n.type)}</g></g></g>`;
      const routeNodes = new Set(res.steps.flatMap(st => st.targets));
      const labels = [...routeNodes].map(id => {
        const n = N.get(id), t = TYPES[n.type];
        if (n.name) { const b = L.labelBox(n, "name", R);
          return `<g class="lbl" data-n="${id}"><rect x="${b.cx - b.w / 2}" y="${b.cy - b.h / 2}" width="${b.w}" height="${b.h}" rx="${R * .3}" fill="#8a3fd1" stroke="#fff" stroke-width="${R * .08}"/>
            <text x="${b.cx}" y="${b.cy}" dominant-baseline="central" text-anchor="middle" font-size="${R * .85}" fill="#fff">${esc(n.name)}</text></g>`; }
        if (n.value) { const b = L.labelBox(n, "value", R);
          return `<text class="lbl" data-n="${id}" x="${b.cx}" y="${b.cy}" dominant-baseline="central" text-anchor="middle" font-size="${R * .75}" font-weight="700" fill="${t.ink || "#333"}" stroke="#fff" stroke-width="${R * .2}" paint-order="stroke">${esc(n.value)}</text>`; }
        return "";
      }).join("");
      svg.innerHTML = `<g class="gbase">${edges.map(e => `<path class="edge" d="${L.edgePath(N.get(e.a), N.get(e.b), e.bend)}" stroke-width="${R * .45}"/>`).join("")}${nodes.map(n => icon(n)).join("")}</g>
        <g class="gwalk"></g><g class="gtrack"></g><g class="gact"></g><g class="ghere"></g><g class="glbl">${labels}</g><g class="gtags"></g>`;
      const layer = c => svg.querySelector("." + c);
      const tags = {};
      for (const c of who) {
        const nm = CH[c]?.name || c, tw = nm.length * R * .62 + R;
        layer("gtags").insertAdjacentHTML("beforeend", `<g class="tag" data-c="${c}"><rect x="${-tw / 2}" y="0" width="${tw}" height="${R * 1.45}" rx="${R * .2}" fill="${CH[c]?.color}" stroke="#fff" stroke-width="${R * .1}"/>
          <text y="${R * .75}" text-anchor="middle" dominant-baseline="central" font-size="${R * .95}">${esc(nm)}</text></g>`);
        tags[c] = layer("gtags").lastElementChild;
      }
      function draw(fr) {
        const f = fr.state;
        layer("gwalk").innerHTML = [...f.walk].map(([k, c]) => { const e = edgeBy.get(k);
          return `<path class="walk" d="${L.edgePath(N.get(e.a), N.get(e.b), e.bend)}" stroke="${CH[c]?.color}" stroke-width="${R * .55}"/>`; }).join("");
        const onTrack = new Set(); for (const k of f.walk.keys()) for (const id of k.split("|")) if (!f.act.has(id) && !f.unlocked.has(id)) onTrack.add(id);
        layer("gtrack").innerHTML = [...onTrack].map(id => { const n = N.get(id);
          return `<g transform="translate(${n.x} ${n.y}) scale(${L.nodeRadius(n, R)})"><circle r="1" fill="var(--grid-bg)"/><g class="ico">${gridIcon(n.type)}</g></g>`; }).join("")
          + [...f.unlocked].map(id => { const n = N.get(id);   // an unlocked lock becomes an empty node
            return `<g transform="translate(${n.x} ${n.y})"><circle r="${R * 1.04}" fill="var(--grid-bg)"/><g class="ico" transform="scale(${R * .65})">${gridIcon("empty")}</g></g>`; }).join("");
        layer("gact").innerHTML = [...f.act.keys()].map(id => icon(N.get(id), fr.ev === "activate" && fr.node === id ? "pop" : "")).join("");
        layer("ghere").innerHTML = [...who].map(c => { const n = N.get(f.pos[c]);
          return `<circle cx="${n.x}" cy="${n.y}" r="${L.nodeRadius(n, R) + R * .32}" fill="none" stroke="${CH[c]?.color}" stroke-width="${R * .24}"/>`; }).join("");
        for (const e of layer("glbl").children) e.classList.toggle("on", f.act.has(e.dataset.n));
        for (const c of who) { const n = N.get(f.pos[c]); tags[c].style.transform = `translate(${n.x}px, ${n.y + L.nodeRadius(n, R) + R * 1.55}px)`; }
      }
      let tok = 0;
      svg.play = async () => {
        const my = ++tok;
        for (const f of frames) { if (my !== tok) return; draw(f); await new Promise(r => setTimeout(r, f.ev === "start" ? 400 : f.ev === "move" ? 320 : 450)); }
      };
      svg.showEnd = () => { tok++; draw(frames.at(-1)); };
      svg.showStart = () => { tok++; draw(frames[0]); };
      svg.showStart();
      svg.closest(".g").querySelector(".replay").onclick = e => { e.stopPropagation(); svg.play(); };
    }
    return mountGrid;
  }

  window.NotesGrid = { create };
})();
