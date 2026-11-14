// Lists who's streaming FFX speedruns on Twitch right now, and writes live-out/live.json.
// Run by .github/workflows/twitch-live.yml every 10 minutes. Settings: hub/twitch.yml.
// Needs TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET (a Twitch app's credentials, kept as repository secrets).
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

/* the same small YAML subset the site reads: "key: value", indented maps, [a, b] lists, # comments */
export function parseYaml(src) {
  const root = {}, stack = [{ indent: -1, obj: root }];
  for (const raw of String(src).replace(/\r/g, "").split("\n")) {
    const line = raw.replace(/\s+#.*$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const indent = line.match(/^\s*/)[0].length, m = line.trim().match(/^([^:]+?):\s*(.*)$/);
    if (!m) continue;
    while (stack.at(-1).indent >= indent) stack.pop();
    const parent = stack.at(-1).obj, key = m[1].trim(), val = m[2].trim();
    if (val === "") stack.push({ indent, obj: parent[key] = {} });
    else parent[key] = /^\[.*\]$/.test(val) ? val.slice(1, -1).split(",").map(s => s.trim()).filter(Boolean) : val;
  }
  return root;
}

const list = v => (Array.isArray(v) ? v : []);

/* Does a title contain this word? Any capitals, and a word that starts with a letter or digit must start a
   word in the title: "TAS" matches "FFX TAS" but not "Fantasy", "race" matches "races" but not "embrace". */
export function inTitle(title, word) {
  const w = String(word).toLowerCase(), esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp((/^[a-z0-9]/.test(w) ? "(^|[^a-z0-9])" : "") + esc).test(String(title).toLowerCase());
}

/* Everything that talks to Twitch. fetchFn is swappable so this can be tested without Twitch. */
export async function collect({ cfg, clientId, clientSecret, fetchFn = fetch }) {
  const tokenRes = await fetchFn(`https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=client_credentials`, { method: "POST" });
  if (!tokenRes.ok) throw new Error(`Twitch refused the app's credentials (${tokenRes.status})`);
  const { access_token } = await tokenRes.json();
  const helix = async path => {
    const r = await fetchFn(`https://api.twitch.tv/helix/${path}`, { headers: { "Client-Id": clientId, Authorization: `Bearer ${access_token}` } });
    if (!r.ok) throw new Error(`Twitch ${path.split("?")[0]} answered ${r.status}`);
    return r.json();
  };

  // the games' Twitch IDs
  const names = list(cfg.games);
  const games = names.length ? (await helix(`games?${names.map(n => `name=${encodeURIComponent(n)}`).join("&")}`)).data : [];
  const missing = names.filter(n => !games.some(g => g.name.toLowerCase() === n.toLowerCase()));
  const gameIds = new Set(games.map(g => g.id));

  // live streams in those games (up to 500), plus the listed runners
  const streams = [];
  if (gameIds.size) {
    let cursor = "";
    for (let page = 0; page < 5; page++) {
      const j = await helix(`streams?${[...gameIds].map(id => `game_id=${id}`).join("&")}&first=100${cursor ? `&after=${cursor}` : ""}`);
      streams.push(...j.data);
      cursor = j.pagination?.cursor;
      if (!cursor || j.data.length < 100) break;
    }
  }
  const runners = list(cfg.runners).map(r => r.toLowerCase());
  for (let i = 0; i < runners.length; i += 100) {
    const j = await helix(`streams?${runners.slice(i, i + 100).map(l => `user_login=${encodeURIComponent(l)}`).join("&")}`);
    for (const s of j.data) if (gameIds.has(s.game_id) && !streams.some(x => x.id === s.id)) streams.push(s);
  }

  // keep the speedruns, minus excluded channels and titles (24/7 reruns, watch parties).
  // Tags aren't used: streamers often leave the Speedrun tag on when playing casually.
  const keywords = list(cfg.keywords), badWords = list(cfg.exclude_titles);
  const excluded = list(cfg.exclude).map(l => l.toLowerCase());
  const isRun = s => !excluded.includes(s.user_login.toLowerCase())
    && !badWords.some(w => inTitle(s.title, w))
    && (runners.includes(s.user_login.toLowerCase()) || keywords.some(k => inTitle(s.title, k)));
  const live = streams.filter(isRun).sort((a, b) => b.viewer_count - a.viewer_count).map(s => ({
    login: s.user_login, name: s.user_name, title: s.title, game: s.game_name, viewers: s.viewer_count,
    started: s.started_at, language: s.language, thumbnail: s.thumbnail_url.replace("{width}", "440").replace("{height}", "248"),
  }));
  return { updated: new Date().toISOString(), games: games.map(g => g.name), missing, streams: live };
}

async function main() {
  const { TWITCH_CLIENT_ID: clientId, TWITCH_CLIENT_SECRET: clientSecret } = process.env;
  if (!clientId || !clientSecret) throw new Error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET aren't set. Add them as repository secrets (see README).");
  const cfg = parseYaml(await readFile("hub/twitch.yml", "utf8"));
  const out = await collect({ cfg, clientId, clientSecret });
  if (out.missing.length) console.warn(`Not found on Twitch: ${out.missing.join(", ")}. Check the names in hub/twitch.yml.`);
  await mkdir("live-out", { recursive: true });
  await writeFile("live-out/live.json", JSON.stringify(out, null, 2) + "\n");
  console.log(`${out.streams.length} live: ${out.streams.map(s => s.login).join(", ") || "nobody"}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error(e.message); process.exit(1); });
