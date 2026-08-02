// js/meta/explore.js — 探索引導模組：紙鶴引路＋雲霧開圖＋涼亭奉茶＋山靈信物/翰墨秘境
// 依 docs/meta-integration-spec.md：只經由 HMJSBus 掛鉤，localStorage 走 hmjs_ 前綴。
(function () {
  'use strict';

  // ── 常數 ──────────────────────────────────────────────
  const PAVILION = { x: 1180, y: 1180 };   // 涼亭座標
  const SECRET = { x: 2350, y: 1450 };     // 翰墨秘境座標
  const TEA_INTERVAL_MS = 30 * 60 * 1000;  // 連續遊玩 30 分鐘
  const RELIC_AWAY_MS = 120000;            // 真入山修行 2 分鐘
  const RELIC_GOAL = 5;                    // 集滿五旗開秘境

  // 雲霧鄰接表（back 某山 → 開其鄰接）
  const ADJ = {
    'cap-guowen': ['gsat-guowen', 'zizizhuji'],
    'gsat-guowen': ['tvet-guowen', 'wenxin-diaolong'],
    'tvet-guowen': ['xingyin-doushi'],
    'xingyin-doushi': ['wenhao-xiaozhuan'],
    'wenxin-diaolong': ['wenyan-jieyou-zhan'],
    'wenhao-xiaozhuan': ['reading-expedition'],
    'wenyan-jieyou-zhan': ['zizizhuji'],
    'zizizhuji': ['reading-expedition'],
    'yamen': ['gsat-guowen'],
  };

  let Bus, sites, siteById;

  // ── 樣式注入（class 前綴 hme-）────────────────────────
  function injectStyle() {
    const css = `
#landmarks .landmark { transition: filter 1.5s ease, opacity 1.5s ease; }
.landmark.hme-fog { filter: blur(6px) brightness(1.25); opacity: .55; }
.hme-crane { position: absolute; z-index: 9; transform: translate(-50%, -50%);
  transition: left 2.2s ease-in-out, top 2.2s ease-in-out, opacity 1s ease; }
.hme-crane-img { width: 70px; display: block; animation: hme-float 2.4s ease-in-out infinite; }
@keyframes hme-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.hme-bubble { position: absolute; bottom: 86px; left: 50%; transform: translateX(-50%);
  width: 220px; padding: 12px 14px; background: #f7f1e3; border: 1px solid #c9bfa5;
  border-radius: 8px; box-shadow: 0 6px 20px rgba(30,25,15,.3); cursor: pointer;
  font-size: 14px; line-height: 1.7; color: #4a463d; }
.hme-bubble::after { content: ""; position: absolute; bottom: -8px; left: 50%;
  transform: translateX(-50%); border: 8px solid transparent; border-bottom: none;
  border-top: 8px solid #f7f1e3; }
.hme-skip { display: block; text-align: right; margin-top: 6px; font-size: 12px;
  color: #8a5a2b; text-decoration: underline; cursor: pointer; }
img[src*="deco_flag"] { filter: hue-rotate(160deg); }
img[src*="icon_inkdrop"] { animation: hme-glow 1.8s ease-in-out infinite; }
@keyframes hme-glow {
  0%, 100% { filter: drop-shadow(0 0 6px rgba(212,175,55,.7)); }
  50% { filter: drop-shadow(0 0 18px rgba(255,220,90,.95)); } }
.hme-btn { display: inline-block; margin-top: 12px; padding: 8px 22px; border: none;
  font: inherit; background: #6b3226; color: #f7f1e3; border-radius: 6px;
  letter-spacing: 3px; cursor: pointer; }
.hme-tea-text, .hme-poem { color: #4a463d; line-height: 2; }
.hme-poem { text-align: center; font-size: 18px; letter-spacing: 2px; margin: 10px 0 16px; }
.hme-poem .hme-poem-title { color: #6b3226; font-size: 15px; letter-spacing: 6px; }
.hme-seal-wrap { text-align: center; }
.hme-seal-wrap canvas { width: min(280px, 80%); border: 1px solid #c9bfa5;
  border-radius: 6px; background: #f5efe2; }
`;
    const style = document.createElement('style');
    style.id = 'hme-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── 小工具 ────────────────────────────────────────────
  function playerPos() {
    try {
      const p = window.HMJSPlayer && window.HMJSPlayer.pos();
      if (p && typeof p.x === 'number') return p;
    } catch (e) { /* 靜默降級 */ }
    return { x: 1300, y: 800 };
  }
  function dist(x1, y1, x2, y2) { return Math.hypot(x1 - x2, y1 - y2); }

  // ══════════════════════════════════════════════════════
  // 一、書僮紙鶴引路（首訪教學）
  // ══════════════════════════════════════════════════════
  function initOnboarding() {
    if (Bus.load('hmjs_onboarded', false)) return;
    const world = document.getElementById('world');
    if (!world) return;

    const spawn = playerPos();
    // 離出生點最近的山（不含貢院）
    let nearest = null, best = Infinity;
    for (const s of sites) {
      if (s.isYamen) continue;
      const d = dist(spawn.x, spawn.y, s.x, s.y);
      if (d < best) { best = d; nearest = s; }
    }

    const wrap = document.createElement('div');
    wrap.className = 'hme-crane';
    wrap.style.left = (spawn.x + 90) + 'px';
    wrap.style.top = (spawn.y - 110) + 'px';

    const img = document.createElement('img');
    img.className = 'hme-crane-img';
    img.src = 'assets/img/mount_crane.png';
    img.alt = '';
    img.onerror = () => { img.remove(); }; // 圖缺不擋教學

    const bubble = document.createElement('div');
    bubble.className = 'hme-bubble';
    const textEl = document.createElement('span');
    const skip = document.createElement('span');
    skip.className = 'hme-skip';
    skip.textContent = '跳過';
    bubble.append(textEl, skip);
    wrap.append(img, bubble);
    world.appendChild(wrap);

    const steps = [
      { text: '歡迎來到翰墨江山！點一下山頭，小書生就會走過去' },
      { text: '走近山頭就能看到這座山的來歷，點「入山」開始修行',
        before() { if (nearest) { wrap.style.left = nearest.x + 'px'; wrap.style.top = (nearest.y - 180) + 'px'; } } },
      { text: '集滿印章可以升功名，右上「遊歷圖」看收藏' },
    ];

    let idx = -1, timer = null, done = false;
    function show(n) {
      if (done) return;
      if (n >= steps.length) { finish(); return; }
      idx = n;
      if (steps[n].before) steps[n].before();
      textEl.textContent = steps[n].text;
      clearTimeout(timer);
      timer = setTimeout(() => show(idx + 1), 6000); // 6 秒自動下一段
    }
    function finish() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      Bus.save('hmjs_onboarded', true);
      wrap.style.opacity = '0'; // 紙鶴淡出
      setTimeout(() => wrap.remove(), 1200);
    }
    bubble.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (ev.target === skip) { finish(); return; }
      show(idx + 1);
    });
    show(0);
  }

  // ══════════════════════════════════════════════════════
  // 二、雲霧開圖
  // ══════════════════════════════════════════════════════
  const fog = { revealed: null, origNames: {} };

  function initFog() {
    let list = Bus.load('hmjs_fog', null);
    if (!Array.isArray(list) || !list.length) list = ['cap-guowen', 'yamen']; // 初訪僅泰山＋貢院
    fog.revealed = new Set(list);

    // 回頭客：已 visited 的山連同其鄰接直接全開
    const visited = Bus.load('hmjs_visited', []) || [];
    for (const id of visited) {
      fog.revealed.add(id);
      for (const n of (ADJ[id] || [])) fog.revealed.add(n);
    }
    saveFog();

    // 套霧：名牌暫存原字改「？」
    document.querySelectorAll('#landmarks .landmark').forEach((el) => {
      const id = el.dataset.id;
      if (!id || fog.revealed.has(id)) return;
      el.classList.add('hme-fog');
      const name = el.querySelector('.lm-name');
      if (name) { fog.origNames[id] = name.textContent; name.textContent = '？'; }
    });

    // back 某山 → 開其鄰接
    Bus.on('back', (e) => {
      const id = e && e.site && e.site.id;
      if (!id) return;
      revealFog(id, false);
      for (const n of (ADJ[id] || [])) revealFog(n, true);
    });

    // 霧中山仍可走近，距 <140 自動散霧（避免卡死）
    Bus.on('tick', (e) => {
      if (!e || fog.revealed.size >= sites.length) return;
      for (const s of sites) {
        if (fog.revealed.has(s.id)) continue;
        if (dist(e.x, e.y, s.x, s.y) < 140) revealFog(s.id, true);
      }
    });
  }
  function saveFog() { Bus.save('hmjs_fog', Array.from(fog.revealed)); }
  function revealFog(id, withToast) {
    if (fog.revealed.has(id)) return;
    fog.revealed.add(id);
    saveFog();
    const el = document.querySelector('#landmarks .landmark[data-id="' + id + '"]');
    if (el) {
      el.classList.remove('hme-fog'); // 霧散 transition 1.5s（.landmark 已掛 transition）
      const name = el.querySelector('.lm-name');
      if (name && fog.origNames[id]) name.textContent = fog.origNames[id];
    }
    const s = siteById[id];
    if (withToast && s) Bus.toast('雲開見' + s.mountain);
  }

  // ══════════════════════════════════════════════════════
  // 三、涼亭奉茶（護眼）
  // ══════════════════════════════════════════════════════
  const tea = { last: Date.now(), pending: false, open: false };

  function initTea() {
    Bus.addDecor('hme-pavilion', 'assets/img/deco_pavilion.png', PAVILION.x, PAVILION.y,
      { w: 170, onClick: openTeaPanel }); // 手動點涼亭也可喝茶

    setInterval(() => {
      if (tea.pending || tea.open) return;
      if (Date.now() - tea.last >= TEA_INTERVAL_MS) {
        tea.pending = true;
        Bus.toast('山中茶涼了，小書生想歇歇腳');
        try { window.HMJSPlayer && window.HMJSPlayer.walkTo(PAVILION.x, PAVILION.y); } catch (e) { /* 不強制 */ }
      }
    }, 30000);

    Bus.on('tick', (e) => {
      if (!tea.pending || tea.open || !e) return;
      if (dist(e.x, e.y, PAVILION.x, PAVILION.y) < 120) openTeaPanel();
    });
  }

  function openTeaPanel() {
    if (tea.open) return;
    tea.open = true;

    // 累計喝茶次數＋茶博士里程（10 次一次性）
    const total = (Bus.load('hmjs_tea_total', 0) || 0) + 1;
    Bus.save('hmjs_tea_total', total);
    if (total === 10) {
      Bus.toast('喝滿十盞，榮膺「茶博士」！文氣＋30');
      Bus.qi(30, '茶博士');
    }

    const p = Bus.panel('涼亭奉茶',
      '<p class="hme-tea-text">喝口茶，望遠三分鐘再回來——眼睛是讀書人的硯台。</p>' +
      '<button type="button" class="hme-btn" data-hme="rest">再戰</button>');
    const btn = p.body.querySelector('[data-hme="rest"]');
    if (btn) btn.addEventListener('click', () => { p.close(); });

    // 重置計時（不強制鎖操作）
    tea.last = Date.now();
    tea.pending = false;
    setTimeout(() => { tea.open = false; }, 800); // 防連點重複開
  }

  // ══════════════════════════════════════════════════════
  // 四、山靈信物＋翰墨秘境
  // ══════════════════════════════════════════════════════
  const relic = { list: [], secretDecor: false, secretNear: false };

  function initRelics() {
    relic.list = Bus.load('hmjs_relics', []) || [];

    // 還原已有旗
    for (const id of relic.list) addFlag(id);
    if (relic.list.length >= RELIC_GOAL) placeSecret(false);

    Bus.on('back', (e) => {
      if (!e || !e.site || !e.site.id) return;
      if ((e.awayMs || 0) < RELIC_AWAY_MS) return; // 真的去修行 2 分鐘以上
      const id = e.site.id;
      if (relic.list.indexOf(id) !== -1) return;
      relic.list.push(id);
      Bus.save('hmjs_relics', relic.list);
      addFlag(id);
      const s = siteById[id];
      Bus.toast((s ? s.mountain : '') + '山靈贈你信物');
      Bus.qi(20, '信物-' + id);
      if (relic.list.length >= RELIC_GOAL) placeSecret(true);
    });

    // 走近秘境墨圈開卡
    Bus.on('tick', (e) => {
      if (!relic.secretDecor || !e) return;
      const d = dist(e.x, e.y, SECRET.x, SECRET.y);
      if (d < 110 && !relic.secretNear) { relic.secretNear = true; openSecretPanel(); }
      else if (d > 200) relic.secretNear = false;
    });
  }

  function addFlag(id) {
    const s = siteById[id];
    if (!s) return;
    // 信物旗：山座標偏移 (+70,-30)，CSS 對 deco_flag 套 hue-rotate(160deg) 顯示為青旗
    Bus.addDecor('hme-flag-' + id, 'assets/img/deco_flag.png', s.x + 70, s.y - 30, { w: 50 });
  }

  function placeSecret(justUnlocked) {
    if (relic.secretDecor) return;
    relic.secretDecor = true;
    Bus.addDecor('hme-secret', 'assets/img/icon_inkdrop.png', SECRET.x, SECRET.y,
      { w: 60, onClick: openSecretPanel }); // 金光動畫由 CSS 掛在 icon_inkdrop
    if (justUnlocked) Bus.toast('五旗聚齊，翰墨秘境現世！');
  }

  function openSecretPanel() {
    const first = !Bus.load('hmjs_secret', false);
    if (first) { Bus.save('hmjs_secret', true); Bus.qi(100, '翰墨秘境'); }

    const p = Bus.panel('翰墨秘境',
      '<div class="hme-poem">' +
        '<div class="hme-poem-title">七絕・翰墨江山</div>' +
        '<p>筆走千峰墨未乾，雲開霧散見重巒。</p>' +
        '<p>書生踏盡江山路，始信文章天地寬。</p>' +
      '</div>' +
      '<div class="hme-seal-wrap">' +
        '<canvas width="800" height="800" data-hme="seal"></canvas><br>' +
        '<button type="button" class="hme-btn" data-hme="dl">下載秘境大印</button>' +
      '</div>');

    const cv = p.body.querySelector('[data-hme="seal"]');
    if (cv) drawSecretSeal(cv);
    const btn = p.body.querySelector('[data-hme="dl"]');
    if (btn && cv) btn.addEventListener('click', () => {
      try {
        const a = document.createElement('a');
        a.download = 'hanmo-mijing-seal.png';
        a.href = cv.toDataURL('image/png');
        a.click();
      } catch (e) { Bus.toast('下載失敗，請改用截圖保存'); }
    });
  }

  // 800×800 宣紙底＋大紅方印「翰墨秘境」＋日期
  function drawSecretSeal(cv) {
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    // 宣紙底
    ctx.fillStyle = '#f5efe2';
    ctx.fillRect(0, 0, 800, 800);
    ctx.strokeStyle = 'rgba(190,178,148,.18)'; // 紙纖維
    ctx.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * 800, y = Math.random() * 800;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 90, y + (Math.random() - 0.5) * 24);
      ctx.stroke();
    }
    // 大紅方印
    ctx.fillStyle = '#a03a26';
    ctx.fillRect(160, 140, 480, 480);
    ctx.strokeStyle = '#f5efe2';
    ctx.lineWidth = 6;
    ctx.strokeRect(184, 164, 432, 432);
    // 印文（傳統印面：右行先讀，右上翰、右下墨、左上秘、左下境）
    ctx.fillStyle = '#f7f1e3';
    ctx.font = 'bold 150px "Noto Serif TC", "PingFang TC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('翰', 508, 268);
    ctx.fillText('墨', 508, 496);
    ctx.fillText('秘', 292, 268);
    ctx.fillText('境', 292, 496);
    // 日期落款
    ctx.fillStyle = '#6b3226';
    ctx.font = '30px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillText('翰墨江山　' + Bus.today(), 400, 706);
  }

  // ── 初始化 ────────────────────────────────────────────
  window.addEventListener('hmjs:ready', () => {
    Bus = window.HMJSBus;
    sites = window.HMJS_SITES || [];
    if (!Bus || !sites.length) return; // 匯流排缺席 → 靜默降級
    siteById = {};
    for (const s of sites) siteById[s.id] = s;

    injectStyle();
    try { initFog(); } catch (e) { /* 各子系統獨立降級 */ }
    try { initOnboarding(); } catch (e) { /* */ }
    try { initTea(); } catch (e) { /* */ }
    try { initRelics(); } catch (e) { /* */ }
  });
})();
