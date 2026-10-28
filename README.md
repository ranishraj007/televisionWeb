# Nepal TV

A standalone live TV website built with Next.js 16.4.3 (App Router), React 19, TypeScript, Tailwind CSS 4 with `@tailwindcss/postcss`, Lucide React, and hls.js. This project lives entirely in `nepal-tv/`; the original `tv.m3u` and `iptv.m3u` are untouched.

## Run locally

Use Node.js 20.9 or newer (tested with Node 24) and Yarn Classic 1.22.22.

```bash
cd /home/yila/Desktop/TV/nepal-tv
yarn install --frozen-lockfile
yarn dev
```

Open **http://localhost:3000**. To run the production version:

```bash
yarn build
yarn start
```

No environment variables, accounts, backend database, API keys, are required. This is a local project; it has not been deployed. `next start` requires a Node-capable host if you deploy later.

## What the supplied playlist actually contains

The source at `http://anamani.edu.np/prabhu.m3u8` was successfully fetched and inspected. Despite its `.m3u8` extension, it is an **extended multi-channel M3U list**, with `#EXTINF` channel metadata and no `#EXT-X-*` HLS manifest tags.

- 166 entries in the supplied snapshot.
- 147 unique HTTP(S) channel stream URLs imported.
- 15 entries omitted because they have no stream URL.
- 4 entries omitted because their stream URL already appears in the list.
- The source advertises an EPG URL, but that EPG has not been fetched or verified. The guide is explicitly sample data.

`data/source.m3u` preserves the original snapshot. `data/channels.json` is the parsed catalog; `data/import-report.json` records the source, EPG hint, and omissions. Channel availability has **not** been verified individually. A LIVE badge identifies a channel listing, not a successful health check.

Some source groups cover multiple genres. The importer assigns a browsing category using `categoryFor()` while preserving the original `group-title` in `group`. Only explicit language metadata and the source's Nepali group produce language labels. HTTP(S) logo URLs are preserved, with locally styled text fallbacks when unavailable; HTTP logos are not loaded on HTTPS pages.

## Refresh or replace channels

Fetch and import a fresh list at development time:

```bash
yarn playlist:import http://anamani.edu.np/prabhu.m3u8
```

Or import a downloaded file, with the original source URL for resolving relative stream/logo paths:

```bash
yarn playlist:import data/source.m3u --source-url http://anamani.edu.np/prabhu.m3u8
```

To use only the included public demo playlist:

```bash
yarn playlist:import data/sample.m3u
```

Restart development or rebuild the production app after changing the catalog. Import writes the catalog and report only; it does not overwrite the supplied raw snapshot. The importer refuses to replace the catalog when no usable channels are found.

The parser supports `#EXTINF`, `tvg-id`, `tvg-name`, `tvg-logo`, `group-title`, `tvg-language`, `tvg-chno`, relative URLs, BOM/CRLF, quoted commas, duplicate detection, and missing streams. HLS media and master manifests become **one channel pointing to the original manifest URL**, never a list of segments or quality variants. For a local HLS manifest, pass `--source-url` with its reachable origin URL. Unsupported protocols and URLs containing username/password credentials are rejected. No authentication headers, DRM bypass, or provider-specific access mechanisms are supplied.

## Features and routes

- `/`: featured channel, local mountain artwork, searchable/filterable channel grid, demo link, and sample guide.
- `/live`: all channels, category filters, URL-based searches, A–Z sorting, and progressive loading.
- `/categories`: category browsing with real catalog counts.
- `/favorites`: favorites persisted on this browser using localStorage, with hydration-safe loading, cross-tab updates, and an in-memory fallback if storage is blocked.
- `/watch/[id]`: hls.js first, native HLS fallback, muted initial state, deliberate play, play/pause, seek for on-demand content, volume/mute, fullscreen, supported picture-in-picture, buffering, timeout/error states, retry, and related channels.
- `/watch/player-demo`: Big Buck Bunny public HLS demo; explicitly labeled as a sample film, not live television.
- `/guide`: clearly labeled illustrative programmes. `Programme` and `lib/epg.ts` provide the adapter boundary for a future XMLTV/JSON EPG. Do not remove sample labels until real guide data is connected.
- Custom 404, loading skeletons, error boundary, metadata, SVG favicon, reduced-motion support, keyboard focus states, and mobile navigation.

