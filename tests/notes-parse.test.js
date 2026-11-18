// Tests for assets/notes-parse.js. Run "node --test" in the repository folder.
const test = require("node:test");
const assert = require("node:assert/strict");
const NotesParse = require("../assets/notes-parse.js");

const variants = [
  { key: "blitz", name: "Blitzball", options: [{ id: "win", label: "Win" }, { id: "loss", label: "Loss" }] },
  { key: "spheres", name: "Sphere drop", options: [{ id: "return4", label: "4 Return" }, { id: "return2", label: "2 Return" }, { id: "return0", label: "4 Friend" }] },
];
const { applyVariants, evalCond } = NotesParse.create(variants, { warn: () => {} });
const lines = (...l) => l.join("\n");

test(":::if keeps the lines for the chosen option and drops the others", () => {
  const text = lines("1. Start", ":::if blitz=win", "2. Win step", ":::", ":::if blitz=loss", "2. Loss step", ":::");
  assert.deepEqual(applyVariants(text, { blitz: "win" }), ["1. Start", "2. Win step"]);
  assert.deepEqual(applyVariants(text, { blitz: "loss" }), ["1. Start", "2. Loss step"]);
});

test(":::if outside a block, not chosen yet: every option's lines in a labelled group", () => {
  const text = lines(":::if blitz=loss", "1. Loss step", ":::");
  assert.deepEqual(applyVariants(text, {}), [":::vgroup Blitzball: Loss", "1. Loss step", ":::"]);
});

test(":::if inside a block, not chosen yet: a labelled list item, and labelled routes", () => {
  const text = lines(":::battle Garuda", "- Tidus: Attack", ":::if blitz=loss", "route: luca-loss", "- Wakka: Attack", ":::", ":::");
  assert.deepEqual(applyVariants(text, {}), [
    ":::battle Garuda", "- Tidus: Attack", "route: luca-loss | Blitzball: Loss", "- ⟦Blitzball: Loss⟧", "  - Wakka: Attack", ":::",
  ]);
});

test("conditions combine, and one condition can allow several options", () => {
  const both = NotesParse.parseCond("blitz=loss spheres=return4,return2");
  assert.equal(evalCond(both, { blitz: "loss", spheres: "return2" }), "keep");
  assert.equal(evalCond(both, { blitz: "win", spheres: "return2" }), "drop");
  assert.equal(evalCond(both, { blitz: "loss" }), "Sphere drop: 4 Return or 2 Return");
  assert.equal(evalCond(both, {}), "Blitzball: Loss · Sphere drop: 4 Return or 2 Return");
});

test("an unknown toggle is warned about and ignored", () => {
  const warned = [];
  const p = NotesParse.create(variants, { warn: m => warned.push(m) });
  assert.equal(p.evalCond(NotesParse.parseCond("steel=yes"), {}), "keep");
  assert.equal(warned.length, 1);
});

test("parseArea reads steps, blocks, questions, party lines and paragraphs", () => {
  const items = NotesParse.parseArea([
    "# Luca", "1. ! SD, then **Formation:** Tidus", "  - a sub-line", ":::battle Oblitzerator | 3,000HP", "- Tidus: Attack", ":::",
    ":::ask blitz | Did you win Blitzball?", "party: Tidus, Wakka", ":::use luca-tidus", "Some words",
  ]);
  assert.deepEqual(items.map(i => i.kind), ["step", "block", "ask", "party", "use", "para"]);
  assert.equal(items[0].important, true);
  assert.equal(items[0].sub[0].text, "a sub-line");
  assert.deepEqual([items[1].type, items[1].title, items[1].extra, items[1].lines], ["battle", "Oblitzerator", "3,000HP", ["- Tidus: Attack"]]);
  assert.deepEqual(items[2], { kind: "ask", key: "blitz", question: "Did you win Blitzball?" });
  assert.deepEqual(items[3].names, ["Tidus", "Wakka"]);
});

test("one-line directives inside a block don't need a closing :::", () => {
  const items = NotesParse.parseArea([":::optional If lucky", ":::use luca-tidus", ":::ask blitz", "1. Step", ":::", "2. After"]);
  assert.deepEqual(items.map(i => i.kind), ["block", "step"]);
  assert.deepEqual(items[0].lines, [":::use luca-tidus", ":::ask blitz", "1. Step"]);
});

test("blocks nest: an inner block's ::: doesn't close the outer one", () => {
  const items = NotesParse.parseArea([":::optional Haste", ":::spheregrid", "route: x", ":::", ":::", "1. After"]);
  assert.deepEqual(items.map(i => i.kind), ["block", "step"]);
  assert.equal(items[0].lines.length, 3);
});

test("flatItems opens groups, and blockNamed finds a block by id, then by route", () => {
  const items = NotesParse.parseArea([":::vgroup Blitzball: Loss", ":::spheregrid", "route: luca-tidus", ":::", ":::", ":::battle X", "id: luca-tidus", ":::"]);
  const all = NotesParse.flatItems(items);
  assert.equal(all.length, 2);
  assert.equal(NotesParse.blockNamed(all, "luca-tidus").type, "battle");
  assert.equal(NotesParse.blockNamed(all.slice(0, 1), "luca-tidus").type, "spheregrid");
});

test("parseList builds a tree and keeps paragraphs with their position", () => {
  const tree = NotesParse.parseList(["Intro", "- a", "  - b", "- c", "Outro"]);
  assert.deepEqual(tree.children.map(c => c.text), ["a", "c"]);
  assert.equal(tree.children[0].children[0].text, "b");
  assert.deepEqual(tree.paras, [{ text: "Intro", after: 0 }, { text: "Outro", after: 2 }]);
});
