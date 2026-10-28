import catalog from "@/data/channels.json";
import { rewriteManifest } from "@/lib/stream-relay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only explicitly imported provider origins can be fetched, including redirects
// and nested playlist resources. This is not a general-purpose URL proxy.
const origins = new Set(catalog.flatMap(channel => {
  const url = new URL(channel.streamUrl);
  const allowed = [url.origin];
  // Providers commonly upgrade their published HTTP URLs to HTTPS.
  if (url.protocol === "http:" && !url.port) {
    url.protocol = "https:";
    allowed.push(url.origin);
  }
  return allowed;
}));
function permitted(url: URL) {
  return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && origins.has(url.origin);
}
export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("url");
  let target: URL;
  try { target = new URL(value || ""); } catch { return new Response("Invalid stream URL", { status: 400 }); }
  if (!permitted(target)) return new Response("Stream origin is not in the channel catalog", { status: 403 });
  try {
    const headers = new Headers();
    const range = request.headers.get("range");
    if (range) headers.set("Range", range);
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(20000)]);
    let upstream: Response | undefined;
    for (let redirects = 0; redirects <= 5; redirects++) {
      upstream = await fetch(target, { headers, redirect: "manual", cache: "no-store", signal });
      if (![301, 302, 303, 307, 308].includes(upstream.status)) break;
      const location = upstream.headers.get("location");
      await upstream.body?.cancel();
      if (!location || redirects === 5) throw new Error("Invalid redirect");
      target = new URL(location, target);
      if (!permitted(target)) return new Response("Provider redirected to an unconfigured origin", { status: 502 });
    }
    if (!upstream?.ok) {
      await upstream?.body?.cancel();
      return new Response(`Provider returned HTTP ${upstream?.status ?? 502}`, { status: 502 });
    }
    const responseHeaders = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    const type = upstream.headers.get("content-type") || "application/octet-stream";
    if (/\.m3u8?$/i.test(target.pathname) || /mpegurl/i.test(type)) {
      const manifest = await upstream.text();
      if (!manifest.trimStart().startsWith("#EXTM3U")) return new Response("Provider did not return an HLS playlist", { status: 502 });
      const rewritten = rewriteManifest(manifest, target.href, url => {
        if (!permitted(new URL(url))) throw new Error("Unconfigured resource origin");
        return `/api/stream?url=${encodeURIComponent(url)}`;
      });
      responseHeaders.set("Content-Type", "application/vnd.apple.mpegurl");
      return new Response(rewritten, { headers: responseHeaders });
    }
    responseHeaders.set("Content-Type", type);
    for (const name of ["content-range", "accept-ranges", "content-length"]) {
      const value = upstream.headers.get(name);
      if (value && !(name === "content-length" && upstream.headers.has("content-encoding"))) responseHeaders.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const code = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
    console.error("[stream relay]", target.origin, code, error instanceof Error ? error.message : "Unknown failure");
    const message = code === "ENOTFOUND" || code === "EAI_AGAIN"
      ? "The app server could not resolve the provider hostname. Check its DNS and network connection."
      : "Could not reach the provider or relay its stream";
    return new Response(message, { status: 502 });
  }
}
