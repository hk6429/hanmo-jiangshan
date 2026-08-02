export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

const productionHosts = new Set([
  "hanmo-jiangshan.pages.dev",
  "hanmo-jiangshan.vercel.app",
  "hanmo-jiangshan.netlify.app",
]);

export function getTaipeiDayKey(timestamp) {
  return new Date(timestamp + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function isValidSessionId(value) {
  return (
    typeof value === "string" &&
    value.length >= 16 &&
    value.length <= 64 &&
    /^[A-Za-z0-9_-]+$/.test(value)
  );
}

export function isAllowedOrigin(origin) {
  if (!origin) return null;

  try {
    const url = new URL(origin);
    const isProduction =
      url.protocol === "https:" && productionHosts.has(url.hostname);
    const isPreview =
      url.protocol === "https:" &&
      url.hostname.endsWith(".hanmo-jiangshan.pages.dev");
    const isLocal =
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");

    if (isProduction || isPreview || isLocal) return url.origin;
  } catch {
    return null;
  }

  return null;
}

export function toSafeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0;
}

export async function readPresenceStats(db, dayKey, now) {
  const [totalResult, todayResult, onlineResult] = await db.batch([
    db.prepare("SELECT total_visits AS total FROM hmjs_site_stats WHERE id = 1"),
    db
      .prepare("SELECT visits AS today FROM hmjs_daily_stats WHERE day_key = ?1")
      .bind(dayKey),
    db
      .prepare("SELECT COUNT(*) AS online FROM hmjs_sessions WHERE last_seen >= ?1")
      .bind(now - ONLINE_WINDOW_MS),
  ]);

  return {
    online: toSafeCount(onlineResult.results?.[0]?.online),
    today: toSafeCount(todayResult.results?.[0]?.today),
    total: toSafeCount(totalResult.results?.[0]?.total),
    dayKey,
    onlineWindowMinutes: ONLINE_WINDOW_MS / 60_000,
  };
}
