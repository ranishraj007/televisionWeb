import { test } from "node:test";
import assert from "node:assert/strict";
import { rewriteManifest } from "../lib/stream-relay";
import { GET } from "../app/api/stream/route";
import catalog from "../data/channels.json";

test("rewrites nested playlists, segments, AES keys, maps, and renditions", () => {
  const manifest = '#EXTM3U\r\n#EXT-X-KEY:METHOD=AES-128,URI="../key?id=1"\r\n#EXT-X-MAP:URI="init.mp4"\r\n#EXT-X-MEDIA:TYPE=AUDIO,URI="audio.m3u8"\r\nquality/index.m3u8\r\nhttps://provider.test/segment.ts\r\n';
  const rewritten = rewriteManifest(manifest, "https://provider.test/live/main.m3u8", url => `/relay?url=${encodeURIComponent(url)}`);
  for (const path of ["key?id=1", "live/init.mp4", "live/audio.m3u8", "live/quality/index.m3u8", "segment.ts"]) {
    assert.ok(rewritten.includes(encodeURIComponent(`https://provider.test/${path}`)));
  }
});

test("relay restricts origins and forwards media, ranges, and rewritten playlists", async () => {
  const original = globalThis.fetch;
  const source = catalog[0].streamUrl;
  try {
    let calls = 0;
    globalThis.fetch = async (_input, init) => {
      calls++;
      assert.equal(new Headers(init?.headers).get("range"), "bytes=0-15");
      return new Response(new Uint8Array([1, 2, 3]), { status: 206, headers: { "Content-Type": "video/mp2t", "Content-Range": "bytes 0-2/3" } });
    };
    const blocked = await GET(new Request("http://localhost/api/stream?url=http://127.0.0.1/secret"));
    assert.equal(blocked.status, 403);
    assert.equal(calls, 0);
    const segment = new URL("segment.ts", source).href;
    const media = await GET(new Request(`http://localhost/api/stream?url=${encodeURIComponent(segment)}`, { headers: { Range: "bytes=0-15" } }));
    assert.equal(media.status, 206);
    assert.deepEqual([...new Uint8Array(await media.arrayBuffer())], [1, 2, 3]);
    globalThis.fetch = async () => new Response('#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key"\nsegment.ts', { headers: { "Content-Type": "application/vnd.apple.mpegurl" } });
    const playlist = await GET(new Request(`http://localhost/api/stream?url=${encodeURIComponent(source)}`));
    assert.equal(playlist.status, 200);
    assert.match(await playlist.text(), /URI="\/api\/stream\?url=/);
    const secure = new URL(source);
    secure.protocol = "https:";
    const visited: string[] = [];
    globalThis.fetch = async input => {
      const url = String(input);
      visited.push(url);
      return url === source
        ? new Response(null, { status: 301, headers: { Location: secure.href } })
        : new Response('#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key"\nsegment.ts');
    };
    const upgraded = await GET(new Request(`http://localhost/api/stream?url=${encodeURIComponent(source)}`));
    assert.equal(upgraded.status, 200);
    assert.deepEqual(visited, [source, secure.href]);
    assert.ok((await upgraded.text()).includes(encodeURIComponent(new URL("key", secure).href)));
    globalThis.fetch = async () => new Response(null, { status: 302, headers: { Location: "http://127.0.0.1/secret" } });
    assert.equal((await GET(new Request(`http://localhost/api/stream?url=${encodeURIComponent(source)}`))).status, 502);
  } finally { globalThis.fetch = original; }
});
