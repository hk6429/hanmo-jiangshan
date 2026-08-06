// js/meta/core.js — 翰墨江山遊戲化核心：事件匯流排＋文氣＋功名＋印階＋成就＋總覽分頁
// 純靜態、無後端；localStorage 全走 hmjs_ 前綴，失效時靜默降級為「可玩但不記錄」。
(function () {
  'use strict';

  /* ============ 樣式注入（class 前綴 hmc-） ============ */
  var CSS = [
    '.hmc-gourd{display:inline-flex;align-items:center;gap:6px;margin-left:14px;',
    '  padding:3px 12px 3px 6px;background:rgba(247,241,227,.9);border:1.5px solid #6b3226;',
    '  border-radius:999px;color:#6b3226;font-family:"Noto Serif TC","PingFang TC",serif;',
    '  font-size:16px;font-weight:700;cursor:default;user-select:none;}',
    '.hmc-gourd img{width:22px;height:22px;object-fit:contain;}',
    '.hmc-gourd .hmc-gourd-mult{font-size:12px;color:#a03a26;font-weight:400;}',
    '.hmc-rank{display:inline-block;margin-left:8px;padding:3px 12px;',
    '  background:rgba(247,241,227,.9);border:1.5px solid #6b3226;border-radius:999px;',
    '  color:#2e2a24;font-size:15px;letter-spacing:2px;}',
    '.hmc-toast-box{position:fixed;right:20px;bottom:20px;z-index:90;display:flex;',
    '  flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none;}',
    '.hmc-toast{max-width:min(320px,80vw);padding:10px 18px;background:#f7f1e3;',
    '  border:1px solid #c9bfa5;border-left:4px solid #a03a26;border-radius:6px;',
    '  color:#2e2a24;font-family:"Noto Serif TC","PingFang TC",serif;font-size:15px;',
    '  line-height:1.6;box-shadow:0 6px 20px rgba(30,25,15,.3);',
    '  opacity:0;transform:translateY(8px);transition:opacity .35s,transform .35s;}',
    '.hmc-toast.hmc-show{opacity:1;transform:translateY(0);}',
    '.hmc-overlay{position:fixed;inset:0;z-index:60;background:rgba(30,25,15,.55);',
    '  display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;}',
    '.hmc-panel{position:relative;background:#f7f1e3;border:1px solid #c9bfa5;',
    '  border-radius:10px;padding:24px;max-width:860px;width:100%;max-height:90vh;',
    '  overflow-y:auto;color:#2e2a24;font-family:"Noto Serif TC","PingFang TC",serif;}',
    '.hmc-panel h2{color:#2e2a24;font-size:22px;letter-spacing:3px;margin-bottom:12px;}',
    '.hmc-panel-close{position:absolute;top:10px;right:12px;width:34px;height:34px;',
    '  border:1.5px solid #6b3226;background:rgba(247,241,227,.9);color:#6b3226;',
    '  border-radius:6px;font-size:16px;line-height:1;cursor:pointer;}',
    '.hmc-decor{position:absolute;transform:translate(-50%,-85%);text-align:center;}',
    '.hmc-decor img{pointer-events:none;display:block;margin:0 auto;}',
    '.landmark.hmc-seal-silver::after{filter:saturate(.2) brightness(1.4);}',
    '.landmark.hmc-seal-gold::after{filter:sepia(1) saturate(3) hue-rotate(-15deg);}',
    '.hmc-edict{position:fixed;inset:0;z-index:100;display:flex;align-items:center;',
    '  justify-content:center;background:radial-gradient(ellipse at center,',
    '  rgba(212,175,55,.35),rgba(30,25,15,.75));opacity:0;transition:opacity 2s;}',
    '.hmc-edict.hmc-show{opacity:1;}',
    '.hmc-edict-scroll{position:relative;width:min(560px,88vw);aspect-ratio:4/3;',
    '  background:url(assets/img/icon_edict.png) center/contain no-repeat;',
    '  display:flex;align-items:center;justify-content:center;',
    '  filter:drop-shadow(0 0 40px rgba(212,175,55,.85));}',
    '.hmc-edict-text{color:#6b3226;font-family:"Noto Serif TC","PingFang TC",serif;',
    '  font-size:clamp(20px,4.2vw,34px);font-weight:700;letter-spacing:6px;',
    '  text-shadow:0 0 12px rgba(212,175,55,.9);white-space:nowrap;}',
    '.hmc-overview{line-height:2;font-size:15px;}',
    '.hmc-overview .hmc-ov-row{display:flex;flex-wrap:wrap;gap:10px 24px;margin-bottom:10px;}',
    '.hmc-overview .hmc-ov-item{background:#fffdf6;border:1px solid #d9cfae;border-radius:8px;',
    '  padding:8px 16px;}',
    '.hmc-overview .hmc-ov-item b{color:#6b3226;}',
    '.hmc-badge-list{list-style:none;margin-top:6px;}',
    '.hmc-badge-list li{padding:4px 0;border-bottom:1px dashed #d9cfae;}',
    '.hmc-badge-done{color:#a03a26;font-weight:700;margin-right:6px;}',
    '.hmc-badge-todo{color:#8a9088;margin-right:6px;}',
    '.hmc-badge-need{font-size:13px;color:#4a463d;}'
  ].join('\n');
  function injectStyle() {
    if (document.getElementById('hmc-style')) return;
    var st = document.createElement('style');
    st.id = 'hmc-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', injectStyle);
  else injectStyle();

  /* ============ 基礎工具 ============ */
  var listeners = {};
  function on(evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
  }
  function emit(evt, payload) {
    var fns = listeners[evt];
    if (!fns) return;
    for (var i = 0; i < fns.length; i++) {
      try { fns[i](payload); } catch (e) { /* 靜默：單一掛鉤失敗不拖垮全站 */ }
    }
  }
  function seed(str) {
    // FNV-1a 32-bit 字串雜湊 → uint32
    var h = 2166136261;
    str = String(str);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function today() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      var val = JSON.parse(raw);
      return val === null || val === undefined ? fallback : val;
    } catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 靜默 */ }
  }
  function esc(t) {
    var d = document.createElement('div');
    d.textContent = String(t);
    return d.innerHTML;
  }
  function yesterdayOf(dateStr) {
    var d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  /* ============ 文氣（hmjs_qi）＋連簽倍率 ============ */
  var STREAK_TIERS = [
    { days: 14, mult: 3 },
    { days: 7, mult: 2 },
    { days: 3, mult: 1.5 },
    { days: 0, mult: 1 }
  ];
  function tierIndexOf(days) {
    for (var i = 0; i < STREAK_TIERS.length; i++)
      if (days >= STREAK_TIERS[i].days) return i;
    return STREAK_TIERS.length - 1;
  }
  function multOf(days) { return STREAK_TIERS[tierIndexOf(days)].mult; }

  function touchStreak() {
    // 有入帳的日子才呼叫；斷簽只退一級倍率，絕不歸零
    var t = today();
    var s = load('hmjs_qi_streak', { days: 0, lastDate: '' });
    if (s.lastDate === t) return s;
    if (s.lastDate === yesterdayOf(t)) {
      s.days += 1;
    } else if (s.lastDate) {
      var idx = tierIndexOf(s.days);
      var lower = Math.min(idx + 1, STREAK_TIERS.length - 1); // 退一級
      s.days = STREAK_TIERS[lower].days + 1; // 含今日這一天
    } else {
      s.days = 1;
    }
    s.lastDate = t;
    save('hmjs_qi_streak', s);
    return s;
  }

  function getQi() { return load('hmjs_qi', 0); }
  function qi(delta, reason) {
    var total = getQi();
    if (delta > 0) {
      var s = touchStreak();
      delta = Math.round(delta * multOf(s.days));
    }
    total += delta;
    if (total < 0) total = 0;
    save('hmjs_qi', total);
    emit('qi', { total: total });
    updateHud();
    return total;
  }

  // card / back 每站每日首次入帳（hmjs_qi_log = {日期:{事由:true}}）
  function dailyOnce(key, fn) {
    var t = today();
    var log = load('hmjs_qi_log', {});
    // 只留今日，防止無限長大
    if (!log[t]) log = {}, log[t] = {};
    if (log[t][key]) return;
    log[t][key] = true;
    save('hmjs_qi_log', log);
    fn();
  }

  /* ============ 功名（只看印章數，絕不計點擊） ============ */
  var RANKS = [
    { need: 1, name: '童生' },
    { need: 3, name: '秀才' },
    { need: 5, name: '舉人' },
    { need: 8, name: '貢士' },
    { need: 10, name: '狀元' }
  ];
  function visitedIds() {
    try {
      if (window.HMJSStamps && typeof window.HMJSStamps.visited === 'function')
        return window.HMJSStamps.visited();
    } catch (e) { /* 靜默 */ }
    return load('hmjs_visited', []);
  }
  function rankOf(sealCount) {
    var lv = -1; // -1 = 白身
    for (var i = 0; i < RANKS.length; i++)
      if (sealCount >= RANKS[i].need) lv = i;
    return lv;
  }
  function rankName(lv) { return lv < 0 ? '白身' : RANKS[lv].name; }

  function applySprites(lv) {
    // 舉人（>=2）換烏紗帽官服組；狀元（==4）換紅袍組；否則回白身。
    // 只負責算「袍色層」，最終 sprite 由 shop.js 的 HMJS_RESOLVE_SPRITES
    // 合成（袍色×展示中配飾）；shop 未載入時退回原行為。
    if (lv === 4) {
      window.HMJS_RANK_TIER = 'rank5';
      window.HMJS_RANK_SPRITES = {
        idle: 'assets/img/player_rank5_idle.png',
        walk1: 'assets/img/player_rank5_walk1.png',
        walk2: 'assets/img/player_rank5_walk2.png'
      };
    } else if (lv >= 2) {
      window.HMJS_RANK_TIER = 'rank3';
      window.HMJS_RANK_SPRITES = {
        idle: 'assets/img/player_rank3_idle.png',
        walk1: 'assets/img/player_rank3_walk1.png',
        walk2: 'assets/img/player_rank3_walk2.png'
      };
    } else {
      window.HMJS_RANK_TIER = 'base';
      window.HMJS_RANK_SPRITES = null;
    }
    if (typeof window.HMJS_RESOLVE_SPRITES === 'function') {
      window.HMJS_RESOLVE_SPRITES();
    } else if (window.HMJS_RANK_SPRITES) {
      window.HMJS_SPRITES = window.HMJS_RANK_SPRITES;
    } else {
      try { delete window.HMJS_SPRITES; } catch (e) { window.HMJS_SPRITES = undefined; }
    }
  }

  function showEdict(name) {
    var wrap = document.createElement('div');
    wrap.className = 'hmc-edict';
    wrap.innerHTML = '<div class="hmc-edict-scroll">' +
      '<div class="hmc-edict-text">奉天承運：晉升' + esc(name) + '</div></div>';
    document.body.appendChild(wrap);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { wrap.classList.add('hmc-show'); });
    });
    setTimeout(function () {
      wrap.classList.remove('hmc-show');
      setTimeout(function () { wrap.remove(); }, 2000);
    }, 2600);
    wrap.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
      wrap.remove();
    });
  }

  function checkRank(silent) {
    var lv = rankOf(visitedIds().length);
    var prev = load('hmjs_rank', -1);
    if (lv > prev) {
      save('hmjs_rank', lv);
      applySprites(lv);
      updateHud();
      if (!silent) {
        showEdict(rankName(lv));
        emit('rank', { level: lv, name: rankName(lv) });
      }
    }
    return lv;
  }

  /* ============ 印章三階（hmjs_visit_counts） ============ */
  function sealTier(siteId) {
    var counts = load('hmjs_visit_counts', {});
    var n = counts[siteId] || 0;
    if (n >= 10) return 2;
    if (n >= 3) return 1;
    return 0;
  }
  function applySealClass(siteId) {
    var el = document.querySelector('.landmark[data-id="' + siteId + '"]');
    if (!el) return;
    var tier = sealTier(siteId);
    el.classList.toggle('hmc-seal-silver', tier === 1);
    el.classList.toggle('hmc-seal-gold', tier === 2);
  }
  function applyAllSealClasses() {
    var counts = load('hmjs_visit_counts', {});
    for (var id in counts) applySealClass(id);
  }

  /* ============ 成就組（帖） ============ */
  var BADGES = [
    { name: '三試及第', need: ['cap-guowen', 'gsat-guowen', 'tvet-guowen'] },
    { name: '五嶽真形', need: ['cap-guowen', 'gsat-guowen', 'tvet-guowen', 'xingyin-doushi', 'wenxin-diaolong'] },
    { name: '三山風雅', need: ['wenhao-xiaozhuan', 'wenyan-jieyou-zhan', 'zizizhuji'] },
    { name: '鬥字雙俠', need: ['xingyin-doushi', 'zizizhuji'] }
  ];
  function badges() {
    var v = visitedIds();
    return BADGES.map(function (b) {
      return {
        name: b.name,
        done: b.need.every(function (id) { return v.indexOf(id) !== -1; }),
        need: b.need.slice()
      };
    });
  }
  function checkBadges() {
    var got = load('hmjs_badges', {});
    var list = badges();
    var changed = false;
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (b.done && !got[b.name]) {
        got[b.name] = true;
        changed = true;
        toast('成就達成——「' + b.name + '」帖集滿！文氣 +30');
        qi(30, 'badge:' + b.name);
      }
    }
    if (changed) save('hmjs_badges', got);
  }

  /* ============ HUD（墨葫蘆計量＋功名） ============ */
  var hudGourd = null, hudRank = null;
  function buildHud() {
    var hud = document.getElementById('hud');
    var h1 = hud && hud.querySelector('h1');
    if (!h1 || hudGourd) return;
    hudGourd = document.createElement('span');
    hudGourd.className = 'hmc-gourd';
    hudGourd.innerHTML = '<img src="assets/img/icon_gourd.png" alt="文氣">' +
      '<b class="hmc-gourd-num">0</b><span class="hmc-gourd-mult"></span>';
    hudRank = document.createElement('span');
    hudRank.className = 'hmc-rank';
    h1.insertAdjacentElement('afterend', hudRank);
    h1.insertAdjacentElement('afterend', hudGourd);
    updateHud();
  }
  function updateHud() {
    if (!hudGourd) return;
    var s = load('hmjs_qi_streak', { days: 0, lastDate: '' });
    var m = multOf(s.days);
    hudGourd.querySelector('.hmc-gourd-num').textContent = getQi();
    hudGourd.querySelector('.hmc-gourd-mult').textContent = m > 1 ? '×' + m : '';
    hudGourd.title = '文氣 ' + getQi() + '｜連續 ' + s.days + ' 日｜倍率 ×' + m +
      '（斷簽只退一級，絕不歸零）';
    var lv = rankOf(visitedIds().length);
    hudRank.textContent = rankName(lv);
    hudRank.title = '功名依印章數晉升：1／3／5／8／10 顆 → 童生／秀才／舉人／貢士／狀元';
  }

  /* ============ toast（右下宣紙小提示，可疊列） ============ */
  var toastBox = null;
  function toast(msg) {
    if (!document.body) return;
    if (!toastBox || !toastBox.isConnected) {
      toastBox = document.createElement('div');
      toastBox.className = 'hmc-toast-box';
      document.body.appendChild(toastBox);
    }
    var t = document.createElement('div');
    t.className = 'hmc-toast';
    t.textContent = String(msg);
    toastBox.appendChild(t);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { t.classList.add('hmc-show'); });
    });
    setTimeout(function () {
      t.classList.remove('hmc-show');
      setTimeout(function () { t.remove(); }, 400);
    }, 2500);
  }

  /* ============ panel（宣紙 overlay 面板） ============ */
  function panel(title, html) {
    var overlay = document.createElement('div');
    overlay.className = 'hmc-overlay';
    var box = document.createElement('div');
    box.className = 'hmc-panel';
    box.innerHTML = '<button class="hmc-panel-close" type="button" aria-label="關閉">✕</button>' +
      '<h2>' + esc(title) + '</h2><div class="hmc-panel-body"></div>';
    var body = box.querySelector('.hmc-panel-body');
    if (html !== undefined && html !== null) body.innerHTML = html;
    overlay.appendChild(box);
    function close() { overlay.remove(); }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    box.querySelector('.hmc-panel-close').addEventListener('click', close);
    overlay.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    document.body.appendChild(overlay);
    return { el: overlay, body: body, close: close };
  }

  /* ============ addDecor（地圖裝飾） ============ */
  function addDecor(id, imgSrc, x, y, opts) {
    opts = opts || {};
    var host = document.getElementById('landmarks');
    if (!host) return null;
    var old = document.getElementById(id);
    if (old) old.remove();
    var el = document.createElement('div');
    el.className = 'hmc-decor';
    el.id = id;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    var img = document.createElement('img');
    img.src = imgSrc;
    img.alt = '';
    img.style.width = (opts.w || 120) + 'px';
    el.appendChild(img);
    if (typeof opts.onClick === 'function') {
      el.style.cursor = 'pointer';
      el.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        opts.onClick(e);
      });
    }
    host.appendChild(el);
    return el;
  }

  /* ============ 遊歷圖分頁註冊表 ============ */
  var tabs = [];
  function registerTab(label, renderFn) {
    tabs.push({ label: label, render: renderFn });
  }

  /* ============ 對外 API ============ */
  window.HMJSBus = {
    on: on,
    emit: emit,
    seed: seed,
    today: today,
    load: load,
    save: save,
    qi: qi,
    getQi: getQi,
    toast: toast,
    panel: panel,
    addDecor: addDecor,
    sealTier: sealTier,
    badges: badges,
    registerTab: registerTab,
    tabs: tabs
  };

  /* ============ 總覽分頁 ============ */
  registerTab('總覽', function (container) {
    var s = load('hmjs_qi_streak', { days: 0, lastDate: '' });
    var lv = rankOf(visitedIds().length);
    var rows = badges().map(function (b) {
      var mark = b.done
        ? '<span class="hmc-badge-done">✔</span>'
        : '<span class="hmc-badge-todo">○</span>';
      return '<li>' + mark + esc(b.name) +
        ' <span class="hmc-badge-need">（' + b.need.map(esc).join('、') + '）</span></li>';
    }).join('');
    container.innerHTML = '<div class="hmc-overview">' +
      '<div class="hmc-ov-row">' +
      '<span class="hmc-ov-item">文氣：<b>' + getQi() + '</b></span>' +
      '<span class="hmc-ov-item">功名：<b>' + esc(rankName(lv)) + '</b>' +
      '（印章 ' + visitedIds().length + ' 顆）</span>' +
      '<span class="hmc-ov-item">連簽：<b>' + s.days + '</b> 日｜倍率 ×' +
      multOf(s.days) + '</span>' +
      '</div>' +
      '<h3 style="color:#6b3226;">成就四帖</h3>' +
      '<ul class="hmc-badge-list">' + rows + '</ul>' +
      '</div>';
  });

  /* ============ 遊戲系統初始化（整合階段發 hmjs:ready） ============ */
  window.addEventListener('hmjs:ready', function () {
    injectStyle();
    buildHud();

    // 依現有 rank 先換好袍、補印階 CSS
    applySprites(load('hmjs_rank', rankOf(visitedIds().length)));
    checkRank(true); // 首載靜默對齊（不重播詔書）
    applyAllSealClasses();
    updateHud();

    // 宣紙卡開啟：每站每日首次 +5
    on('card', function (p) {
      var id = p && p.site && p.site.id;
      if (!id) return;
      dailyOnce('card:' + id, function () { qi(5, 'card:' + id); });
      checkRank();
      checkBadges();
      updateHud();
    });

    // 真入山返回：每站每日首次 +10；入山次數 +1（印章三階）
    on('back', function (p) {
      var id = p && p.site && p.site.id;
      if (!id) return;
      var counts = load('hmjs_visit_counts', {});
      counts[id] = (counts[id] || 0) + 1;
      save('hmjs_visit_counts', counts);
      applySealClass(id);
      dailyOnce('back:' + id, function () { qi(10, 'back:' + id); });
      checkRank();
      checkBadges();
      updateHud();
    });
  });
})();
