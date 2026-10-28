/** Rewrite both playlist entries and URI attributes (keys, maps, renditions). */
export function rewriteManifest(manifest: string, baseUrl: string, relay: (url: string) => string) {
  const resolve = (uri: string) => {
    const url = new URL(uri, baseUrl);
    // Inline keys do not require a network request.
    if (url.protocol === "data:") return uri;
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported stream protocol");
    return relay(url.href);
  };
  return manifest.split(/\r?\n/).map(line => {
    if (!line.trim()) return line;
    if (!line.trimStart().startsWith("#")) return resolve(line.trim());
    return line.replace(/\bURI="([^"]*)"/g, (_, uri: string) => `URI="${resolve(uri)}"`);
  }).join("\n");
}
