export const VIEWER_TTL_MS = 45000;

type Presence = Map<string, Map<string, number>>;
const state = globalThis as typeof globalThis & { tvViewerPresence?: Presence };
const presence = state.tvViewerPresence ??= new Map();

export function updateViewers(channelId: string, sessionId?: string, active = false, now = Date.now()) {
  // Remove abandoned sessions even when no leave notification arrives.
  for (const [channel, sessions] of presence) {
    for (const [id, seen] of sessions) if (now - seen >= VIEWER_TTL_MS) sessions.delete(id);
    if (!sessions.size) presence.delete(channel);
  }
  if (sessionId) {
    if (active) {
      const sessions = presence.get(channelId) ?? new Map<string, number>();
      if (sessions.has(sessionId) || sessions.size < 10000) sessions.set(sessionId, now);
      presence.set(channelId, sessions);
    } else {
      presence.get(channelId)?.delete(sessionId);
    }
  }
  return presence.get(channelId)?.size ?? 0;
}
