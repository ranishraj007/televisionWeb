import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playbackSources, playbackRequestUrl } from '../lib/playback-sources';

test('DishHome uses HTTPS directly with the original URL available through the relay', () => {
  const source = 'http://ottlive.dishhome.com.np/protected/channel/aes/manifest.m3u8';
  assert.deepEqual(playbackSources(source, false, true), [source.replace('http:', 'https:'), `/api/stream?url=${encodeURIComponent(source)}`]);
});
test('HTTPS pages relay HTTP-only sources without mixed-content requests', () => {
  const source = 'http://provider.test/live.m3u8';
  assert.deepEqual(playbackSources(source, false, true), [`/api/stream?url=${encodeURIComponent(source)}`]);
  assert.equal(playbackSources(source, false, false)[0], source);
});
test('demo remains a direct source', () => {
  assert.deepEqual(playbackSources('https://demo.test/live.m3u8', true, true), ['https://demo.test/live.m3u8']);
});

test('relays DishHome AES keys but leaves direct segments and existing relay requests alone', () => {
  const key = 'https://ottlive.dishhome.com.np/iptv/dh-pilot/dh-01.key';
  assert.equal(playbackRequestUrl(key), `/api/stream?url=${encodeURIComponent(key)}`);
  for (const url of ['https://ottlive.dishhome.com.np/live/segment.ts', '/api/stream?url=test', 'https://other.test/key']) {
    assert.equal(playbackRequestUrl(url), url);
  }
});
