/**
 * Publish a platform event back to the JobNest event outbox.
 *
 * POST {JOBNEST_API_URL}/events/ingest/ with the shared X-Service-Key. This is
 * how SkillNest tells the ecosystem "a course was completed" so JobNest can
 * sync verified skills onto the candidate profile and re-score job matches.
 *
 * Best-effort and non-blocking for the caller: failures are logged, never
 * thrown, so a transient JobNest outage can't break certificate issuance.
 */
const JOBNEST_API_URL = (process.env.JOBNEST_API_URL || "").replace(/\/+$/, "");
const INGEST_KEY = process.env.PLATFORM_EVENT_INGEST_KEY || "";

export type PlatformEventInput = {
  event: string;
  payload?: Record<string, unknown>;
  actorUserId?: string | number | null;
  email?: string | null;
  idempotencyKey?: string;
};

export async function publishPlatformEvent(input: PlatformEventInput): Promise<boolean> {
  if (!JOBNEST_API_URL || !INGEST_KEY) {
    console.warn("[platformEvents] JOBNEST_API_URL / PLATFORM_EVENT_INGEST_KEY not set — skipping", input.event);
    return false;
  }

  const body = {
    event: input.event,
    source: "skillnest",
    actor_user_id: input.actorUserId ?? null,
    idempotency_key: input.idempotencyKey,
    payload: { ...(input.payload || {}), ...(input.email ? { email: input.email } : {}) },
  };

  try {
    const resp = await fetch(`${JOBNEST_API_URL}/events/ingest/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Service-Key": INGEST_KEY },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      console.error(`[platformEvents] ${input.event} ingest failed: ${resp.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[platformEvents] ${input.event} ingest error:`, err);
    return false;
  }
}
