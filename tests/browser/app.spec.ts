import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Logos are optional; avoid depending on third-party image hosts in functional tests.
  await page.route('**/*', route => {
    const request = route.request();
    if (request.resourceType() === 'image' && !request.url().includes('127.0.0.1')) return route.abort();
    return route.continue();
  });
});
test("desktop home, categories, search, empty state, and guide", async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /A little closer/ })).toBeVisible();
  await expect(page.locator('.channel-card')).toHaveCount(12);
  await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await page.goto('/live');
  await page.getByRole('button', { name: 'News', exact: true }).click();
  await expect(page.locator('.channel-card').first()).toContainText('News');
  await page.getByRole('textbox', { name: 'Filter channels' }).fill('does-not-exist-12345');
  await expect(page.getByRole('heading', { name: 'No channels found' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.channel-card')).toHaveCount(24);
  await page.getByRole('button', { name: 'Show more channels' }).click();
  await expect(page.locator('.channel-card')).toHaveCount(48);
  await page.goto('/live?q=kantipur');
  await expect(page.getByRole('textbox', { name: 'Filter channels' })).toHaveValue('kantipur');
  await expect(page.locator('.channel-card')).toHaveCount(2);
  await page.goto('/guide');
  await expect(page.getByRole('main').getByText('Preview only — these are example programmes, not actual broadcast schedules.')).toBeVisible();
  await page.goto('/watch/does-not-exist');
  await expect(page.getByRole('heading', { name: 'A little out of range.' })).toBeVisible();
  expect(errors).toEqual([]);
});
test("favorites persist after navigation and reload, then remove", async ({ page }) => {
  await page.goto('/favorites');
  await expect(page.getByRole('heading', { name: 'Your favorites start here' })).toBeVisible();
  await page.goto('/live');
  const button = page.getByRole('button', { name: 'Add Kantipur TV HD to favorites', exact: true });
  await button.click();
  await page.goto('/favorites');
  await expect(page.locator('.channel-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.channel-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Remove Kantipur TV HD from favorites', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your favorites start here' })).toBeVisible();
});
test("mobile navigation, category links, and overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Categories' }).click();
  await expect(page.getByRole('heading', { name: /What are you in the mood/ })).toBeVisible();
  await page.locator('.category-tile').filter({ has: page.getByRole('heading', { name: 'Sports', exact: true }) }).click();
  await expect(page.getByRole('button', { name: 'Sports', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("public Mux HLS demo plays, pauses, mutes, and cleans up on navigation", async ({ page }) => {
  await page.goto('/watch/player-demo');
  await expect(page.getByRole('heading', { name: 'Big Buck Bunny', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Big Buck Bunny', exact: true })).toBeVisible({ timeout: 35000 });
  expect(await page.locator('video').evaluate((video: HTMLVideoElement) => video.paused && video.muted)).toBe(true);
  await page.getByRole('button', { name: 'Play Big Buck Bunny', exact: true }).click();
  await expect.poll(() => page.locator('video').evaluate((video: HTMLVideoElement) => video.currentTime), { timeout: 20000 }).toBeGreaterThan(1);
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Unmute', exact: true }).click();
  expect(await page.locator('video').evaluate((video: HTMLVideoElement) => video.muted)).toBe(false);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect(await page.locator('video').evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
  await page.screenshot({ path: 'test-results/watch-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'All channels', exact: true }).first().click();
  await expect(page.locator('video')).toHaveCount(0);
});
test("unreachable stream fails gracefully and retry remains usable", async ({ page }) => {
  await page.route('https://test-streams.mux.dev/**', route => route.fulfill({ status: 403, body: 'Unavailable' }));
  await page.goto('/watch/player-demo');
  await expect(page.getByRole('heading', { name: 'A moment off air.' })).toBeVisible({ timeout: 35000 });
  await expect(page.getByRole('alert', { name: 'Playback error' })).toContainText(/connection failed|could not be opened/);
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A moment off air.' })).toBeVisible({ timeout: 35000 });
});

test("hls.js fallback plays when native HLS is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.canPlayType;
    HTMLMediaElement.prototype.canPlayType = function(type: string) {
      return type.includes('mpegurl') ? '' : original.call(this, type);
    };
  });
  await page.goto('/watch/player-demo');
  await expect(page.getByRole('button', { name: 'Play Big Buck Bunny', exact: true })).toBeVisible({ timeout: 35000 });
  expect(await page.locator('video').evaluate((video: HTMLVideoElement) => video.currentSrc.startsWith('blob:'))).toBe(true);
  await page.getByRole('button', { name: 'Play Big Buck Bunny', exact: true }).click();
  await expect.poll(() => page.locator('video').evaluate((video: HTMLVideoElement) => video.currentTime), { timeout: 20000 }).toBeGreaterThan(1);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/watch-mobile.png', fullPage: true });
});

test("Kantipur plays through the relay when the browser advertises native HLS", async ({ page }) => {
  // Reproduce browsers which advertise HLS but cannot play this provider natively.
  await page.addInitScript(() => {
    const original = HTMLMediaElement.prototype.canPlayType;
    HTMLMediaElement.prototype.canPlayType = function(type: string) {
      return type.includes('mpegurl') ? 'maybe' : original.call(this, type);
    };
  });
  await page.route("https://ottlive.dishhome.com.np/**", route => route.abort());
  await page.goto('/watch/kantipur-tv-hd-pmx9nj');
  await page.getByRole('button', { name: 'Play Kantipur TV HD', exact: true }).click({ timeout: 35000 });
  const video = page.locator('video');
  expect(await video.evaluate((v: HTMLVideoElement) => v.currentSrc.startsWith('blob:'))).toBe(true);
  const start = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15000 }).toBeGreaterThan(start + 2);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.getVideoPlaybackQuality().totalVideoFrames), { timeout: 15000 }).toBeGreaterThan(0);
  expect(await video.evaluate((v: HTMLVideoElement) => v.error)).toBeNull();
});


test("Kantipur plays direct video while relaying the CORS-blocked AES key", async ({ page }) => {
  const relayRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/stream')) relayRequests.push(request.url()); });
  await page.goto('/watch/kantipur-tv-hd-pmx9nj');
  await page.getByRole('button', { name: 'Play Kantipur TV HD', exact: true }).click({ timeout: 35000 });
  const video = page.locator('video');
  const start = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15000 }).toBeGreaterThan(start + 2);
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.getVideoPlaybackQuality().totalVideoFrames), { timeout: 15000 }).toBeGreaterThan(0);
  expect(relayRequests.length).toBeGreaterThan(0);
  await expect(page.locator('.viewer-count')).toContainText(/[1-9][0-9,]* watching now/);
  for (const request of relayRequests) {
    expect(new URL(new URL(request).searchParams.get('url')!).pathname).toMatch(/\.key$/);
  }
});
