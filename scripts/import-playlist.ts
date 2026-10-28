import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseM3u } from "../lib/m3u-parser";

const args = process.argv.slice(2);
const input = args[0] || "data/source.m3u";
const baseIndex = args.indexOf("--source-url");
const sourceUrl = baseIndex >= 0 ? args[baseIndex + 1] : /^https?:\/\//.test(input) ? input : undefined;
let content: string;
if (/^https?:\/\//.test(input)) {
  const response = await fetch(input, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Playlist download failed (${response.status}).`);
  content = await response.text();
} else content = await readFile(resolve(input), "utf8");
const result = parseM3u(content, sourceUrl);
if (!result.channels.length) throw new Error("No valid channels found; existing catalog was not changed.");
await writeFile(resolve("data/channels.json"), JSON.stringify(result.channels, null, 2) + "\n");
await writeFile(resolve("data/import-report.json"), JSON.stringify({
  source: sourceUrl || input, kind: result.kind, entries: result.entries,
  imported: result.channels.length, epgUrl: result.epgUrl,
  warnings: result.warnings,
}, null, 2) + "\n");
console.log(`Imported ${result.channels.length} channels from ${result.entries} entries (${result.kind}).`);
for (const warning of result.warnings) console.warn(warning);
