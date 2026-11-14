/* Sphere Grid route engine, shared by the route player, the run notes page and the route builder.

   RouteEngine.create(grid) → an engine for one grid file (sphere-grid/standard.json). It plays a route file step by step and
   reports what happened: every in-between state (for animation), moves, Sphere Levels, spheres used,
   and anything the game wouldn't allow.

   A route file:
     {
       "title": "…",
       "after": "besaid-tidus",            optional: start where that route ends (chained segments)
       "start": { "tidus": "n247" },       optional: put characters on nodes first (experiments, challenge runs)
       "steps": [ { "character": "tidus", … }, … ]
     }
   Each step is one character's turn in the menu, done in this order:
     "teleport": { "sphere": "Return", "to": "n538" }   Teleport, Return, Friend or Warp sphere
                 (the older "teleport": "n538" and "warp": "n538" still work)
     "move": "n247"  or  ["n232", "n222", "n247"]       walk there (cheapest path), or along exactly these nodes
     "unlock": ["n266"]                                  open Level 1–4 locks on or next to you; they become empty nodes
     "activate": ["n222", "n256"]                        activate nodes on or next to you
                 (for a node further away, the character first walks next to it, as older routes expect)
   "spheres" is worked out from the nodes; a value written in the route is kept, with a warning if it differs.

   Sphere Levels: each move onto a new link costs 1. Moving back along links the character has already
   walked costs 1 per 4 of them, rounded up, per move. Teleports, unlocking and activating cost none. */
