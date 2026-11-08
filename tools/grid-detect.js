/* Sphere Grid auto-detection.
   detectGrid(imageData, options) → { nodes, edges, report }

   1. Nodes: black outline rings (normal nodes ≈ r 12, empty nodes ≈ r 7.5).
   2. Types: each node is compared with the legend down the right-hand side of the
      image, which shows one example of every node type (Strength … Lock 4).
   3. Links: for nearby pairs of nodes, straight lines and circular arcs are tested
      for unbroken coloured "ink" between the two outlines.
   Everything it is unsure about is flagged with `check: true` for review in the editor. */
(function () {
  const LEGEND_ORDER = ["str", "def", "hp", "mag", "spr", "mp", "agl", "acc", "eva",
    "skill", "spec", "wmag", "bmag", "luck", "lock1", "lock2", "lock3", "lock4"];

  function detectGrid(img, o = {}) {
    const t0 = performance.now();
    const W = img.width, H = img.height, d = img.data;
    const R = o.nodeR ?? 12.5, ER = o.emptyR ?? 8;

    /* ---- pixel masks ---- */
    // black: solid black (centres, fills). dark: also catches thin anti-aliased outlines.
    const black = new Uint8Array(W * H), dark = new Uint8Array(W * H), ink = new Uint8Array(W * H);
    for (let i = 0, p = 0; i < W * H; i++, p += 4) {
      const r = d[p], g = d[p + 1], b = d[p + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      black[i] = mx < 60 ? 1 : 0;
      dark[i] = mx < 110 ? 1 : 0;
      ink[i] = (mn < 205 || mx - mn > 40) ? 1 : 0;
    }
    const isBlack = (x, y) => x >= 0 && y >= 0 && x < W && y < H && black[y * W + x] === 1;
    const isDark = (x, y) => x >= 0 && y >= 0 && x < W && y < H && dark[y * W + x] === 1;
    const isInk = (x, y) => x >= 0 && y >= 0 && x < W && y < H && ink[y * W + x] === 1;

    /* ---- 1. ring detection ---- */
    function ringOffsets(radii, n) {
      const out = [];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        out.push(radii.map(r => [Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r)]));
      }
      return out;
    }
    const BIG = ringOffsets([R - 1.5, R - 0.5, R + 0.5, R + 1.5], 40), BIG_IN = ringOffsets([R - 6], 16);
    const SMALL = ringOffsets([ER - 1, ER, ER + 1], 28), SMALL_MID = ringOffsets([ER - 2.5], 12);

    function ringScore(x, y, ring, maxMiss) {
      let hit = 0, miss = 0;
      for (const radii of ring) {
        let ok = false;
        for (const [dx, dy] of radii) if (isDark(x + dx, y + dy)) { ok = true; break; }
        if (ok) hit++; else if (++miss > maxMiss) return -1;
      }
      return hit;
    }
    const fracBlack = (x, y, ring) => ring.reduce((s, [[dx, dy]]) => s + (isBlack(x + dx, y + dy) ? 1 : 0), 0) / ring.length;

    const cands = [];
    const m = Math.ceil(R + 2);
    for (let y = m; y < H - m; y++) {
      for (let x = m; x < W - m; x++) {
        let s = ringScore(x, y, BIG, 5);
        if (s >= 0 && fracBlack(x, y, BIG_IN) < 0.6) { cands.push({ x, y, s: s / BIG.length, kind: "big" }); continue; }
        if (!isBlack(x, y)) continue;                          // empty nodes have a black centre
        s = ringScore(x, y, SMALL, 3);
        if (s >= 0 && fracBlack(x, y, SMALL_MID) < 0.35) cands.push({ x, y, s: s / SMALL.length, kind: "empty" });
      }
    }
    /* non-maximum suppression + centroid refinement */
    cands.sort((a, b) => b.s - a.s);
    const found = [];
    for (const c of cands) {
      if (found.some(f => (f.x - c.x) ** 2 + (f.y - c.y) ** 2 < 12 * 12)) continue;
      found.push(c);
    }
    for (const f of found) {
      let sx = 0, sy = 0, n = 0;
      for (const c of cands) if (c.kind === f.kind && c.s >= f.s - 0.03 && Math.abs(c.x - f.x) <= 3 && Math.abs(c.y - f.y) <= 3) { sx += c.x; sy += c.y; n++; }
      f.x = sx / n; f.y = sy / n;
    }
    const tRings = performance.now();

    /* ---- 2. classification against the legend ---- */
    /* Legend = the largest vertical column of nodes (same x within a few px) in the right-hand 20% of the image */
    let legendCol = [];
    for (const f of found) {
      if (f.x < W * 0.8) continue;
      const col = found.filter(g => Math.abs(g.x - f.x) < 4).sort((a, b) => a.y - b.y);
      // keep the longest run of evenly stacked entries (gaps < 50px)
      let run = [col[0]], bestRun = run;
      for (let k = 1; k < col.length; k++) {
        if (col[k].y - col[k - 1].y < 50) run.push(col[k]); else run = [col[k]];
        if (run.length > bestRun.length) bestRun = run;
      }
      if (bestRun.length > legendCol.length) legendCol = bestRun.slice();
    }
    if (legendCol.length < 10) legendCol = [];
    const inLegend = new Set(legendCol);
    const legendBig = legendCol.filter(f => f.kind === "big").sort((a, b) => a.y - b.y);
    const nodes = found.filter(f => !inLegend.has(f));
    const PATCH = [];
    for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) if (dx * dx + dy * dy <= 81) PATCH.push([dx, dy]);
    const patch = (cx, cy) => {
      const out = new Float32Array(PATCH.length * 3);
      PATCH.forEach(([dx, dy], i) => {
        const x = Math.round(cx) + dx, y = Math.round(cy) + dy, p = (y * W + x) * 4;
        out[i * 3] = d[p]; out[i * 3 + 1] = d[p + 1]; out[i * 3 + 2] = d[p + 2];
      });
      return out;
    };
    const dist = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) { const v = a[i] - b[i]; s += v * v; } return s / a.length; };

    let templates = null;
    const report = { legendFound: legendBig.length, legend: legendCol.map(f => [Math.round(f.x), Math.round(f.y), f.kind]) };
    if (legendBig.length === LEGEND_ORDER.length) {
      templates = legendBig.map((f, i) => ({ type: LEGEND_ORDER[i], px: patch(f.x, f.y) }));
    } else report.warning = `Expected a legend column of ${LEGEND_ORDER.length} node types, found ${legendBig.length}. Types not classified.`;

    for (const n of nodes) {
      if (n.kind === "empty") { n.type = "empty"; continue; }
      if (!templates) { n.type = "str"; n.check = true; continue; }
      const scores = {};
      for (let sy = -1; sy <= 1; sy++) for (let sx = -1; sx <= 1; sx++) {
        const p = patch(n.x + sx, n.y + sy);
        for (const t of templates) { const v = dist(p, t.px); if (!(t.type in scores) || v < scores[t.type]) scores[t.type] = v; }
      }
      const ranked = Object.entries(scores).sort((a, b) => a[1] - b[1]);
      n.type = ranked[0][0];
      n.margin = ranked[1][1] / Math.max(ranked[0][1], 1);    // how clearly the best match won
      if (n.margin < (o.minMargin ?? 1.35)) { n.check = true; n.alt = ranked[1][0]; }
    }
    const tTypes = performance.now();

    /* ---- 3. links ---- */
    const cell = 64, grid = new Map();
    const key = (cx, cy) => cx + "," + cy;
    nodes.forEach((n, i) => { const k = key(Math.floor(n.x / cell), Math.floor(n.y / cell)); (grid.get(k) || grid.set(k, []).get(k)).push(i); });
    const near = (x, y, r) => {
      const out = [];
      for (let cy = Math.floor((y - r) / cell); cy <= Math.floor((y + r) / cell); cy++)
        for (let cx = Math.floor((x - r) / cell); cx <= Math.floor((x + r) / cell); cx++)
          for (const i of grid.get(key(cx, cy)) || []) if ((nodes[i].x - x) ** 2 + (nodes[i].y - y) ** 2 <= r * r) out.push(i);
      return out;
    };
    const rad = n => n.kind === "empty" ? ER : R;

    /* Points along a straight line (bend 0) or circular arc; bend = signed sagitta, same convention as the editor */
    function* pathPoints(A, B, bend, step) {
      const dx = B.x - A.x, dy = B.y - A.y, c = Math.hypot(dx, dy), nx = -dy / c, ny = dx / c;
      if (!bend) { const n = Math.ceil(c / step); for (let k = 1; k < n; k++) yield [A.x + dx * k / n, A.y + dy * k / n]; return; }
      const r = (bend * bend + c * c / 4) / (2 * Math.abs(bend));
      const off = bend - Math.sign(bend) * r;
      const ox = (A.x + B.x) / 2 + nx * off, oy = (A.y + B.y) / 2 + ny * off;
      const mx = (A.x + B.x) / 2 + nx * bend, my = (A.y + B.y) / 2 + ny * bend;
      const a0 = Math.atan2(A.y - oy, A.x - ox), a1 = Math.atan2(B.y - oy, B.x - ox), am = Math.atan2(my - oy, mx - ox);
      const TAU = Math.PI * 2, mod = v => ((v % TAU) + TAU) % TAU;
      const d1 = mod(a1 - a0), dm = mod(am - a0);
      const span = dm < d1 ? d1 : -(TAU - d1);
      const n = Math.ceil(Math.abs(span) * r / step);
      for (let k = 1; k < n; k++) { const a = a0 + span * k / n; yield [ox + Math.cos(a) * r, oy + Math.sin(a) * r]; }
    }
    function pathScore(ia, ib, bend, budget) {
      const A = nodes[ia], B = nodes[ib], ra = rad(A) + 1.5, rb = rad(B) + 1.5;
      let hit = 0, total = 0, miss = 0;
      for (const [x, y] of pathPoints(A, B, bend, 1.5)) {
        if ((x - A.x) ** 2 + (y - A.y) ** 2 < ra * ra || (x - B.x) ** 2 + (y - B.y) ** 2 < rb * rb) continue;
        for (const j of near(x, y, R + 2)) if (j !== ia && j !== ib && (nodes[j].x - x) ** 2 + (nodes[j].y - y) ** 2 < (rad(nodes[j]) - 1) ** 2) return 0;
        total++;
        const px = Math.round(x), py = Math.round(y);
        if (isInk(px, py) || isInk(px + 1, py) || isInk(px - 1, py) || isInk(px, py + 1) || isInk(px, py - 1)) hit++;
        else if (++miss > budget) return 0;
      }
      return total < 2 ? (total ? hit / total : 0) : hit / total;
    }

    const edges = [];
    const maxStraight = o.maxStraight ?? 420, maxArc = o.maxArc ?? 260, need = o.linkScore ?? 0.92;
    for (let i = 0; i < nodes.length; i++) {
      for (const j of near(nodes[i].x, nodes[i].y, maxStraight)) {
        if (j <= i) continue;
        const A = nodes[i], B = nodes[j], c = Math.hypot(B.x - A.x, B.y - A.y);
        const budget = Math.max(1, Math.floor(c / 1.5 * (1 - need)));
        let best = pathScore(i, j, 0, budget), bestBends = best >= need ? [0] : [];
        if (c <= maxArc) {
          const lim = Math.min(c / 2, 90);
          for (let b = 3; b <= lim; b += 1.5) for (const sb of [b, -b]) {
            const s = pathScore(i, j, sb, budget);
            if (s > best + 0.02) { best = s; bestBends = s >= need ? [sb] : []; }
            else if (s >= need && s >= best - 0.02) bestBends.push(sb);
          }
        }
        if (best < need || !bestBends.length) continue;
        // centre of the passing range on the winning side (a 4px line passes a band of bends)
        const side = Math.sign(bestBends.reduce((s, b) => s + b, 0)) || 0;
        const same = bestBends.filter(b => Math.sign(b) === side || (side === 0 && b === 0));
        const bend = side === 0 ? 0 : Math.round((Math.min(...same.map(Math.abs)) + Math.max(...same.map(Math.abs))) / 2 * side);
        edges.push({ a: i, b: j, bend, score: best });
      }
    }
    const tEdges = performance.now();

    /* ---- output in editor format ---- */
    const order = nodes.map((n, i) => i).sort((p, q) => Math.round(nodes[p].y / 20) - Math.round(nodes[q].y / 20) || nodes[p].x - nodes[q].x);
    const id = new Map(order.map((i, k) => [i, "n" + (k + 1)]));
    const outNodes = order.map(i => {
      const n = nodes[i], o2 = { id: id.get(i), x: Math.round(n.x * 10) / 10, y: Math.round(n.y * 10) / 10, type: n.type };
      if (n.check) o2.check = n.alt ? `type? maybe ${n.alt}` : "type?";
      return o2;
    });
    const linked = new Set(edges.flatMap(e => [e.a, e.b]));
    nodes.forEach((n, i) => { if (!linked.has(i)) { const on = outNodes.find(x => x.id === id.get(i)); on.check = (on.check ? on.check + "; " : "") + "no links found"; } });
    const outEdges = edges.map(e => { const x = { a: id.get(e.a), b: id.get(e.b) }; if (e.bend) x.bend = e.bend; return x; });

    Object.assign(report, {
      nodes: outNodes.length, empty: nodes.filter(n => n.kind === "empty").length,
      edges: outEdges.length, flagged: outNodes.filter(n => n.check).length,
      ms: { rings: Math.round(tRings - t0), types: Math.round(tTypes - tRings), links: Math.round(tEdges - tTypes) },
    });
    return { nodes: outNodes, edges: outEdges, report };
  }

  window.detectGrid = detectGrid;
})();
