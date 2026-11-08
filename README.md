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
battles/         One data file per boss fight (coming soon)
prototypes/      Mock-ups: a CTB-style battle page and a Sphere Grid route player
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
- Battle mock-up: <http://localhost:8765/prototypes/sin-fin.html>
- Sphere Grid route mock-up: <http://localhost:8765/prototypes/sphere-grid.html>

## Editing the Sphere Grid

1. Open the editor. On first use it loads `sphere-grid/grid.json` from this repository; **Load project grid** reloads it at any time.
2. Make your changes. Select mode (`V`) moves nodes and labels, `N` adds nodes, `C` connects them. Undo is `Ctrl+Z`.
3. Your work autosaves in your browser only. To share it, click **Export JSON**, replace `sphere-grid/grid.json` with the downloaded `grid.json`, and open a pull request.

`grid.json` stores one node or link per line, so a pull request shows exactly what changed.

## Writing a Sphere Grid route

Routes live in `sphere-grid/routes/` and refer to nodes by their ID from `grid.json` (select a node in the editor to see its ID). Each step is one character's turn in the Sphere Grid menu:

```json
{
  "title": "Demo route",
  "steps": [
    { "character": "tidus", "activate": ["n222"], "spheres": { "Ability": 1 }, "note": "Cheer" },
    { "character": "tidus", "teleport": "n538", "spheres": { "Teleport": 1 } }
  ]
}
```

- `activate`: nodes to activate in order. The page works out the walking path itself, and locked nodes block the way until they're opened.
- `teleport` / `warp`: jump straight to a node. The page shows how many moves it saves.
- `spheres`: what the step uses (Power, Mana, Speed, Ability, Fortune, Key, Teleport, Warp). These are added up as you go.

Open a route with `prototypes/sphere-grid.html?route=<file name>`. Without `?route=` it plays `demo`.

## Credits

- **Final Fantasy X** and the Sphere Grid are © Square Enix. This is an unofficial fan project, not affiliated with or endorsed by Square Enix.
- The Sphere Grid layout was traced with reference to the Sphere Grid map by **Zomgmeister**. Thank you! The map itself is not included in this repository.
