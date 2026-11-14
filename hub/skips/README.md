# Skips

One Markdown file per skip. Each becomes its own page on the site (`skips/<file name>/`), and a card on the Skips page.

Start a new skip by copying one of these files. The part between the `---` lines is the skip's details:

| Field | What it's for |
|---|---|
| `name` | The skip's name, as runners call it |
| `aliases` | Optional: other names it goes by, e.g. `[MRR Skip, Terra Skip]`. The notes link any of these names to this page. |
| `area` | Where it happens in the game |
| `notes` | Optional: the area of the notes where it's used, as in the notes' address (e.g. `guadosalam`), for a "Used in the notes" link |
| `categories` | Which categories use it, e.g. `[any]` |
| `difficulty` | 1 (easy) to 5 (hardest), shown as stars |
| `summary` | One sentence on what it does. Shown on the card, and by search engines. |
| `video`, `by`, `by_url` | The video, who made it, and a link to them, for a skip that's the same on every version |
| `versions` | Instead, one set of `video`, `by` and `by_url` per version (`hd`, `ps2`), when the versions differ. The page shows a tab for each. |
| `versions: [pc]` | For a skip that only exists on some versions (e.g. PC), with one `video` for all of them. The page says "PC only". |

Below the details, write the guide in Markdown:

- **Headings:** start a line with `## ` for a heading.
- **Lists:** start lines with `- ` for a list, or `1. ` for steps.
- **Text styles:** `**bold**`, `*italic*`, and `[links](https://…)`.
- **Images:** add an image with `![What it shows](images/my-picture.png)`, putting the picture in the `images/` folder here.
- **Version-specific text:** wrap it in `:::if version=ps2` … `:::` (or `version=hd`). It only shows on that version's tab.
- **Callouts:** `:::tip` … `:::` or `:::warning` … `:::` make a highlighted box.
