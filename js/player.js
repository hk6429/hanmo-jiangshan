// js/player.js — 鍵盤/WASD＋點擊移動、行走動畫、requestAnimationFrame 主迴圈
(function () {
  const SPEED = 4.2;            // px/frame（60fps 約 250px/s）
  const BOUNDS = { minX: 80, maxX: 2520, minY: 120, maxY: 1520 };
  const keys = new Set();
  let x = 0, y = 0, target = null, moveCb = null;
  let walkFrame = 0, lastSwap = 0, moving = false;

  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };

  function setSprite(now) {
    const img = document.getElementById('player-img');
    const sp = window.HMJS_SPRITES || { idle: 'assets/img/player_idle.png',
      walk1: 'assets/img/player_walk1.png', walk2: 'assets/img/player_walk2.png' };
    if (!moving) { img.src = sp.idle; return; }
    if (now - lastSwap > 160) { walkFrame = 1 - walkFrame; lastSwap = now; }
    img.src = walkFrame ? sp.walk2 : sp.walk1;
  }

  function tick(now) {
    const SPEED_NOW = SPEED * (window.HMJS_SPEED_MULT || 1);
    let dx = 0, dy = 0;
    if (keys.size) {
      target = null; // 鍵盤優先，取消點擊目標
      if (keys.has('up')) dy -= 1; if (keys.has('down')) dy += 1;
      if (keys.has('left')) dx -= 1; if (keys.has('right')) dx += 1;
      if (dx || dy) {
        const n = Math.hypot(dx, dy);
        x += (dx / n) * SPEED_NOW; y += (dy / n) * SPEED_NOW;
        if (dx) document.getElementById('player').classList.toggle('face-left', dx < 0);
      }
      moving = !!(dx || dy);
    } else if (target) {
      const s = HMJSLogic.stepToward(x, y, target.x, target.y, SPEED_NOW);
      x = s.x; y = s.y; moving = !s.arrived;
      if (s.facingLeft !== null)
        document.getElementById('player').classList.toggle('face-left', s.facingLeft);
      if (s.arrived) target = null;
    } else moving = false;

    x = HMJSLogic.clamp(x, BOUNDS.minX, BOUNDS.maxX);
    y = HMJSLogic.clamp(y, BOUNDS.minY, BOUNDS.maxY);
    const p = document.getElementById('player');
    p.style.left = x + 'px'; p.style.top = y + 'px';
    setSprite(now);
    HMJSMap.applyCamera(x, y);
    if (moveCb) moveCb(x, y);
    window.HMJSBus?.emit?.('tick', { x, y });
    requestAnimationFrame(tick);
  }

  window.HMJSPlayer = {
    init(sx, sy) {
      x = sx; y = sy;
      // 換袍 sprite 缺圖 → 退回預設書生裝，不讓主角變破圖
      const pimg = document.getElementById('player-img');
      pimg.onerror = () => {
        if (window.HMJS_SPRITES) { window.HMJS_SPRITES = null; pimg.src = 'assets/img/player_idle.png'; }
        else pimg.onerror = null;
      };
      addEventListener('keydown', (e) => {
        const k = KEYMAP[e.code];
        if (k) { keys.add(k); e.preventDefault(); }
      });
      addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) keys.delete(k); });
      // 點哪走哪（點在地圖空白處；地標/卡片各自 stopPropagation）
      document.getElementById('viewport').addEventListener('pointerdown', (e) => {
        if (e.target.closest('#hud, #site-card, .overlay, #atlas-btn')) return;
        const w = document.getElementById('world').getBoundingClientRect();
        window.HMJSPlayer.walkTo(e.clientX - w.left, e.clientY - w.top);
      });
      requestAnimationFrame(tick);
    },
    pos() { return { x, y }; },
    onMove(fn) { moveCb = fn; },
    walkTo(tx, ty) {
      target = {
        x: HMJSLogic.clamp(tx, BOUNDS.minX, BOUNDS.maxX),
        y: HMJSLogic.clamp(ty, BOUNDS.minY, BOUNDS.maxY),
      };
    },
  };
})();
