# Final Fantasy X Speedrun

A home for the **Final Fantasy X** speedrunning community, styled after the game's own menus and hosted on GitHub Pages:

- **Run notes** for each category and language, stepped through with the mouse wheel without leaving the game. One set of notes covers every version of a category, with toggles for the parts that differ.
- **Sphere Grid routes** drawn on a recreated, interactive Sphere Grid, with animations that step through each character's moves and teleports, and a **route builder** to make them.
- **Skips:** a video library of the skips the routes use, crediting who made each video.
- **Leaderboards:** the current top runs, read from speedrun.com once a day.
- **Community:** the Discord, speedrun.com and who's live on Twitch right now.
- **Everything is data**, so updating a strategy, route, skip or link means editing a small text file, not redrawing an image or writing HTML.

> Status: work in progress.

The site is published with GitHub Pages from the `main` branch, at <https://lukeroddis.github.io/FFX-Speedrun/>.

## Folder layout

```
index.html          The home page
.nojekyll           Tells GitHub Pages to serve files as they are (so the notes' .md files load raw)
pages/              The hub's pages
  notes.html          The run notes (?cat=any&lang=en)
  categories.html     Every category and its languages
  skips.html          The Skips library
  leaderboards.html   Top runs from speedrun.com
  community.html      Discord, speedrun.com, streams, contributing
  tools.html          The route builder and grid editor
hub/                The hub's data
  links.yml           Discord, speedrun.com and GitHub links
  leaderboards.yml    Which speedrun.com boards to show, in order
  skips.yml           The Skips videos, and who made them
  tools.yml           The Tools page, and who made each tool
  twitch.yml          What the Twitch live check looks for
.github/            The Twitch live check: a scheduled GitHub Action and its script
notes/
  categories.yml      The categories on the site: name, description, leaderboards, "coming soon"
  glossary.json       In-game names in every game language, shared by all categories
  any/                FFX Any%
    category.yml        Shared by every language: grid, languages, route toggles, targets, area order
    sphere-grid/        Sphere Grid route files (no language, so every language uses them)
    en/                 The English notes: index.md (wording) and one Markdown file per area
sphere-grid/
  standard.json       The Standard Sphere Grid: 860 nodes, their types, values, names and links
assets/             Shared code and styles for the site
  hub.js, hub.css     The site's navigation bar, theme (light, dark or automatic), footer and hub data
  notes-config.js     Where everything lives: categories, languages, grids, routes
  grid-icons.js       Sphere Grid node types, icons and character colours
  grid-layout.js      Shared link shapes and label positions
  route-engine.js     Plays Sphere Grid routes: moves, Sphere Levels, unlocks, teleports, spheres and rule checks
  portraits.js        Shows character portraits on tiles when an image exists
  portraits/          Character portrait images (see the README inside)
prototypes/         Pages kept for trying changes in isolation (not linked from the hub):
  sphere-grid.html    the Sphere Grid route player (also opened from the notes' grids)
  sin-fin.html        the original CTB-style battle mock-up
  demo.json           an example route the player shows when no route is given
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

Then open <http://localhost:8765/> for the home page, or go straight to:

- Run notes: <http://localhost:8765/pages/notes.html> (the old `prototypes/run.html` address forwards here)
- Sphere Grid route builder: <http://localhost:8765/tools/route-builder.html>
- Sphere Grid editor: <http://localhost:8765/tools/grid-editor.html>

Prototypes, for experimenting on their own (not linked from the hub):

- Sphere Grid route player: <http://localhost:8765/prototypes/sphere-grid.html> (plays `demo.json`; add `?route=besaid-tidus` for a real route)
- Battle mock-up: <http://localhost:8765/prototypes/sin-fin.html>

## The hub's content

Everything on the hub pages comes from small files, so a pull request is all it takes to change them:

- **A skip:** add an entry to `hub/skips.yml`, with its name, area, categories, difficulty (1 to 5 stars) and YouTube link, who made the video (`by`, plus an optional `by_url` link to their channel), and optionally a sentence on how it works. It appears on the Skips page, and the first ones on the home page.
- **A tool:** add an entry to `hub/tools.yml`, with its name, link, a short description, and who made it (`by` and an optional `by_url`).
- **A leaderboard:** add a board to `hub/leaderboards.yml`, with its speedrun.com category ID and "Category" variable, from <https://www.speedrun.com/api/v1/games/ffx?embed=categories.variables>. Each visitor's browser reads the top runs from speedrun.com and keeps them for a day.
- **A category:** add it to `notes/categories.yml` with a name, a short description and its leaderboards. Mark it `status: coming-soon` until it has notes.
- **A link:** change `hub/links.yml`.
- **Streams:** `hub/twitch.yml` sets which Twitch categories to look in, the title words that mark a speedrun, runners to always show, title words that leave a stream out (such as 24/7 reruns), and channels never to show (see below).

## Twitch live check

The Community page, and the home page when someone's live, show who's streaming FFX speedruns right now.

**How it works:** a GitHub Action (`.github/workflows/twitch-live.yml`) runs every 10 minutes:

1. It asks Twitch for live streams in the categories in `hub/twitch.yml`.
2. It keeps the speedruns: streams with a speedrun word in the title (Any%, NSG, CSR, TAS, race…), or a runner from the list. Words only count at the start of a word, so *TAS* doesn't match *Fantasy*. Twitch's Speedrun tag isn't used, as streamers often leave it on when playing casually. It then removes titles with words like *24/7*, *rerun* or *watch party*, and any channel on the exclude list (for a banned player, say).
3. It publishes the result as `live.json` on a separate `live-data` branch. That branch is a single commit, replaced each time, so `main`'s history stays clean.

The site reads that file.

**One-off setup**, once the repository is on GitHub:

1. Sign in at <https://dev.twitch.tv/console> with any Twitch account and choose **Register Your Application**:
   - **Name:** anything, e.g. *FFX Speedrun Live Check*.
   - **OAuth Redirect URL:** `http://localhost`.
   - **Category:** *Website Integration*.
   - **Client Type:** *Confidential*.
