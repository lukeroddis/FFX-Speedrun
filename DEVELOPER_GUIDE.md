# Developer guide

The full reference for the FFX Speedrun site: how it's laid out, how to run it, and every setting and format. For a quick start on writing notes or adding a skip, see the [README](README.md).

The site is plain HTML, JavaScript and CSS, with no framework. A GitHub Action (`.github/workflows/pages.yml`) builds it and publishes it to GitHub Pages on every push to `main`, at <https://lukeroddis.github.io/FFX-Speedrun/>. Search engines find every page through its `sitemap.xml`.

**Contents:** [Folder layout](#folder-layout) · [Running it locally](#running-it-locally) · [The hub's content](#the-hubs-content) · [Twitch live check](#twitch-live-check) · [Categories and languages](#categories-and-languages) · [Editing the Sphere Grid](#editing-the-sphere-grid) · [Writing the notes](#writing-the-notes) · [Writing a Sphere Grid route](#writing-a-sphere-grid-route)

## Folder layout

```
index.html          The home page
README.md           What the site is, and a quick start for contributors
DEVELOPER_GUIDE.md  This guide
_site/              The built site (made by the build script; not committed)
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
  skips/              One Markdown file per skip, each built into its own page (see the README inside)
  tools.yml           The Tools page, and who made each tool
  twitch.yml          What the Twitch live check looks for
.github/            GitHub Actions: building and publishing the site (pages.yml, build-site.mjs) and the Twitch live check
notes/
  categories.yml      The categories on the site: name, description, leaderboards, "coming soon"
  glossary/           In-game names, shared by all categories
    terms.yml           The game's languages, and each name's type and icon
    en.yml, ja.yml…     The names in one game language
  maps/               Area maps (no language, so any category can show them)
  any/                FFX Any%
    category.yml        Shared by every language: grid, languages, route toggles, targets, area order
    sphere-grid/        Sphere Grid route files (no language, so every language uses them)
    en/                 The English notes: index.md (wording) and one Markdown file per area
sphere-grid/
  standard.json       The Standard Sphere Grid: 860 nodes, their types, values, names and links
assets/             Shared code and styles for the site
  theme.css           The site's colours, light and dark, shared by every page (the notes and tools too)
  hub.js, hub.css     The site's navigation bar and theme switch (on every page), footer and hub data
  notes-config.js     Where everything lives: categories, languages, grids, routes
  grid-icons.js       Sphere Grid node types, icons and character colours
  grid-layout.js      Shared link shapes and label positions
  route-engine.js     Plays Sphere Grid routes: moves, Sphere Levels, unlocks, teleports, spheres and rule checks
  notes-map.js        Draws the area maps (shared by the notes and the Map Editor)
  ingame.css          In-game styles: the item-name chips and the maps
  logo/               The logo and browser icons, with the full-size originals they're made from
  portraits.js        Shows character portraits on tiles when an image exists
  portraits/          Character portrait images (see the README inside)
prototypes/         Pages kept for trying changes in isolation (not linked from the hub):
  sphere-grid.html    the Sphere Grid route player (also opened from the notes' grids)
  sin-fin.html        the original CTB-style battle mock-up
  demo.json           an example route the player shows when no route is given
tools/
  route-builder.html  Build Sphere Grid routes by clicking, and export them as route files
  map-editor.html     Trace area maps over a screenshot, and save them as map files
  grid-editor.html    The Sphere Grid editor (tracing, editing, label layout)
  grid-detect.js      Auto-detection of nodes, types and links from a reference image
```

## Running it locally

The site is **built** before it's published: a script copies everything into `_site/` and adds a page for each skip, the skips list and a sitemap. To see it as it will be published, build it and serve `_site/`. From this folder:

```bash
node .github/scripts/build-site.mjs
```

```bash
python -m http.server 8765 -d _site
```

The build also adds `?v=<commit>` to every page's links to the site's own scripts and styles (`hub.js?v=b4a72be`), so after each update browsers fetch the new files instead of reusing cached ones for up to 10 minutes. Only the built copy changes; write links in the source files without it. Run the build again after changing a skip. Serving this folder directly (`python -m http.server 8765`) also works for everything else, but the skips (the Skips page, skip pages and skip links in the notes) only exist in the built copy.

Then open <http://localhost:8765/> for the home page, or go straight to:

- Run notes: <http://localhost:8765/pages/notes.html> (the old `prototypes/run.html` address forwards here)
- Sphere Grid route builder: <http://localhost:8765/tools/route-builder.html>
- Sphere Grid editor: <http://localhost:8765/tools/grid-editor.html>

Prototypes, for experimenting on their own (not linked from the hub):

- Sphere Grid route player: <http://localhost:8765/prototypes/sphere-grid.html> (plays `demo.json`; add `?route=besaid-tidus` for a real route)
- Battle mock-up: <http://localhost:8765/prototypes/sin-fin.html>

## The hub's content

Everything on the hub pages comes from small files, so a pull request is all it takes to change them:

- **A skip:** add a Markdown file to `hub/skips/`, e.g. `hub/skips/clasko-skip.md`. It becomes its own page at `skips/clasko-skip/`, with its video (or a tab per version, PS2 and HD Remaster), who made it, its difficulty, and a written guide with images. It also appears on the Skips page, and its name links to it from the notes. `hub/skips/README.md` lists the fields and how to write the guide.
- **A tool:** add an entry to `hub/tools.yml`, with its name, link, a short description, and who made it (`by` and an optional `by_url`).
- **A leaderboard:** add a board to `hub/leaderboards.yml`, with its speedrun.com category ID and "Category" variable, from <https://www.speedrun.com/api/v1/games/ffx?embed=categories.variables>. Each visitor's browser reads the top runs from speedrun.com and keeps them for a day. Above the boards, **Recent runs** shows the five newest full-game runs in any category (not only the boards listed), newest first by the date each was run, as on speedrun.com, with each run's place on its board and the runner's flag. A run its runner has since beaten is left out. It's kept for a day too.
- **A category:** add it to `notes/categories.yml` with a name, a short description and its leaderboards. Mark it `status: coming-soon` until it has notes.
- **A link:** change `hub/links.yml`.
- **Streams:** `hub/twitch.yml` sets which Twitch categories to look in, the title words that mark a speedrun, runners to always show, title words that leave a stream out (such as 24/7 reruns), and channels never to show (see below).

## Twitch live check

The Community page, and the home page when someone's live, show who's streaming FFX speedruns on Twitch.

**How it works:** a GitHub Action (`.github/workflows/twitch-live.yml`) runs every 5 minutes, started by [cron-job.org](https://cron-job.org):

1. It asks Twitch for live streams in the categories in `hub/twitch.yml`.
2. It keeps the speedruns: streams with one of the `keywords` in the title (speedrun, Any%, CSR, RTA, True RNG…), or a runner from the `runners` list. A keyword only has to match the start of a word, so `speedrun` also finds *Speedruns* and *speedrunning*, but `tas` doesn't match *Fantasy*. Twitch's Speedrun tag isn't used, as streamers often leave it on when playing casually.
3. It leaves out titles with words from `exclude_titles` (*24/7*, *rerun*, *watch party*…), and any channel in `exclude` (for a banned player, say).
4. It publishes the result as `live.json` on a separate `live-data` branch. That branch is a single commit, replaced each time, so it never grows and `main`'s history stays clean. The site reads that file.

### Watching streams on the site

The home page shows the top 3 streams; the Community page (`Hub.streamViewer` in `assets/hub.js`) shows them all, and plays them on the page:

- **Layout:** *Auto* (two per row, and the stream you start goes full width), or 1, 2 or 3 streams per row. The choice is remembered in the visitor's browser. Phones always show one per row.
- **⤢** on a stream makes it full width, and again shrinks it back.
- A playing stream hides its title and viewer count, so videos sit closer together.
- **Watch links:** `pages/community.html?watch=runner1,runner2` (Twitch login names, up to 6) puts those streams first, side by side, with a **▶ Play all** button. Handy to post in Discord for a race. A runner who isn't in the live list (their title has no keyword, say) still gets a card that tries to play them. Channels in `exclude` are never shown. Once streams are playing, **Copy watch link** gives a link to the ones playing.

### Setting it up

**1. A Twitch app**, for the check to ask Twitch who's live:

1. Sign in at <https://dev.twitch.tv/console> with any Twitch account and choose **Register Your Application**:
   - **Name:** anything, e.g. *FFX Speedrun Live Check*.
   - **OAuth Redirect URL:** `http://localhost`.
   - **Category:** *Website Integration*.
   - **Client Type:** *Confidential*.
2. Open the app, copy its **Client ID**, and click **New Secret** to get a **Client Secret**.
3. In the GitHub repository, go to **Settings → Secrets and variables → Actions** and add two repository secrets: `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`.
4. Go to **Actions → Twitch live check → Run workflow** to run it once straight away.

**2. A GitHub token**, so cron-job.org can start the check. GitHub's own schedule is "best effort": runs are often delayed or skipped when GitHub is busy, sometimes for hours. So an outside scheduler starts it instead.

1. On GitHub, open your profile's **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Repository access:** *Only select repositories* → `FFX-Speedrun`.
3. **Permissions → Repository → Actions:** *Read and write*. Leave everything else at *No access*, so the token can only start workflows, not change any files.
4. Note the **expiry date**. When the token expires, the check falls back to GitHub's slower schedule until a new token is put into cron-job.org.

**3. The cron-job.org job:** sign up at [cron-job.org](https://cron-job.org) and create a cronjob:

- **URL:** `https://api.github.com/repos/lukeroddis/FFX-Speedrun/actions/workflows/twitch-live.yml/dispatches`
- **Schedule:** every 5 minutes.
- **Advanced → Request method:** `POST`.
- **Advanced → Headers:**
  - `Accept: application/vnd.github+json`
  - `Authorization: Bearer <the token>`
  - `X-GitHub-Api-Version: 2022-11-28`
- **Advanced → Request body:** `{"ref":"main"}`

A **Test run** should answer **204**, and a new run appears on the Actions tab. A 401 or 403 means the token or its permission is wrong; a 404 usually means a typo in the URL.

**Things to know:**

- **Backup schedule:** the workflow also has its own schedule, every 10 minutes, in case cron-job.org misses a run. It runs at 4, 14, 24… past the hour, as GitHub most often delays runs at the top of the hour.
- **Why every 5 minutes:** the pages read `live.json` from GitHub's raw file server, which caches it for about 5 minutes, so running more often wouldn't show new streams any sooner.
- **Stale lists:** if the list is more than 15 minutes old, the page says when it was last checked.
- **Pausing:** in a public repository, GitHub pauses scheduled workflows after 60 days without any commits. A commit, or **Enable workflow** on the Actions tab, starts the backup schedule again. Runs started by cron-job.org aren't affected.
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
- **The glossary** of in-game names (`notes/glossary/`) and the **grids** (`sphere-grid/`) belong to the game, so they're shared by every category.

The notes page picks these from its address: `notes.html?cat=any&lang=en` (the defaults).

- **To add a language:**
  1. Copy `en/` to a new folder named with the language code (`fr`, `ja`, …).
  2. Translate `index.md` and as many areas as you like.
  3. Add the code to `languages:` in `category.yml`.

  A **Notes** toggle then appears on the notes page.
- **To add a category:**
  1. Make a new folder beside `any/` with its own `category.yml`, `sphere-grid/` and language folders.
  2. List it in `notes/categories.yml`.
- **To add another grid,** such as the Expert Sphere Grid:
  1. Build it as `sphere-grid/expert.json` with the editor (`grid-editor.html?grid=expert`).
  2. Set `grid: expert` in the category that uses it.

  Everything else (routes, the builder, the notes page) follows from that.

## Editing the Sphere Grid

1. Open the editor. On first use it loads `sphere-grid/standard.json` from this repository (`?grid=expert` would load `expert.json` instead); **Load project grid** reloads it at any time.
2. Make your changes. Select mode (`V`) moves nodes and labels, `N` adds nodes, `C` connects them. Undo is `Ctrl+Z`.
3. Your work autosaves in your browser only. To share it, click **Export JSON**, replace `sphere-grid/standard.json` with the downloaded file, and open a pull request.

The grid file stores one node or link per line, so a pull request shows exactly what changed.

## Writing the notes

The notes live in `notes/<category>/<language>/`, one Markdown file per area (see *Categories and languages* above). They use the same format as the Speedrun Overlay notes: numbered steps, and blocks such as `:::battle Sin Fin | 2,000 HP … :::`, `:::spheregrid`, `:::trial` and `:::encounters`. The notes page adds a few extra lines:

- **`party: Tidus, Wakka`** on its own line between steps: who's in the party from here on, for when the story adds or removes characters. It isn't shown in the notes; it only updates the Party panel, so runners don't think they need to do anything.
- **`party: Tidus, Yuna, Kimahri`** inside a `:::battle` block: the party the game puts you in for that fight. The previous party comes back once the fight is over.
- **`route: besaid-tidus`** inside a `:::spheregrid` block: the route file to draw (see below).

**Encounters** are written enemy by enemy, like battle turns. Each enemy gets a red box, and lines that start with a character's name get their portrait:

```markdown
:::encounters
- Dingo:
  - Tidus: Attack
- Condor: Wakka: Attack
- Otherwise: Flee
:::
```

The short form `- Dingo: Tidus Attack` works too. A line without a character (`- Otherwise run away`) shows as plain text, and `Else` / `Otherwise` get a grey *Anything else* box. The whole block is one step when stepping through the notes.

A **`**Formation:** Tidus, Yuna, Lulu`** anywhere in a step also sets the party, and `Switch X for Y` and `Summon …` turns in battles update it as you step past them.

### Maps

A map draws an area cleanly: the paths in a muted blue, the route in gold with an arrow at its end, and only the chests worth opening. It's drawn from text, so it's sharp at any size and its names follow the **Game text** toggle (with Japanese game text, *Luck Sphere* shows as **運スフィア**). Runners click a map to see it full width.

Each map is a file of its own in **`notes/maps/`**, such as `notes/maps/kilika-woods.txt`. Maps have no language, so every category's notes, in every language, can show the same one. The notes show it with a short block:

```markdown
:::map Kilika Woods
file: kilika-woods
:::
```

The title after `:::map` is shown above the map, in the notes' own language. The map file itself looks like this:

```text
size: 100x125
trail: 50,96 50,70 47,45 50,6
trail: 48,52 30,48 22,16
route: 50,96 50,74 44,70 49,60 47,46 30,47 23,18
chest: 44,72 Scout | 14,4
chest: 22,15 Luck Sphere
label: 50,4 To the temple | below
by: Someone
```

- **You don't need to write the numbers yourself.** The [Map Editor](tools/map-editor.html) (on the Tools page) does it: load a screenshot of the in-game map, click along the trails, then along the route, then on each chest. Drag the names off any paths they cover. Then download the file into `notes/maps/` and copy the short block into the notes. The screenshot stays on your computer; only the traced lines are saved. To change a map later, type its file name in the editor and press **Open**.
- **Positions** are `x,y` as a percentage of the map's width and height from the top left. `size` gives the map's shape (width x height); the editor takes it from the screenshot.
- **`trail:`** is one path you can walk, and **`route:`** is the way to go. Use more than one `route:` line for a detour, such as going to a chest and back.
- **`chest:`** names what's inside. Names in the glossary get their item icon and game-language name, so add new ones there (`notes/glossary/`). **`label:`** names anything else, more plainly.
- **Where a name sits:** to the right of its point, or to the left near the map's right-hand edge. After a `|` you can choose `left`, `right`, `above` or `below`, or give an offset like `| 14,4` to move the name's centre that far from its point. The editor writes the offset when you drag a name, and draws a thin line from the name back to its chest.
- **`by: Name`** credits someone whose map you based yours on. It's shown under the map.
- **A category that differs:** lines inside the `:::map` block are added to the file's. A block can add its own `chest:` lines, and if it has `route:` lines, they replace the file's route, for a category that goes another way.
- The whole map can also be written inside the block instead of a file, which is handy for a quick one-off.
- Maps are a kind of their own in the **Show** filter, kept in both presets.

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

Every toggle also has a **?** option, for "not known yet". It's the default, so before the Blitzball game, or before the sphere drop, every option's notes show with a small label such as *Blitzball: Loss*. The chosen options are remembered and also go into the page address (`notes.html?blitz=loss&spheres=return2`), so a link opens the notes on the same route.

Numbers that depend on the route go under `targets:` in `category.yml`. The Power Sphere tracker reads `power-bonus` and shows a range, such as 8–9, until the variant is chosen:

```yaml
targets:
  power-bonus:
    blitz=win: 8
    blitz=loss: 9
```

The **Version** toggle (PS2 · HD Console · PC · Cutscene Remover, which is PC-only) works the same way, with `:::if version=pc,csr` around PC-only steps, such as the FMV Storage Skip. It also changes how the notes read on their own: FMVs and cutscenes can only be skipped on PC, so on PS2 or HD Console a **Skippable FMV** or **Skippable CS** in the notes shows as a plain **FMV** or **CS**, with a note saying so.

Adding another variant needs no code: add it to `variants:` in `category.yml`, give it wording in each `index.md`, and use it in `:::if`.

### Lighter views

The **Show** box lets a runner hide what they no longer need. **Full notes** shows everything, for a first run. **Menus only** keeps battles, sphere grids, shops, equips and encounters, and only the *key* steps. Each kind of block can also be switched on or off by itself, and steps can be All, Key only or None.

A step counts as **key** when it has something in **bold** (a key item, a **Formation:**, a warning) or a Power Sphere drop. To keep a step that doesn't, start it with `!`:

```markdown
1. ! Talk to the guy in red shorts for 400 Gil
```

Hidden lines still count: Power Sphere drops and party changes in them still update the right-hand panel.

### Game language

Runners don't always play the game in the language they read. The **Game text** toggle picks the game's language, and wherever an in-game name from the glossary appears in the notes, the page shows the game's name, large, with the notes' name small underneath. For example, with Japanese game text, "Arctic Wind" shows as **北極の風** with *Arctic Wind* beneath it.

Names are drawn like a row of the game's Item menu. An item with an `icon` shows that icon in every language, English included.

The glossary lives in `notes/glossary/`, split so each translator only touches their own language:

- **`terms.yml`** lists the game's languages, and every name once by id, with its type and icon. The icons are `sphere-red`, `sphere-purple`, `sphere-black`, `weapon`, `potion-blue`, `potion-orange` and `potion-purple`.
  ```yaml
  terms:
    arctic-wind:
      type: item
      icon: weapon
  ```
- **`<language>.yml`** (`en.yml`, `ja.yml`…) gives each id's name in that language:
  ```yaml
  arctic-wind: 北極の風
  ```
  If a name changes form in the notes (a plural, a grammatical case), list the forms with `|` between them: `grenade: Granate | Granaten`. The first form is the one shown to runners.

How it behaves:

- Write the notes normally; nothing needs marking up. The page finds the notes language's names in the text by itself. A trailing "s" is understood as a plural; other plural forms go in the language file as above.
- Names match as whole words where the language uses spaces, accents included ("Élixir"). Japanese, Chinese and Korean names match inside running text too (北極の風を盗む).
- Notes in any language work the same way: French notes saying a term's French name find it through `fr.yml`, and show the icon and the runner's game-language name.
- Copy names exactly as the game shows them, so the runner can match them on screen.
- A term without a name in the chosen game language is shown as written.
- The page only fetches `terms.yml`, the notes language and the game language, however many languages exist.
- The build lists, per language, how many names exist and which are missing, plus any ids not in `terms.yml`.
- To add a game language, add it to `languages` in `terms.yml` and add its `<language>.yml`. It appears in the toggle straight away.
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
