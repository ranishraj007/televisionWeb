import { getChannel } from "@/lib/channels";
import { updateViewers } from "@/lib/viewer-presence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (count: number) => Response.json({ count }, { headers: { "Cache-Control": "no-store" } });

export async function GET(request: Request) {
  const channelId = new URL(request.url).searchParams.get("channelId") || "";
  if (!getChannel(channelId)) return new Response("Unknown channel", { status: 404 });
  return reply(updateViewers(channelId));
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  // Next.js may expose the bind address in request.url; browsers use Host.
  const host = request.headers.get("host") || new URL(request.url).host;
  if (origin) {
    try {
      if (new URL(origin).host !== host) return new Response("Invalid origin", { status: 403 });
    } catch { return new Response("Invalid origin", { status: 403 }); }
  }
  if (Number(request.headers.get("content-length")) > 1024) return new Response("Request too large", { status: 413 });
  let body;
  try { body = await request.json(); } catch { return new Response("Invalid request", { status: 400 }); }
  if (!body || typeof body.channelId !== "string" || typeof body.sessionId !== "string" || !/^[a-f0-9-]{36}$/i.test(body.sessionId) || typeof body.active !== "boolean") {
    return new Response("Invalid presence", { status: 400 });
  }
  if (!getChannel(body.channelId)) return new Response("Unknown channel", { status: 404 });
  return reply(updateViewers(body.channelId, body.sessionId, body.active));
}
