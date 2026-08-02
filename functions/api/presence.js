import {
  getTaipeiDayKey,
  isAllowedOrigin,
  isValidSessionId,
  readPresenceStats,
} from "./_presence-core.js";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

function responseHeaders(request) {
  const origin = isAllowedOrigin(request.headers.get("Origin"));
  return {
    ...JSON_HEADERS,
    ...(origin
      ? {
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Origin": origin,
          Vary: "Origin",
        }
      : {}),
  };
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(request),
  });
}

export function onRequestOptions({ request }) {
  if (
    request.headers.get("Origin") &&
    !isAllowedOrigin(request.headers.get("Origin"))
  ) {
    return json(request, { ok: false, error: "origin_not_allowed" }, 403);
  }

  return new Response(null, {
    status: 204,
    headers: responseHeaders(request),
  });
}

export async function onRequestGet({ request, env }) {
  if (!env?.PRESENCE_DB) {
    return json(request, { ok: false, error: "database_unavailable" }, 503);
  }

  const now = Date.now();
  const stats = await readPresenceStats(
    env.PRESENCE_DB,
    getTaipeiDayKey(now),
    now,
  );
  return json(request, { ok: true, ...stats });
}

export async function onRequestPost({ request, env }) {
  const requestOrigin = request.headers.get("Origin");
  if (requestOrigin && !isAllowedOrigin(requestOrigin)) {
    return json(request, { ok: false, error: "origin_not_allowed" }, 403);
  }

  if (!env?.PRESENCE_DB) {
    return json(request, { ok: false, error: "database_unavailable" }, 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(request, { ok: false, error: "invalid_json" }, 400);
  }

  const sessionId = payload?.sessionId;
  if (!isValidSessionId(sessionId)) {
    return json(request, { ok: false, error: "invalid_session" }, 400);
  }

  const now = Date.now();
  const dayKey = getTaipeiDayKey(now);
  await env.PRESENCE_DB.prepare(
    `INSERT OR IGNORE INTO hmjs_sessions (session_id, first_seen, last_seen, day_key)
     VALUES (?1, ?2, ?2, ?3)
     RETURNING session_id`,
  )
    .bind(sessionId, now, dayKey)
    .all();

  await env.PRESENCE_DB.prepare(
    `UPDATE hmjs_sessions
     SET last_seen = ?2
     WHERE session_id = ?1 AND last_seen < ?2 - 60000`,
  )
    .bind(sessionId, now)
    .run();

  const stats = await readPresenceStats(env.PRESENCE_DB, dayKey, now);
  return json(request, { ok: true, ...stats });
}