Player keyboard shortcuts when the player frame is focused: **Space/K** play/pause, **M** mute, **F** fullscreen. Standard buttons and sliders are keyboard accessible. Playback is never automatically started with sound. HLS instances, timers, media sources, and event listeners are cleaned up when navigating away or changing channels.

## Streaming constraints

Catalog channels first try the provider directly using hls.js. DishHome HTTP URLs use the verified HTTPS endpoint; its AES keys use the relay because the provider omits CORS headers on key responses, while video segments remain direct. If direct playback fails, channels retry through `/api/stream`, a same-origin server relay. HTTP-only sources on HTTPS pages go straight to the relay. It rewrites HLS playlist entries and URI attributes so variant playlists, segments, AES keys, and initialization maps use the relay too. This avoids browser CORS and HTTP mixed-content failures. The public demo still plays directly. A browser-player fallback and an original-stream link are available for native playback or browser stream extensions.

The relay requires a Node server that can reach the provider. Only origins in `data/channels.json` are allowed, including redirects and nested resources; an additional provider CDN origin must be explicitly configured before it can be relayed. Range requests and streaming media responses are supported; live playlists are not cached. No credentials or access-bypass mechanisms are added. Offline, subscription-only, geographically restricted, or unsupported-codec streams can still fail. VLC may support codecs that your browser does not.

**Playback engine:** hls.js is preferred when Media Source Extensions are available, even if the browser advertises native HLS. This avoids Chrome native-HLS incompatibilities with provider streams and preserves hls.js media-error recovery. Native HLS is used when hls.js is unsupported (including applicable Safari/iOS configurations). Fullscreen/PiP depend on browser support and user gestures.

## Checks

```bash
yarn typecheck
yarn test
yarn build
```

Browser tests use installed Google Chrome by default. Start the production server in one terminal, then run tests in another:

```bash
yarn start
# another terminal:
yarn test:e2e
```

If Chrome is unavailable, install Playwright Chromium and select it:

```bash
yarn playwright install chromium
PLAYWRIGHT_CHANNEL=chromium yarn test:e2e
```

Use `TEST_BASE_URL=http://127.0.0.1:3001` to test another port. Browser tests require network access for the public Mux playback test. Screenshots and traces are saved in the ignored `test-results/` directory. Tests cover real demo playback, the hls.js fallback, paused/muted initial state, pause/unmute, navigation away, unavailable-stream retry, search/filter empty states, favorites persistence/removal, mobile navigation, and horizontal overflow. Parser tests cover HLS classification and malformed/duplicate/unsafe channel entries.

## Customize

- `lib/config.ts`: name, description, and branding.
- `app/globals.css`: design tokens, Tailwind v4 theme, and responsive component styling. No Tailwind config file is needed.
- `types/channel.ts`: channel and programme models.
- `lib/channels.ts`: featured ordering, categories, related channels, and public demo.
- `components/layout/`: responsive header and footer.
- `components/tv/`: reusable browser, cards, player, logo fallback, favorites, and guide.

## Sources and assets

- Next.js setup: https://nextjs.org/docs/app/getting-started/installation
- Tailwind v4 integration: https://tailwindcss.com/docs/installation/framework-guides/nextjs
- hls.js: https://github.com/video-dev/hls.js
- Public HLS demo: https://test-streams.mux.dev/ (Mux-hosted hls.js test stream).
- Big Buck Bunny: https://peach.blender.org/ — Blender Foundation, CC BY 3.0; demo media is streamed from Mux, not bundled.
- Local placeholder photograph: `public/images/mountains.jpg`, downloaded from https://images.unsplash.com/photo-1464822759023-fed622ff2c3b . Decorative mountain scenery, not channel/broadcast artwork or a claimed location.
- Favicon and text-based channel fallbacks are local SVG/CSS assets. Actual channel names and remote logo references come from the supplied playlist.

## Live viewer count

The player displays active playback sessions on this app per channel, including the current viewer after playback starts. Paused, failed, and buffering players do not send active heartbeats. Counts refresh every 15 seconds; abandoned sessions expire after 45 seconds. Each player instance receives a random session ID; multiple tabs count separately. Failed count requests display “Viewer count unavailable” instead of a fabricated number.

Presence lives in the Node process memory and resets on restart. This supports the current single-server app; multiple server instances or serverless deployments need a shared presence store (for example Redis) before the counts can be combined reliably. It does not measure viewers watching the provider through other apps.
