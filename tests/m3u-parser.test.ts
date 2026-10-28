import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseM3u } from "../lib/m3u-parser";
const base = "https://example.com/list/channels.m3u8";
test("parses channel attributes, quoted commas, language, and relative paths", () => {
  const result = parseM3u('#EXTM3U\n#EXTINF:-1 tvg-id="news.1" tvg-name="News, Nepal" tvg-logo="logos/news.png" group-title="News" tvg-language="Nepali",News, Nepal\n../live/index.m3u8', base);
  assert.equal(result.kind, "channels");
  assert.equal(result.channels.length, 1);
  assert.equal(result.channels[0].name, "News, Nepal");
  assert.equal(result.channels[0].logo, "https://example.com/list/logos/news.png");
  assert.equal(result.channels[0].streamUrl, "https://example.com/live/index.m3u8");
  assert.equal(result.channels[0].language, "Nepali");
  assert.equal(result.channels[0].tvgId, "news.1");
  assert.equal(result.epgUrl, undefined);
});
test("treats a master manifest as exactly one stream", () => {
  const result = parseM3u('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=120000\nlow/index.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=600000\nhigh/index.m3u8', base);
  assert.equal(result.kind, "hls"); assert.equal(result.channels.length, 1); assert.equal(result.channels[0].streamUrl, base);
});
test("does not mistake media segments for channels", () => {
  const result = parseM3u('#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXTINF:6.0,\npart1.ts\n#EXTINF:6.0,\npart2.ts\n#EXT-X-ENDLIST', base);
  assert.equal(result.kind, "hls"); assert.equal(result.channels.length, 1);
});
test("a local HLS manifest requires a stream source URL", () => {
  assert.throws(() => parseM3u('#EXTM3U\n#EXT-X-VERSION:3'), /source URL/);
});
test("skips missing URLs without assigning the next channel's stream", () => {
  const result = parseM3u('#EXTM3U\n#EXTINF:-1,Missing\n#EXTINF:-1,Present\nhttps://example.com/tv.m3u8\n#EXTINF:-1,Also missing');
  assert.equal(result.entries, 3); assert.equal(result.channels.length, 1); assert.equal(result.channels[0].name, "Present"); assert.equal(result.warnings.length, 2);
});
test("deduplicates streams but keeps different URLs with the same channel name", () => {
  const result = parseM3u('#EXTM3U\n#EXTINF:-1,One\nhttps://example.com/a.m3u8\n#EXTINF:-1,Duplicate\nhttps://example.com/a.m3u8\n#EXTINF:-1,One\nhttps://example.com/b.m3u8');
  assert.equal(result.channels.length, 2); assert.notEqual(result.channels[0].id, result.channels[1].id); assert.equal(result.warnings.length, 1);
});
test("rejects unsafe URLs and strips unsafe logo URLs", () => {
  const result = parseM3u('#EXTM3U\n#EXTINF:-1,Unsafe\njavascript:alert(1)\n#EXTINF:-1,Credentials\nhttps://user:password@example.com/live\n#EXTINF:-1 tvg-logo="javascript:alert(1)",Safe\nhttps://example.com/live.m3u8');
  assert.equal(result.channels.length, 1); assert.equal(result.channels[0].logo, undefined); assert.equal(result.warnings.length, 2);
});
test("supports BOM, CRLF, single-quoted attributes, EPG metadata, and comments", () => {
  const result = parseM3u('\uFEFF#EXTM3U x-tvg-url="https://example.com/epg.xml"\r\n#EXTINF:-1 group-title=\'Sports\' tvg-name=\'Match\',\r\n#EXTVLCOPT:http-user-agent=Example\r\nhttps://example.com/a.m3u8');
  assert.equal(result.channels[0].name, "Match"); assert.equal(result.channels[0].category, "Sports"); assert.equal(result.epgUrl, "https://example.com/epg.xml");
});
test("rejects an HTML error response", () => {
  assert.throws(() => parseM3u('<html>Forbidden</html>'), /not an extended M3U/);
});
test("IDs stay stable when playlist order changes", () => {
  const a = '#EXTINF:-1,One\nhttps://example.com/one.m3u8';
  const b = '#EXTINF:-1,Two\nhttps://example.com/two.m3u8';
  assert.equal(parseM3u(`#EXTM3U\n${a}\n${b}`).channels[0].id, parseM3u(`#EXTM3U\n${b}\n${a}`).channels[1].id);
});
test("the supplied snapshot imports 147 distinct streams and reports omissions", () => {
  const result = parseM3u(readFileSync(new URL('../data/source.m3u', import.meta.url), 'utf8'), 'http://anamani.edu.np/prabhu.m3u8');
  assert.equal(result.entries, 166); assert.equal(result.channels.length, 147);
  assert.equal(result.warnings.filter(w => w.includes('no stream URL')).length, 15);
  assert.equal(result.warnings.filter(w => w.includes('duplicate')).length, 4);
});
