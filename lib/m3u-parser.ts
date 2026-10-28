import type { Channel } from "../types/channel";

export interface PlaylistResult {
  kind: "channels" | "hls";
  channels: Channel[];
  warnings: string[];
  entries: number;
  epgUrl?: string;
}
export function safeHttpUrl(value: string, base?: string): string | undefined {
  if (!value.trim()) return;
  try {
    const url = base ? new URL(value, base) : new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return;
    return url.href;
  } catch { return; }
}
function attributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s,]+))/g;
  for (const match of line.matchAll(regex)) attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4];
  return attrs;
}
function displayName(line: string): string {
  let quote = "";
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if ((char === '"' || char === "'") && (!quote || quote === char)) quote = quote ? "" : char;
    if (char === "," && !quote) return line.slice(i + 1).trim();
  }
  return "";
}
function hash(value: string): string {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) result = Math.imul(result ^ value.charCodeAt(i), 16777619);
  return (result >>> 0).toString(36);
}
export function categoryFor(group: string, name: string): string {
  if (group.toLowerCase() === "demo") return "Demo";
  const text = `${group} ${name}`.toLowerCase();
  if (/sport|fox/.test(text)) return "Sports";
  if (/news|samachar|aaj tak|cnn|bbc|aljazeera/.test(text)) return "News";
  if (/movie|cinema|cine |film/.test(text)) return "Movies";
  if (/music|gunjan|mtv/.test(text)) return "Music";
  if (/kids|cartoon|nick|disney/.test(text)) return "Kids";
  if (/infotainment|discovery|geographic|animal planet|explore/.test(text)) return "Discovery";
  if (/spiritual|life|bhakti|omkar|bodhi/.test(text)) return "Spiritual";
  if (/entertainment|ramailo|reality|comedy|himalaya|ap1|kantipur/.test(text)) return "Entertainment";
  return "General";
}
/** HLS manifests are a single stream. EXTINF segments must never become channels. */
export function parseM3u(input: string, sourceUrl?: string, fallbackName = "Prabhu TV"): PlaylistResult {
  const lines = input.replace(/^\uFEFF/, "").split(/\r?\n/).map(line => line.trim());
  const headerLine = lines.find(Boolean);
  if (!headerLine?.startsWith("#EXTM3U")) throw new Error("This file is not an extended M3U playlist (missing #EXTM3U).");
  if (lines.some(line => /^#EXT-X-/.test(line))) {
    const streamUrl = sourceUrl && safeHttpUrl(sourceUrl);
    if (!streamUrl) throw new Error("A public HTTP(S) source URL is required for a single HLS manifest.");
    return { kind: "hls", entries: 1, warnings: [], channels: [{ id: `stream-${hash(streamUrl)}`, name: fallbackName, category: "General", streamUrl }] };
  }
  const channels: Channel[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  let pending: { attrs: Record<string, string>; name: string; line: number } | undefined;
  let entries = 0;
  const finishMissing = () => { if (pending) warnings.push(`Line ${pending.line}: ${pending.name || "Unnamed channel"} has no stream URL.`); };
  lines.forEach((line, index) => {
    if (line.startsWith("#EXTINF:")) {
      finishMissing(); entries++;
      const attrs = attributes(line);
      pending = { attrs, name: displayName(line) || attrs["tvg-name"] || `Channel ${entries}`, line: index + 1 };
      return;
    }
    if (!line || line.startsWith("#") || !pending) return;
    const { attrs, name } = pending;
    pending = undefined;
    const streamUrl = safeHttpUrl(line, sourceUrl);
    if (!streamUrl) { warnings.push(`${name}: unsupported or invalid stream URL.`); return; }
    if (seen.has(streamUrl)) { warnings.push(`${name}: duplicate stream URL skipped.`); return; }
    seen.add(streamUrl);
    const group = attrs["group-title"] || "General";
    const slug = (attrs["tvg-id"] || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "channel";
    channels.push({
      id: `${slug}-${hash(streamUrl)}`, name,
      logo: attrs["tvg-logo"] ? safeHttpUrl(attrs["tvg-logo"], sourceUrl) : undefined,
      category: categoryFor(group, name), group,
      isDemo: group.toLowerCase() === "demo" || undefined,
      language: attrs["tvg-language"] || (group === "Nepali" ? "Nepali" : undefined),
      streamUrl, tvgId: attrs["tvg-id"], number: attrs["tvg-chno"],
    });
  });
  finishMissing();
  const header = attributes(headerLine!);
  return { kind: "channels", channels, warnings, entries, epgUrl: safeHttpUrl(header["x-tvg-url"] || header["url-tvg"] || "", sourceUrl) };
}
