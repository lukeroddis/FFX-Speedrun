# FFX Speedrun Notes

Speedrunning notes for **Final Fantasy X**, rebuilt as a small website styled after the game's own menus, to be hosted on GitHub Pages.

- **Boss battles** shown as Conditional Turn-Based (CTB) turn orders, the same way the game shows whose turn is next.
- **Sphere Grid routes** drawn on a recreated, interactive Sphere Grid, with animations that step through each character's moves and teleports.
- **Everything is data**, so updating a strategy or route means editing a small text file, not redrawing an image.

> Status: early work in progress. The pages in `prototypes/` are mock-ups for the look and feel.

## Folder layout

```
assets/          Shared code and styles for the site
  grid-icons.js    Sphere Grid node types, icons and character colours
  grid-layout.js   Shared link shapes and label positions
  portraits.js     Shows character portraits on tiles when an image exists
  portraits/       Character portrait images (see the README inside)
battles/         One data file per boss fight (coming soon)
notes/           The run notes: index.md (shared settings, area list) and one Markdown file per area
prototypes/      Mock-ups: the run page, a CTB-style battle page and a Sphere Grid route player
sphere-grid/
  grid.json        The full Sphere Grid: 860 nodes, their types, values, names and links
  routes/          Route files played by the Sphere Grid page (demo.json is an example)
tools/
  grid-editor.html The Sphere Grid editor (tracing, editing, label layout)
  grid-detect.js   Auto-detection of nodes, types and links from a reference image
```

## Running it locally

The pages load data files, so open them through a small local web server rather than by double-clicking. From this folder:

```bash
python -m http.server 8765
```

Then open:

- Sphere Grid editor: <http://localhost:8765/tools/grid-editor.html>
- Run notes mock-up (Besaid): <http://localhost:8765/prototypes/run.html>
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

A **`**Formation:** Tidus, Yuna, Lulu`** step also sets the party, and `Switch X for Y` and `Summon …` turns in battles update it as you step past them.

## Writing a Sphere Grid route

Routes live in `sphere-grid/routes/` and refer to nodes by their ID from `grid.json` (select a node in the editor to see its ID). Each step is one character's turn in the Sphere Grid menu:

```json
{
  "title": "Demo route",
  "steps": [
    { "character": "tidus", "move": "n247", "activate": ["n222", "n256"], "spheres": { "Ability": 1, "Power": 1 } },
    { "character": "tidus", "teleport": "n538", "spheres": { "Teleport": 1 } }
  ]
}
```

- `move`: the node to walk to. The page works out the path itself, and locked nodes block the way until they're opened. The node you stop on isn't activated unless it's also listed in `activate`.
- `activate`: nodes to activate in order. As in the game, these can be the node you're standing on or one next to it. A node further away is walked to first.
- `teleport` / `warp`: jump straight to a node. The page shows how many moves it saves. A step can teleport and then activate.
- `spheres`: what the step uses (Power, Mana, Speed, Ability, Fortune, Key, Teleport, Warp). These are added up as you go.

Open a route with `prototypes/sphere-grid.html?route=<file name>`. Without `?route=` it plays `demo`.

## Credits

- **Final Fantasy X** and the Sphere Grid are © Square Enix. This is an unofficial fan project, not affiliated with or endorsed by Square Enix.
- The Sphere Grid layout was traced with reference to the Sphere Grid map by **Zomgmeister**. Thank you! The map itself is not included in this repository.
