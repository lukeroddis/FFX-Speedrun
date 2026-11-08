/* Sphere Grid node types and icons — shared by the editor and (later) the public site.
   GRID_TYPES[key]  → { label, fill, ink, val?, ability?, lock?, level? }
   gridIcon(key)    → SVG markup for the node drawn in a unit circle (radius 1).
                      Wrap it in <g transform="translate(x y) scale(r)">. */
(function () {
  const W = "#fff";
  const TYPES = {
    str:   { label: "Strength",      fill: "#d93030", ink: "#c81e1e", val: "+1" },
    def:   { label: "Defense",       fill: "#2e86de", ink: "#1f6fc0", val: "+1" },
    hp:    { label: "HP",            fill: "#1e9e4a", ink: "#178040", val: "+200" },
    mag:   { label: "Magic",         fill: "#e0457b", ink: "#d0306a", val: "+1" },
    spr:   { label: "Magic Defense", fill: "#2457c5", ink: "#1d45a8", val: "+1" },
    mp:    { label: "MP",            fill: "#13804a", ink: "#0f6a3c", val: "+20" },
    agl:   { label: "Agility",       fill: "#ece6a6", ink: "#7f7a1c", val: "+1" },
    acc:   { label: "Accuracy",      fill: "#d9d27a", ink: "#7f7a1c", val: "+1" },
    eva:   { label: "Evasion",       fill: "#f3eec4", ink: "#7f7a1c", val: "+1" },
    luck:  { label: "Luck",          fill: "#e8c21a", ink: "#8f7808", val: "+1" },
    skill: { label: "Skill",         fill: "#8a3fd1", ability: true },
    spec:  { label: "Special",       fill: "#8a3fd1", ability: true },
    wmag:  { label: "White Magic",   fill: "#ffffff", ability: true },
    bmag:  { label: "Black Magic",   fill: "#8a3fd1", ability: true },
    lock1: { label: "Lock 1",        fill: "#4a4d52", lock: true, level: 1 },
    lock2: { label: "Lock 2",        fill: "#4a4d52", lock: true, level: 2 },
    lock3: { label: "Lock 3",        fill: "#4a4d52", lock: true, level: 3 },
    lock4: { label: "Lock 4",        fill: "#4a4d52", lock: true, level: 4 },
    empty: { label: "Empty",         fill: "#7a7d84" },
  };

  const star5 = (() => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.27 : 0.66;
      pts.push(`${(Math.cos(a) * r).toFixed(3)} ${(Math.sin(a) * r + 0.04).toFixed(3)}`);
    }
    return "M" + pts.join("L") + "Z";
  })();
  const star4 = "M0 -0.74Q0.13 -0.13 0.74 0Q0.13 0.13 0 0.74Q-0.13 0.13 -0.74 0Q-0.13 -0.13 0 -0.74Z";
  const shield = "M-0.5 -0.56L0.5 -0.56L0.5 0C0.5 0.38 0.22 0.58 0 0.7C-0.22 0.58 -0.5 0.38 -0.5 0Z";
  const line = (d, c, w) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  const ICONS = {
    // white sword, pointing up
    str: `<path d="M-0.1 0.2L0.1 0.2L0.1 -0.48L0 -0.7L-0.1 -0.48Z" fill="${W}"/>
          <rect x="-0.36" y="0.19" width="0.72" height="0.14" rx="0.05" fill="${W}"/>
          <rect x="-0.065" y="0.3" width="0.13" height="0.3" fill="${W}"/>
          <circle cy="0.64" r="0.1" fill="${W}"/>`,
    // heraldic quarterly shield, blue and white
    def: `<path d="${shield}" fill="${W}"/>
          <path d="M-0.5 -0.56L0 -0.56L0 0.04L-0.5 0.04Z" fill="#2e86de"/>
          <path d="M0 0.04L0.5 0.04C0.48 0.4 0.21 0.58 0 0.7Z" fill="#2e86de"/>
          <path d="${shield}" fill="none" stroke="${W}" stroke-width="0.07"/>`,
    hp:  `<text y="0.4" text-anchor="middle" font-size="1.15" font-weight="700" fill="${W}" font-family="Ubuntu, sans-serif">H</text>`,
    mp:  `<text y="0.4" text-anchor="middle" font-size="1.1" font-weight="700" fill="${W}" font-family="Ubuntu, sans-serif">M</text>`,
    mag: `<path d="M0 -0.5L0.52 0.4L-0.52 0.4Z" fill="${W}"/>`,
    // white-bordered shield with a white triangle
    spr: `<path d="${shield}" fill="${W}"/>
          <path d="${shield}" fill="#2457c5" transform="translate(0 0.02) scale(0.76)"/>
          <path d="M0 -0.26L0.22 0.14L-0.22 0.14Z" fill="${W}"/>`,
    // thick line splitting into three
    // full-width bar with two swept arms branching off (in-game style)
    agl: line("M-0.68 0L0.68 0", "#7f8c1f", 0.24) +
         line("M-0.2 0C0.12 0 0.3 -0.12 0.52 -0.48M-0.2 0C0.12 0 0.3 0.12 0.52 0.48", "#7f8c1f", 0.2),
    // crosshair
    acc: `<circle r="0.42" fill="none" stroke="#6f6a12" stroke-width="0.12"/>` +
         line("M0 -0.72L0 -0.22M0 0.22L0 0.72M-0.72 0L-0.22 0M0.22 0L0.72 0", "#6f6a12", 0.12) +
         `<circle r="0.08" fill="#6f6a12"/>`,
    // split circle with two small rings
    eva: `<path d="M0 -1A1 1 0 0 0 0 1Z" fill="#c9b04a"/><path d="M0 -1A1 1 0 0 1 0 1Z" fill="#f6f1cf"/>
          <circle cx="-0.42" r="0.25" fill="none" stroke="${W}" stroke-width="0.12"/>
          <circle cx="0.42" r="0.25" fill="none" stroke="#a08a2a" stroke-width="0.12"/>`,
    luck: `<path d="${star5}" fill="${W}"/>`,
    // two crossed swords
    skill: line("M-0.52 -0.56L0.44 0.46M0.52 -0.56L-0.44 0.46", W, 0.13) +
           line("M0.13 0.45L0.43 0.15M-0.13 0.45L-0.43 0.15", W, 0.11),
    // ring around a (+): plus sign between two curved brackets
    spec: line("M0 -0.6L0 0.6M-0.4 0L0.4 0", W, 0.15) +
          line("M-0.3 -0.5Q-0.6 0 -0.3 0.5M0.3 -0.5Q0.6 0 0.3 0.5", W, 0.15),
    wmag: `<path d="${star4}" fill="#8a3fd1"/><circle r="0.1" fill="${W}"/>`,
    bmag: `<path d="${star4}" fill="${W}"/><circle r="0.1" fill="#8a3fd1"/>`,
    empty: `<circle r="0.45" fill="#111"/>`,
  };
  const lockIcon = lv => `<text y="0.3" text-anchor="middle" font-size="0.82" font-weight="700" font-family="Ubuntu, sans-serif">` +
    `<tspan fill="${W}">L.</tspan><tspan fill="#ff3b3b">${lv}</tspan></text>`;

  function gridIcon(key) {
    const t = TYPES[key] || TYPES.empty;
    const inner = t.lock ? lockIcon(t.level) : (ICONS[key] || "");
    return `<circle r="1" fill="${t.fill}"/>${inner}<circle r="0.95" fill="none" stroke="#222" stroke-width="0.1"/>`;
  }

  const CHARACTERS = {
    tidus:   { name: "Tidus",   color: "#25b6ff" },
    yuna:    { name: "Yuna",    color: "#9a9ea6" },
    auron:   { name: "Auron",   color: "#d71e1e" },
    kimahri: { name: "Kimahri", color: "#1a3f9e" },
    wakka:   { name: "Wakka",   color: "#d7b51a" },
    lulu:    { name: "Lulu",    color: "#ff4fd8" },
    rikku:   { name: "Rikku",   color: "#3fc43f" },
  };

  window.GRID_TYPES = TYPES;
  window.GRID_CHARACTERS = CHARACTERS;
  window.gridIcon = gridIcon;
})();
