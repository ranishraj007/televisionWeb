/** Prefer the provider URL; keep the relay for browser CORS/network failures. */
export function playbackSources(streamUrl: string, isDemo: boolean, securePage: boolean) {
  const url = new URL(streamUrl);
  // DishHome's published HTTP URLs redirect to this HTTPS endpoint.
  if (url.hostname === "ottlive.dishhome.com.np" && url.protocol === "http:") url.protocol = "https:";
  const relay = `/api/stream?url=${encodeURIComponent(streamUrl)}`;
  if (isDemo) return [url.href];
  return securePage && url.protocol === "http:" ? [relay] : [url.href, relay];
}

/** DishHome permits direct media requests but omits CORS on its AES keys. */
export function playbackRequestUrl(requestUrl: string) {
  const url = new URL(requestUrl, "http://localhost");
  return url.hostname === "ottlive.dishhome.com.np" && url.pathname.endsWith(".key")
    ? `/api/stream?url=${encodeURIComponent(url.href)}`
    : requestUrl;
}
