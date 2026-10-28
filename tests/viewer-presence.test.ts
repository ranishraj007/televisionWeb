import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateViewers, VIEWER_TTL_MS } from '../lib/viewer-presence';
import { GET, POST } from '../app/api/viewers/route';
import catalog from '../data/channels.json';

test('counts concurrent sessions once, isolates channels, handles leave, expires abandoned viewers', () => {
  const now = Date.now() + 100000;
  assert.equal(updateViewers('test-a', 'viewer-1', true, now), 1);
  assert.equal(updateViewers('test-a', 'viewer-1', true, now + 1000), 1);
  assert.equal(updateViewers('test-a', 'viewer-2', true, now + 1000), 2);
  assert.equal(updateViewers('test-b', 'viewer-3', true, now + 1000), 1);
  assert.equal(updateViewers('test-a', 'viewer-1', false, now + 2000), 1);
  assert.equal(updateViewers('test-a', undefined, false, now + VIEWER_TTL_MS + 1001), 0);
  assert.equal(updateViewers('test-b', undefined, false, now + VIEWER_TTL_MS + 1001), 0);
});

test('presence API validates requests and shares counts between viewers', async () => {
  const channelId = catalog[0].id;
  const post = (sessionId: string, active: boolean, origin = 'http://localhost') => POST(new Request('http://localhost/api/viewers', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ channelId, sessionId, active }),
  }));
  const first = 'a'.repeat(36), second = 'b'.repeat(36);
  assert.deepEqual(await (await post(first, true)).json(), { count: 1 });
  assert.deepEqual(await (await post(second, true)).json(), { count: 2 });
  assert.deepEqual(await (await post(first, true)).json(), { count: 2 });
  assert.deepEqual(await (await GET(new Request(`http://localhost/api/viewers?channelId=${channelId}`))).json(), { count: 2 });
  assert.deepEqual(await (await post(first, false)).json(), { count: 1 });
  assert.deepEqual(await (await post(second, false)).json(), { count: 0 });
  const boundAddress = await POST(new Request('http://0.0.0.0:3000/api/viewers', {
    method: 'POST', headers: { Host: 'localhost:3000', Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
    body: JSON.stringify({ channelId, sessionId: first, active: false }),
  }));
  assert.equal(boundAddress.status, 200);
  assert.equal((await post('invalid', true)).status, 400);
  assert.equal((await post(first, true, 'https://other.test')).status, 403);
  assert.equal((await GET(new Request('http://localhost/api/viewers?channelId=missing'))).status, 404);
});
