/* Sphere Grid geometry shared by the site: link shapes and label positions.
   Matches what the editor (tools/grid-editor.html) draws, so labels placed there land in the same spot. */
(function () {
  const LABEL_KEY = { value: "valueAt", name: "nameAt", start: "startAt" };
  const nodeRadius = (n, R) => n.type === "empty" ? R * 0.65 : R;

  function labelText(n, which) {
    if (which === "value") return n.value || "";
    if (which === "name") return n.name || "";
    const c = n.start && window.GRID_CHARACTERS[n.start];
    return c ? c.name : "";
  }
  function labelSize(n, which, R) {
    const len = labelText(n, which).length;
    if (which === "value") return { w: len * R * 0.45 + R * 0.2, h: R * 0.8 };
    if (which === "name") return { w: len * R * 0.5 + R * 0.8, h: R * 1.3 };
    return { w: len * R * 0.6 + R, h: R * 1.4 };
  }
  function defaultOffset(n, which, R) {
    const r = nodeRadius(n, R);
    if (which === "value") return [0, r + R * 0.65];
    if (which === "name") return [0, -(r + R * 1.05)];
    return [0, r + R * 2.1];
  }
  function labelBox(n, which, R) {
    const [dx, dy] = n[LABEL_KEY[which]] || defaultOffset(n, which, R);
    return { cx: n.x + dx, cy: n.y + dy, ...labelSize(n, which, R) };
  }

  /* A link is a straight line, or a circular arc whose middle sits `bend` units to one side */
  function arc(A, B, bend) {
    const dx = B.x - A.x, dy = B.y - A.y, c = Math.hypot(dx, dy) || 1, nx = -dy / c, ny = dx / c;
    const rad = (bend * bend + c * c / 4) / (2 * Math.abs(bend)), off = bend - Math.sign(bend) * rad;
    return { c, rad, ox: (A.x + B.x) / 2 + nx * off, oy: (A.y + B.y) / 2 + ny * off,
             mx: (A.x + B.x) / 2 + nx * bend, my: (A.y + B.y) / 2 + ny * bend };
  }
  function edgePath(A, B, bend = 0) {
    if (Math.abs(bend) < 0.5) return `M${A.x} ${A.y}L${B.x} ${B.y}`;
    const g = arc(A, B, bend), r = Math.round(g.rad * 10) / 10;
    return `M${A.x} ${A.y}A${r} ${r} 0 ${Math.abs(bend) > g.c / 2 ? 1 : 0} ${bend > 0 ? 0 : 1} ${B.x} ${B.y}`;
  }

  window.GridLayout = { LABEL_KEY, nodeRadius, labelText, labelSize, defaultOffset, labelBox, edgePath };
})();
