// js/logic.js — 純函式，瀏覽器掛 window.HMJSLogic，node 直接 require
(function (root) {
  const L = {
    clamp(v, min, max) { return Math.min(max, Math.max(min, v)); },
    stepToward(px, py, tx, ty, speed) {
      const dx = tx - px, dy = ty - py;
      const dist = Math.hypot(dx, dy);
      if (dist <= speed) return { x: tx, y: ty, arrived: true, facingLeft: dx < 0 ? true : dx > 0 ? false : null };
      const r = speed / dist;
      return { x: px + dx * r, y: py + dy * r, arrived: false, facingLeft: dx < 0 };
    },
    nearbySite(px, py, sites, radius) {
      let best = null, bestD = Infinity;
      for (const s of sites) {
        const d = Math.hypot(s.x - px, s.y - py);
        if (d <= radius && d < bestD) { best = s; bestD = d; }
      }
      return best;
    },
    cameraOffset(px, py, viewW, viewH, mapW, mapH) {
      const maxOx = Math.max(0, mapW - viewW), maxOy = Math.max(0, mapH - viewH);
      return {
        ox: -L.clamp(px - viewW / 2, 0, maxOx) || 0,
        oy: -L.clamp(py - viewH / 2, 0, maxOy) || 0,
      };
    },
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = L;
  else root.HMJSLogic = L;
})(this);