(function () {
  const SPHERE_FOR = {
    str: "Power", def: "Power", hp: "Power",
    mag: "Mana", spr: "Mana", mp: "Mana",
    agl: "Speed", acc: "Speed", eva: "Speed",
    skill: "Ability", spec: "Ability", wmag: "Ability", bmag: "Ability",
    luck: "Fortune",
    lock1: "Key Lv1", lock2: "Key Lv2", lock3: "Key Lv3", lock4: "Key Lv4",
  };
  const TELEPORTS = ["Teleport", "Return", "Friend", "Warp"];
  const TELEPORT_RULE = {
    Teleport: "any activated node",
    Return: "a node this character activated",
    Friend: "where another character stands",
    Warp: "any node",
  };

  function create(grid) {
    const TYPES = window.GRID_TYPES, CHARS = window.GRID_CHARACTERS || {};
    const N = new Map(grid.nodes.map(n => [n.id, n]));
    const adj = new Map(), edgeByKey = new Map();
    const ek = (a, b) => (a < b ? a + "|" + b : b + "|" + a);
    for (const e of grid.edges) {
      (adj.get(e.a) || adj.set(e.a, []).get(e.a)).push(e.b);
      (adj.get(e.b) || adj.set(e.b, []).get(e.b)).push(e.a);
      edgeByKey.set(ek(e.a, e.b), e);
    }
    const starts = {};
    for (const n of grid.nodes) if (n.start) starts[n.start] = n.id;
    const characters = Object.keys(starts);

    const type = id => TYPES[N.get(id)?.type] || {};
    const isLock = id => !!type(id).lock;
    const neighbours = id => adj.get(id) || [];
    const near = (a, b) => a === b || neighbours(a).includes(b);
    const sphereFor = id => SPHERE_FOR[N.get(id)?.type] || null;
    const charName = c => CHARS[c]?.name || c;
    const nodeName = id => {
      const n = N.get(id); if (!n) return id;
      const t = TYPES[n.type] || {};
      return n.name || (n.value ? `${n.value} ${t.label}` : t.label || n.type);
    };
    /* a lock blocks the way until someone unlocks it */
    const blocked = (s, id) => isLock(id) && !s.unlocked.has(id);

    /* ---------- state ---------- */
    function initialState() {
      const per = f => Object.fromEntries(characters.map(c => [c, f()]));
      return {
        pos: { ...starts },
        act: new Map(),        // node → the first character to activate it (its colour on the grid)
        actBy: per(() => new Set()),   // each character's own activated nodes
        walk: new Map(),       // link → the first character to walk it (drawn in their colour)
        walked: per(() => new Set()),  // each character's own walked links (for Sphere Levels)
        unlocked: new Set(),
        teles: [],             // this segment's teleports, drawn as arcs
        levels: per(() => 0),  // Sphere Levels spent
      };
    }
    function clone(s) {
      const per = o => Object.fromEntries(Object.entries(o).map(([c, v]) => [c, new Set(v)]));
      return {
        pos: { ...s.pos }, act: new Map(s.act), actBy: per(s.actBy), walk: new Map(s.walk), walked: per(s.walked),
        unlocked: new Set(s.unlocked), teles: [...s.teles], levels: { ...s.levels },
      };
    }
    /* the state a route starts from: after its "after" route, then its "start" positions */
    function startOf(route, prev) {
      const s = clone(prev || initialState());
      s.teles = [];
      for (const [c, id] of Object.entries(route.start || {})) if (N.has(id)) s.pos[c] = id;
      return s;
    }

    /* ---------- moving ---------- */
    /* the cheapest walk in Sphere Levels: links already walked by this character count a quarter */
    function path(s, ch, from, to, { ontoTarget = false } = {}) {
      if (from === to) return [];
      const dist = new Map([[from, 0]]), prev = new Map(), done = new Set();
      const walked = s.walked[ch] || new Set();
      while (true) {
        let cur = null, best = Infinity;
        for (const [id, d] of dist) if (!done.has(id) && d < best) { best = d; cur = id; }
        if (cur === null) return null;
        if (cur === to) break;
        done.add(cur);
        for (const nb of neighbours(cur)) {
          if (done.has(nb) || (blocked(s, nb) && !(ontoTarget && nb === to))) continue;
          const d = best + (walked.has(ek(cur, nb)) ? 0.25 : 1);
          if (d < (dist.get(nb) ?? Infinity)) { dist.set(nb, d); prev.set(nb, cur); }
        }
      }
      const out = [];
      for (let c = to; c !== from; c = prev.get(c)) out.unshift(c);
      return out;
    }
    /* Sphere Levels for one move along these nodes */
    function moveCost(s, ch, from, nodes) {
      let fresh = 0, old = 0, at = from;
      for (const n of nodes) { (s.walked[ch]?.has(ek(at, n)) ? old++ : fresh++); at = n; }
      return fresh + Math.ceil(old / 4);
    }
    /* where a teleport sphere can take this character */
    function canTeleport(s, ch, sphere, to) {
      if (!N.has(to) || blocked(s, to)) return false;
      if (sphere === "Warp") return true;
      if (sphere === "Teleport") return s.act.has(to);
      if (sphere === "Return") return !!s.actBy[ch]?.has(to);
      if (sphere === "Friend") return Object.entries(s.pos).some(([c, p]) => c !== ch && p === to);
      return false;
    }
    const teleportTargets = (s, ch, sphere) => grid.nodes.map(n => n.id).filter(id => id !== s.pos[ch] && canTeleport(s, ch, sphere, id));
    /* why a node can't be activated by this character right now, or "" if it can */
    function whyNotActivate(s, ch, id) {
      const n = N.get(id);
      if (!n) return `${id} isn't on the grid`;
      if (n.type === "empty") return `${nodeName(id)} is an empty node`;
      if (isLock(id)) return `${nodeName(id)} is a lock: unlock it instead`;
      if (s.actBy[ch]?.has(id)) return `${charName(ch)} has already activated ${nodeName(id)}`;
      if (!near(s.pos[ch], id)) return `${nodeName(id)} isn't on or next to ${charName(ch)}`;
      return "";
    }
    function whyNotUnlock(s, ch, id) {
      if (!isLock(id)) return `${nodeName(id)} isn't a lock`;
      if (s.unlocked.has(id)) return `${nodeName(id)} is already unlocked`;
      if (!near(s.pos[ch], id)) return `${nodeName(id)} isn't next to ${charName(ch)}`;
      return "";
    }
    const teleportOf = step => {
      if (step.teleport && typeof step.teleport === "object") return { sphere: step.teleport.sphere || "Teleport", to: step.teleport.to };
      if (step.teleport) return { sphere: "Teleport", to: step.teleport };
      if (step.warp) return { sphere: "Warp", to: step.warp };
      return null;
    };
    const list = v => (v == null ? [] : Array.isArray(v) ? v : [v]);

    /* ---------- playing a route ---------- */
    /* → { start, end, steps: [{ step, ch, subs: [{ state, action, ch, node }], focus, targets, moves, levels, spheres, saves, problems }], problems } */
    function run(route, startState) {
      let s = startState ? clone(startState) : startOf(route);
      const start = clone(s), out = [], all = [];
      (route.steps || []).forEach((step, i) => {
        const ch = step.character;
        const info = { step, ch, subs: [], focus: [s.pos[ch]], targets: [], moves: 0, levels: 0, spheres: {}, saves: null, problems: [] };
        const warn = msg => { info.problems.push(msg); all.push(`Step ${i + 1}: ${msg}`); };
        const use = (k, n = 1) => { if (k) info.spheres[k] = (info.spheres[k] || 0) + n; };
        const snap = (action, node) => info.subs.push({ state: s, action, ch, node });
        if (!(ch in s.pos)) { warn(`unknown character "${ch}"`); out.push(info); return; }

        /* one Move in the menu: its Sphere Level cost is worked out before the links count as walked */
        const walkAlong = nodes => {
          const cost = moveCost(s, ch, s.pos[ch], nodes);
          info.levels += cost;
          s = clone(s);
          s.levels[ch] += cost;
          for (const n of nodes) {
            const k = ek(s.pos[ch], n);
            s = clone(s);
            if (!s.walk.has(k)) s.walk.set(k, ch);
            s.walked[ch].add(k);
            s.pos[ch] = n;
            snap("move", n);
            info.focus.push(n);
          }
          info.moves += nodes.length;
        };
        const walkTo = (to, opts) => {
          const p = path(s, ch, s.pos[ch], to, { ontoTarget: !!opts?.nextTo });
          if (!p) { warn(`${charName(ch)} can't reach ${nodeName(to)}`); return false; }
          if (opts?.nextTo) p.pop();   // stop next to it
          walkAlong(p);
          return true;
        };

        // teleport
        const tp = teleportOf(step);
        if (tp) {
          if (!TELEPORTS.includes(tp.sphere)) warn(`"${tp.sphere}" isn't a teleporting sphere`);
          else if (!canTeleport(s, ch, tp.sphere, tp.to)) warn(`a ${tp.sphere} Sphere can't take ${charName(ch)} to ${nodeName(tp.to)} (it goes to ${TELEPORT_RULE[tp.sphere]})`);
          info.saves = path(s, ch, s.pos[ch], tp.to)?.length ?? null;
          s = clone(s);
          s.teles.push({ ch, from: s.pos[ch], to: tp.to, sphere: tp.sphere });
          s.pos[ch] = tp.to;
          use(tp.sphere);
          info.targets.push(tp.to); info.focus.push(tp.to);
          snap("teleport", tp.to);
        }

        // move: to a node (cheapest path), or along an exact list of nodes
        if (Array.isArray(step.move)) {
          let at = s.pos[ch], ok = true;
          for (const n of step.move) {
            if (!neighbours(at).includes(n)) { warn(`${nodeName(n)} isn't next to ${nodeName(at)}`); ok = false; break; }
            if (blocked(s, n)) { warn(`${nodeName(n)} is locked`); ok = false; break; }
            at = n;
          }
          if (ok) walkAlong(step.move);
        } else if (step.move) walkTo(step.move);

        // unlock (older routes "activate" a lock instead)
        const unlocks = [...list(step.unlock), ...list(step.activate).filter(isLock)];
        for (const id of unlocks) {
          if (!near(s.pos[ch], id) && isLock(id) && !s.unlocked.has(id)) walkTo(id, { nextTo: true });
          const why = whyNotUnlock(s, ch, id);
          if (why) { warn(why); continue; }
          s = clone(s); s.unlocked.add(id);
          use(sphereFor(id));
          info.targets.push(id); info.focus.push(id);
          snap("unlock", id);
        }

        // activate
        for (const id of list(step.activate).filter(id => !isLock(id))) {
          if (N.has(id) && !near(s.pos[ch], id)) walkTo(id, { nextTo: true });   // older routes: walk next to it first
          const why = whyNotActivate(s, ch, id);
          if (why) { warn(why); continue; }
          s = clone(s);
          if (!s.act.has(id)) s.act.set(id, ch);
          s.actBy[ch].add(id);
          use(sphereFor(id));
          info.targets.push(id); info.focus.push(id);
          snap("activate", id);
        }

        if (step.spheres) {
          const a = JSON.stringify(Object.entries(step.spheres).sort()), b = JSON.stringify(Object.entries(info.spheres).sort());
          if (a !== b) warn(`spheres written as ${a}, but the nodes use ${b}`);
          info.spheres = { ...step.spheres };
        }
        out.push(info);
      });
      return { start, end: s, steps: out, problems: all };
    }

    /* totals for a whole route: spheres and Sphere Levels per character */
    function totals(result) {
      const spheres = {}, levels = {};
      for (const st of result.steps) {
        for (const [k, v] of Object.entries(st.spheres)) spheres[k] = (spheres[k] || 0) + v;
        levels[st.ch] = (levels[st.ch] || 0) + st.levels;
      }
      return { spheres, levels };
    }

    return {
      grid, N, adj, ek, edgeByKey, starts, characters,
      isLock, neighbours, near, sphereFor, nodeName, charName,
      initialState, clone, startOf, path, moveCost, canTeleport, teleportTargets, whyNotActivate, whyNotUnlock,
      run, totals,
    };
  }

  /* Loads a route and plays everything it chains from ("after"), so it starts in the right place.
     load(name) → Promise of the route file. Returns { route, start } (start: the state it begins from). */
  async function resolve(engine, name, load, seen = new Set()) {
    if (seen.has(name)) throw new Error(`Routes chain in a loop at "${name}"`);
    seen.add(name);
    const route = await load(name);
    let prev = null;
    if (route.after) {
      const before = await resolve(engine, route.after, load, seen);
      prev = engine.run(before.route, before.start).end;
    }
    return { route, start: engine.startOf(route, prev) };
  }

  window.RouteEngine = { create, resolve, SPHERE_FOR, TELEPORTS, TELEPORT_RULE };
})();