2. Open the app, copy its **Client ID**, and click **New Secret** to get a **Client Secret**.
3. In the GitHub repository, go to **Settings → Secrets and variables → Actions** and add two repository secrets: `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`.
4. Go to **Actions → Twitch live check → Run workflow** to run it once straight away. After that it runs every 10 minutes by itself.

**Things to know:**

- **Schedule:** GitHub's scheduled runs are "best effort". A new schedule can take a while before its first run, and runs can be delayed or skipped when GitHub is busy (most often around the top of the hour, which is why this one runs at 4, 14, 24… past). The page says when the list was last checked if it's more than 30 minutes old.
- **If the schedule proves unreliable:** an outside scheduler can start the check instead. For example, a free [cron-job.org](https://cron-job.org) job every 10 minutes that sends:
  - **Request:** `POST https://api.github.com/repos/lukeroddis/FFX-Speedrun/dispatches`
  - **Body:** `{"event_type": "twitch-live"}`
  - **Headers:** `Accept: application/vnd.github+json` and `Authorization: Bearer <token>`. The token is a fine-grained GitHub token limited to this repository, with *Contents: Read and write* permission, which the dispatches endpoint needs.
- **Pausing:** in a public repository, GitHub pauses scheduled workflows after 60 days without any commits. A commit, or **Enable workflow** on the Actions tab, starts it again.
- **Testing the pages:** `?live=<file>` makes them read a local sample file instead, e.g. `pages/community.html?live=hub/my-sample.json`.

## Categories and languages

Each category (a way of running the game) is a folder in `notes/`, and each language its notes are written in is a folder inside that:

- **`notes/<category>/category.yml`** holds what's the same in every language:
  - the grid the category uses (`grid: standard`);
  - its languages;
  - which route toggles exist (`blitz: [win, loss]`);
  - the targets;
  - the order of the areas.
- **`notes/<category>/<language>/index.md`** holds that language's wording: the title, the toggle labels, character names and colours, terms, Overdrive names, and the name of each area.
- **Area files** have the same name in every language, e.g. `03-besaid.md`. If a language hasn't translated an area yet, the page shows the English one, marked *Not translated yet*. So a translation can grow one area at a time.
- **`notes/<category>/sphere-grid/`** holds the category's Sphere Grid routes. Routes have no language, so a fix there reaches every language at once.
- **The glossary** of in-game names (`notes/glossary.json`) and the **grids** (`sphere-grid/`) belong to the game, so they're shared by every category.

The run page picks these from its address: `run.html?cat=any&lang=en` (the defaults).

- **To add a language:**
  1. Copy `en/` to a new folder named with the language code (`fr`, `ja`, …).
  2. Translate `index.md` and as many areas as you like.
  3. Add the code to `languages:` in `category.yml`.

  A **Notes** toggle then appears on the run page.
- **To add a category:**
  1. Make a new folder beside `any/` with its own `category.yml`, `sphere-grid/` and language folders.
  2. List it in `notes/categories.yml`.
- **To add another grid,** such as the Expert Sphere Grid:
  1. Build it as `sphere-grid/expert.json` with the editor (`grid-editor.html?grid=expert`).
  2. Set `grid: expert` in the category that uses it.

  Everything else (routes, the builder, the run page) follows from that.

## Editing the Sphere Grid

1. Open the editor. On first use it loads `sphere-grid/standard.json` from this repository (`?grid=expert` would load `expert.json` instead); **Load project grid** reloads it at any time.
2. Make your changes. Select mode (`V`) moves nodes and labels, `N` adds nodes, `C` connects them. Undo is `Ctrl+Z`.
3. Your work autosaves in your browser only. To share it, click **Export JSON**, replace `sphere-grid/standard.json` with the downloaded file, and open a pull request.

The grid file stores one node or link per line, so a pull request shows exactly what changed.

## Writing the notes

The notes live in `notes/<category>/<language>/`, one Markdown file per area (see *Categories and languages* above). They use the same format as the Speedrun Overlay notes: numbered steps, and blocks such as `:::battle Sin Fin | 2,000 HP … :::`, `:::spheregrid`, `:::trial` and `:::encounters`. The run page adds a few extra lines:

- **`party: Tidus, Wakka`** on its own line between steps: who's in the party from here on, for when the story adds or removes characters. It isn't shown in the notes; it only updates the Party panel, so runners don't think they need to do anything.
- **`party: Tidus, Yuna, Kimahri`** inside a `:::battle` block: the party the game puts you in for that fight. The previous party comes back once the fight is over.
- **`route: besaid-tidus`** inside a `:::spheregrid` block: the route file to draw (see below).

A **`**Formation:** Tidus, Yuna, Lulu`** anywhere in a step also sets the party, and `Switch X for Y` and `Summon …` turns in battles update it as you step past them.

### Route toggles

Parts of the route depend on how the run goes. Each of these is a **variant**, with a toggle in the right-hand panel. Which variants and options exist is set in `category.yml`, and each language's `index.md` gives them their wording:

```yaml
# category.yml
variants:
  blitz: [win, loss]
  spheres: [return4, return2, return0]
```

```yaml
# en/index.md
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

Numbers that depend on the route go under `targets:` in `category.yml`. The Power Sphere tracker reads `power-bonus` and shows a range, such as 8–9, until the variant is chosen:

```yaml
targets:
  power-bonus:
    blitz=win: 8
    blitz=loss: 9
```

Adding another variant needs no code: add it to `variants:` in `category.yml`, give it wording in each `index.md`, and use it in `:::if`.

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

1. Pick the category, then give the route a title and file name. Under **Continue from**, name the route it follows on from, if any.
2. Pick a character and a tool, then click the grid:
   - **Move:** walk there. Hover to see the path, moves and Sphere Levels; Shift+click walks one node at a time.
   - **Activate** and **Unlock:** valid nodes are ringed.
   - **Teleport:** pick the sphere first.
   - **Place:** put a character anywhere before the route starts.
3. The step list shows each step's moves, Sphere Levels, spheres and any rule problems. Steps can be reordered or deleted, and Ctrl+Z undoes. **▶ Play** previews the animation.
4. **Export JSON** saves the file for the category's `sphere-grid/` folder (e.g. `notes/any/sphere-grid/`), and **Copy route: line** gives the line for the notes. **Import**, **Paste JSON** and **Open by name** load an existing route to change it.

Route files can also be written by hand:

Routes live in `notes/<category>/sphere-grid/` and refer to nodes by their ID in the category's grid (hover a node in the route builder to see its ID). The Sphere Grid page, the run notes and the route builder all play routes with the same engine, `assets/route-engine.js`.

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

**Where everyone starts.** A route begins where the route named in `after` (from the same category) ends: same positions, with everything activated, walked and unlocked so far, so each segment of the run carries on from the last. Without `after`, everyone starts on their own starting node. `start` then puts characters on any node you like, for experiments or challenge runs.

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

Open a route with `prototypes/sphere-grid.html?cat=any&route=<file name>`. Without `?route=` it plays `prototypes/demo.json`, an example route.

## Credits

- **Final Fantasy X**, character names, logos, and related imagery are registered trademarks and copyright material of Square Enix Co., Ltd. This is an unofficial, community-driven speedrunning resource and fan site. It is not affiliated with, endorsed by, or sponsored by Square Enix.
- The Sphere Grid layout was traced with reference to the Sphere Grid map by **Zomgmeister**.
