# FFX Speedrun Notes

Speedrunning notes for **Final Fantasy X**, rebuilt as a small website styled after the game's own menus, to be hosted on GitHub Pages.

- **Boss battles** shown as Conditional Turn-Based (CTB) turn orders, the same way the game shows whose turn is next.
- **Sphere Grid routes** drawn on a recreated, interactive Sphere Grid, with animations that step through each character's moves and teleports.
- **Everything is data**, so updating a strategy or route means editing a small text file, not redrawing an image.

> Status: early work in progress. The pages in `prototypes/` are mock-ups for the look and feel.

The site is published with GitHub Pages from the `main` branch, at <https://lukeroddis.github.io/FFX-Speedrun/>.

## Folder layout

```
index.html       The landing page, linking to everything below
.nojekyll        Tells GitHub Pages to serve files as they are (so notes/*.md load raw)
assets/          Shared code and styles for the site
  grid-icons.js    Sphere Grid node types, icons and character colours
  grid-layout.js   Shared link shapes and label positions
  route-engine.js  Plays Sphere Grid routes: moves, Sphere Levels, unlocks, teleports, spheres and rule checks
  portraits.js     Shows character portraits on tiles when an image exists
  portraits/       Character portrait images (see the README inside)
battles/         One data file per boss fight (coming soon)
notes/           The run notes: index.md (shared settings, area list) and one Markdown file per area
prototypes/      Mock-ups: the run page, a CTB-style battle page and a Sphere Grid route player
sphere-grid/
  grid.json        The full Sphere Grid: 860 nodes, their types, values, names and links
  routes/          Route files played by the Sphere Grid page (demo.json is an example)
tools/
  route-builder.html  Build Sphere Grid routes by clicking, and export them as route files
  grid-editor.html The Sphere Grid editor (tracing, editing, label layout)
  grid-detect.js   Auto-detection of nodes, types and links from a reference image
```

## Running it locally

The pages load data files, so open them through a small local web server rather than by double-clicking. From this folder:

```bash
python -m http.server 8765
```

Then open <http://localhost:8765/> for the landing page, or go straight to:

- Sphere Grid route builder: <http://localhost:8765/tools/route-builder.html>
- Sphere Grid editor: <http://localhost:8765/tools/grid-editor.html>
- Run notes: <http://localhost:8765/prototypes/run.html>
- Battle mock-up: <http://localhost:8765/prototypes/sin-fin.html>
- Sphere Grid route mock-up: <http://localhost:8765/prototypes/sphere-grid.html>

## Editing the Sphere Grid

1. Open the editor. On first use it loads `sphere-grid/grid.json` from this repository; **Load project grid** reloads it at any time.
2. Make your changes. Select mode (`V`) moves nodes and labels, `N` adds nodes, `C` connects them. Undo is `Ctrl+Z`.
3. Your work autosaves in your browser only. To share it, click **Export JSON**, replace `sphere-grid/grid.json` with the downloaded `grid.json`, and open a pull request.

`grid.json` stores one node or link per line, so a pull request shows exactly what changed.

## Writing the notes

The notes live in `notes/`, one Markdown file per area, listed in order in `notes/index.md`. They use the same format as the Speedrun Overlay notes: numbered steps, and blocks such as `:::battle Sin Fin | 2,000 HP … :::`, `:::spheregrid`, `:::trial` and `:::encounters`. The run page adds a few extra lines:

- **`party: Tidus, Wakka`** on its own line between steps: who's in the party from here on, for when the story adds or removes characters. It isn't shown in the notes; it only updates the Party panel, so runners don't think they need to do anything.
- **`party: Tidus, Yuna, Kimahri`** inside a `:::battle` block: the party the game puts you in for that fight. The previous party comes back once the fight is over.
- **`route: besaid-tidus`** inside a `:::spheregrid` block: the route file to draw (see below).

A **`**Formation:** Tidus, Yuna, Lulu`** anywhere in a step also sets the party, and `Switch X for Y` and `Summon …` turns in battles update it as you step past them.

### Route toggles

Parts of the route depend on how the run goes. Each of these is a **variant**, declared in the front matter of `notes/index.md`, and each one gets a toggle in the page header:

```yaml
variants:
  blitz:
    name: Blitzball
    win: Win
    loss: Loss
  spheres:
    name: Sphere drop
    return4: 4 Return
    return2: 2 Return + 2 Friend
    return0: 4 Friend
```

Wrap the notes that only apply to some options in `:::if … :::`. This works around whole steps and blocks, or around lines inside a block:

- `:::if blitz=loss` applies on Blitz Loss only.
- `:::if spheres=return4,return2` applies to either of those options.
- `:::if blitz=loss spheres=return0` applies only when both are true.

Every toggle also has a **?** option, for "not known yet". It's the default, so before the Blitzball game, or before the sphere drop, every option's notes show with a small label such as *Blitzball: Loss*. The chosen options are remembered and also go into the page address (`run.html?blitz=loss&spheres=return2`), so a link opens the notes on the same route.

Numbers that depend on the route go under `targets:`. The Power Sphere tracker reads `power-bonus` and shows a range, such as 8–9, until the variant is chosen:

```yaml
targets:
  power-bonus:
    blitz=win: 8
    blitz=loss: 9
```

Adding another variant needs no code: add it to `variants:` and use it in `:::if`.

### Lighter views

The **Show** box lets a runner hide what they no longer need. **Full notes** shows everything, for a first run. **Menus only** keeps battles, sphere grids, shops, equips and encounters, and only the *key* steps. Each kind of block can also be switched on or off by itself, and steps can be All, Key only or None.

A step counts as **key** when it has something in **bold** (a key item, a **Formation:**, a warning) or a Power Sphere drop. To keep a step that doesn't, start it with `!`:

```markdown
1. ! Talk to the guy in red shorts for 400 Gil
```

Hidden lines still count: Power Sphere drops and party changes in them still update the right-hand panel.

### Game language

Runners don't always play the game in the language they read. The **Game text** toggle in the header picks the game's language, and wherever an in-game name from `notes/glossary.json` appears in the notes, the page shows the game's name, large, with the notes' name small underneath. For example, with Japanese game text, "Arctic Wind" shows as **北極の風** with *Arctic Wind* beneath it.

```json
"arctic-wind": { "type": "item", "en": "Arctic Wind", "ja": "北極の風" }
```

- Write the notes normally; nothing needs marking up. The page finds glossary names in the text by itself, plurals included.
- Copy names exactly as the game shows them, so the runner can match them on screen.
- A term without a name in the chosen game language is shown as written.
- To add a game language, add it to `languages` at the top of the glossary. It appears in the toggle straight away.
- The choice is remembered and goes into the page address (`?game=ja`).

## Writing a Sphere Grid route

The easiest way is the **route builder** (`tools/route-builder.html`):

1. Give the route a title and file name. Under **Continue from**, name the route it follows on from, if any.
2. Pick a character and a tool, then click the grid:
   - **Move:** walk there. Hover to see the path, moves and Sphere Levels; Shift+click walks one node at a time.
   - **Activate** and **Unlock:** valid nodes are ringed.
   - **Teleport:** pick the sphere first.
   - **Place:** put a character anywhere before the route starts.
3. The step list shows each step's moves, Sphere Levels, spheres and any rule problems. Steps can be reordered or deleted, and Ctrl+Z undoes. **▶ Play** previews the animation.
4. **Export JSON** saves the file for `sphere-grid/routes/`, and **Copy route: line** gives the line for the notes. **Import**, **Paste JSON** and **Open by name** load an existing route to change it.

Route files can also be written by hand:

Routes live in `sphere-grid/routes/` and refer to nodes by their ID from `grid.json` (hover a node in the route builder to see its ID). The Sphere Grid page, the run notes and the route builder all play routes with the same engine, `assets/route-engine.js`.

```json
{
  "title": "Kilika: Tidus",
  "after": "besaid-tidus",
  "start": { "wakka": "n541" },
  "steps": [
    { "character": "tidus", "move": "n247", "activate": ["n222", "n256"] },
    { "character": "tidus", "unlock": "n266" },
    { "character": "tidus", "teleport": { "sphere": "Return", "to": "n222" } }
  ]
}
```

**Where everyone starts.** A route begins where the route named in `after` ends: same positions, with everything activated, walked and unlocked so far, so each segment of the run carries on from the last. Without `after`, everyone starts on their own starting node. `start` then puts characters on any node you like, for experiments or challenge runs.

**Each step** is one character's turn in the menu, done in this order:

- `teleport`: `{ "sphere": "Teleport", "to": "n538" }`. The sphere decides where it can go:
  - **Teleport:** any activated node.
  - **Return:** a node this character activated.
  - **Friend:** where another character stands.
  - **Warp:** any node.
  
  The older `"teleport": "n538"` and `"warp": "n538"` still work. The page shows how many moves a teleport saves.
- `move`: a node to walk to, by the cheapest path; or a list of nodes to walk along exactly, e.g. `["n232", "n222", "n247"]`. Locks block the way until they're unlocked. The node you stop on isn't activated unless it's also in `activate`.
- `unlock`: Level 1–4 locks next to you. An unlocked lock becomes an empty node anyone can walk through.
- `activate`: nodes on or next to you, in order.

**Worked out for you:**

- **Spheres:** worked out from the nodes: Power, Mana, Speed, Ability, Fortune, Key Lv1–4, and the teleporting spheres. A `spheres` value written in a step is kept, with a warning if it doesn't match.
- **Sphere Levels:** counted per character. Each move onto a new link costs 1. Moving back along links the character has already walked costs 1 per 4, rounded up. Teleports, unlocks and activations cost none.
- **Rule checks:** anything the game wouldn't allow shows as a ⚠ warning: a node out of reach, an already-activated node, a teleport its sphere can't make.

Open a route with `prototypes/sphere-grid.html?route=<file name>`. Without `?route=` it plays `demo`.

## Credits

- **Final Fantasy X** and the Sphere Grid are © Square Enix. This is an unofficial fan project, not affiliated with or endorsed by Square Enix.
- The Sphere Grid layout was traced with reference to the Sphere Grid map by **Zomgmeister**. Thank you! The map itself is not included in this repository.
