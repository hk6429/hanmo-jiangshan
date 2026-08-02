// js/meta/collect.js — 收集圖鑑模組：山靈圖鑑＋集句冊＋文豪語錄＋山水尋詩
// 依 docs/meta-integration-spec.md（collect 段）實作。純瀏覽器全域、IIFE、不依賴任何打包器。
(function () {
  'use strict';

  var IMG = 'assets/img/';
  var SPIRIT_EGG = IMG + 'spirit_egg.png';
  var SEAL = IMG + 'seal.png';

  // ── 山水尋詩留白座標（避開山頭與謎題常用點，微調後定案）──
  var POEM_SPOTS = [
    { x: 190, y: 660 },
    { x: 1745, y: 585 },
    { x: 960, y: 1440 },
    { x: 2390, y: 1160 },
    { x: 560, y: 190 }
  ];

  var Bus = null;

  // ───────────────────────── 小工具 ─────────────────────────

  function load(key, fallback) {
    try {
      var v = Bus.load(key);
      return (v === null || v === undefined) ? fallback : v;
    } catch (e) { return fallback; }
  }

  function save(key, val) {
    try { Bus.save(key, val); } catch (e) { /* 靜默降級 */ }
  }

  function sites() {
    return (window.HMJS_SITES && window.HMJS_SITES.length) ? window.HMJS_SITES : [];
  }

  function siteById(id) {
    var list = sites();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // addDecor 的回傳型態不保證，統一從回傳值或 DOM 撈元素
  function addDecor(id, img, x, y, opts) {
    var el = null;
    try {
      var r = Bus.addDecor(id, img, x, y, opts || {});
      if (r) {
        if (r.nodeType === 1) el = r;
        else if (r.el && r.el.nodeType === 1) el = r.el;
      }
    } catch (e) { /* 靜默 */ }
    if (!el) {
      el = document.getElementById(id) ||
        document.querySelector('[data-decor-id="' + id + '"], [data-decor="' + id + '"], [data-id="' + id + '"]');
    }
    return el;
  }

  function removeDecor(el) {
    if (el && el.parentNode) {
      try { el.remove(); } catch (e) { el.style.display = 'none'; }
    }
  }

  function dist(x1, y1, x2, y2) {
    var dx = x1 - x2, dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ───────────────────────── 樣式注入 ─────────────────────────

  function injectStyle() {
    if (document.getElementById('hmk-collect-style')) return;
    var css = [
      '@keyframes hmk-float { 0%,100% { translate: 0 0; } 50% { translate: 0 -7px; } }',
      '@keyframes hmk-fadein { from { opacity: 0; transform: translate(-50%,-46%); } to { opacity: 1; transform: translate(-50%,-50%); } }',
      '@keyframes hmk-bubble-life { 0% { opacity: 0; translate: 0 8px; } 8% { opacity: 1; translate: 0 0; } 82% { opacity: 1; } 100% { opacity: 0; } }',
      '@keyframes hmk-glowpulse { 0%,100% { filter: drop-shadow(0 0 4px rgba(220,170,60,.55)); } 50% { filter: drop-shadow(0 0 12px rgba(220,170,60,.95)); } }',
      '.hmk-float { animation: hmk-float 2.6s ease-in-out infinite; }',
      '.hmk-glow { animation: hmk-glowpulse 2.2s ease-in-out infinite; }',
      '.hmk-shadow-spirit { filter: brightness(0) opacity(.35); }',
      '.hmk-bubble { position: fixed; right: 30px; bottom: 240px; max-width: 260px; z-index: 35;',
      '  background: #f7f1e3; border: 1px solid #c9bfa5; border-radius: 10px 10px 2px 10px;',
      '  padding: 10px 14px; color: #6b3226; font-size: 15px; line-height: 1.7; letter-spacing: 1px;',
      '  box-shadow: 0 4px 16px rgba(30,25,15,.3); pointer-events: none;',
      '  animation: hmk-bubble-life 5s ease forwards; }',
      '.hmk-bubble .hmk-bubble-who { display: block; font-size: 12px; color: #8a5a2b; margin-bottom: 2px; }',
      '.hmk-poemspot { position: absolute; width: 54px; height: 54px; border-radius: 50%;',
      '  transform: translate(-50%,-50%); pointer-events: none; opacity: .18;',
      '  border: 3px solid #3a3f3d;',
      '  background: radial-gradient(circle, rgba(58,63,61,.5) 0%, rgba(58,63,61,.12) 55%, transparent 72%);',
      '  transition: opacity .5s; }',
      '.hmk-poemspot.hmk-near { opacity: .6; }',
      '.hmk-verse { position: fixed; left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 45;',
      '  background: #f7f1e3; border: 1px solid #c9bfa5; border-radius: 8px; padding: 26px 30px 20px;',
      '  width: min(400px, calc(100vw - 48px)); box-shadow: 0 10px 40px rgba(30,25,15,.45);',
      '  color: #2e2a24; text-align: center; animation: hmk-fadein .6s ease; }',
      '.hmk-verse h3 { color: #6b3226; font-size: 20px; letter-spacing: 3px; margin-bottom: 2px; }',
      '.hmk-verse .hmk-verse-author { font-size: 13px; color: #8a5a2b; margin-bottom: 12px; }',
      '.hmk-verse .hmk-verse-line { font-size: 17px; line-height: 2; letter-spacing: 2px; }',
      '.hmk-verse .hmk-close { margin-top: 14px; padding: 6px 20px; font: inherit; cursor: pointer;',
      '  border: 1.5px solid #6b3226; background: transparent; color: #6b3226; border-radius: 6px; letter-spacing: 2px; }',
      '.hmk-cele { text-align: center; padding: 6px 0 2px; }',
      '.hmk-cele img { width: 150px; max-width: 60%; }',
      '.hmk-cele .hmk-cele-title { font-size: 20px; color: #6b3226; letter-spacing: 3px; margin: 10px 0 4px; }',
      '.hmk-cele .hmk-cele-sub { font-size: 14px; color: #4a463d; line-height: 1.8; }',
      '.hmk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 14px; margin-top: 12px; }',
      '.hmk-cell { background: #fffdf6; border: 1px solid #d9cfae; border-radius: 8px; padding: 10px 6px; text-align: center; }',
      '.hmk-cell img { width: 72px; height: 72px; object-fit: contain; }',
      '.hmk-cell .hmk-cell-name { display: block; margin-top: 6px; font-size: 14px; color: #2e2a24; letter-spacing: 2px; }',
      '.hmk-cell .hmk-cell-stage { display: block; font-size: 12px; color: #8a5a2b; }',
      '.hmk-cell.hmk-locked img { filter: brightness(0) opacity(.25); }',
      '.hmk-cell.hmk-egg img { }',
      '.hmk-cell.hmk-hatch img { filter: grayscale(.6) opacity(.75); }',
      '.hmk-cell.hmk-hidden-got img { filter: hue-rotate(150deg) saturate(1.4); }',
      '.hmk-sec-title { color: #6b3226; font-size: 17px; letter-spacing: 3px; margin: 18px 0 6px;',
      '  border-left: 4px solid #a03a26; padding-left: 10px; }',
      '.hmk-verse-list { list-style: none; line-height: 1.9; }',
      '.hmk-verse-list li { padding: 8px 10px; border-bottom: 1px dashed #d9cfae; }',
      '.hmk-verse-list .hmk-vfull { color: #2e2a24; font-size: 16px; letter-spacing: 1px; }',
      '.hmk-verse-list .hmk-vnote { color: #4a463d; font-size: 13px; }',
      '.hmk-verse-list .hmk-vwho { color: #8a5a2b; font-size: 13px; margin-right: 8px; }',
      '.hmk-empty { color: #8a8272; font-size: 14px; padding: 8px 2px; }',
      '.hmk-scrollbtn { display: inline-block; margin: 12px 0; padding: 8px 24px; font: inherit; cursor: pointer;',
      '  background: #6b3226; color: #f7f1e3; border: none; border-radius: 6px; letter-spacing: 3px; }',
      '.hmk-riddle-opt { display: block; width: 100%; margin: 8px 0; padding: 10px 14px; font: inherit;',
      '  text-align: left; cursor: pointer; background: #fffdf6; border: 1px solid #d9cfae;',
      '  border-radius: 6px; color: #2e2a24; line-height: 1.6; }',
      '.hmk-riddle-opt:hover { border-color: #6b3226; }',
      '.hmk-riddle-why { margin-top: 12px; padding: 10px 14px; border-left: 4px solid #a03a26;',
      '  color: #4a463d; font-size: 14px; line-height: 1.8; }'
    ].join('\n');
    var style = document.createElement('style');
    style.id = 'hmk-collect-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ═══════════════════ 一、山靈圖鑑 ═══════════════════

  var spiritDecors = {};   // 山id → 常駐山靈元素
  var riddleDecors = {};   // idx → 墨影點元素
  var riddleNear = {};     // idx → 是否已在半徑內（進場緣觸發）
  var riddleOpen = false;

  function spiritImg(id) { return IMG + 'spirit_' + id + '.png'; }

  function spiritStageOf(count) {
    if (count >= 10) return 2;
    if (count >= 3) return 1;
    if (count >= 1) return 0;
    return -1;
  }

  function mountResidentSpirit(site) {
    var decorId = 'hmk-spirit-' + site.id;
    if (spiritDecors[decorId]) return;
    var el = addDecor(decorId, spiritImg(site.id), site.x + 120, site.y - 20, {
      w: 56,
      onClick: function () {
        try { Bus.toast(site.mountain + '山靈與你同遊'); } catch (e) {}
      }
    });
    if (el) el.classList.add('hmk-float');
    spiritDecors[decorId] = el || true;
  }

  function celebrateSpirit(site, stage) {
    var titles = ['山靈之蛋現世', '山靈破殼而出', '山靈修成完全體'];
    var subs = [
      '初訪' + site.mountain + '，一枚水墨蛋悄悄跟上了你。再多來幾趟，牠就會破殼。',
      site.mountain + '的山靈探出頭來了！入山滿十次，牠將顯出完全體真身。',
      site.mountain + '山靈修成完全體，自此常駐山前，與你同遊翰墨江山。'
    ];
    var img, filter = '';
    if (stage === 0) { img = SPIRIT_EGG; }
    else if (stage === 1) { img = spiritImg(site.id); filter = 'filter:grayscale(.6) opacity(.75);'; }
    else { img = spiritImg(site.id); }
    var html = '<div class="hmk-cele">' +
      '<img src="' + esc(img) + '" alt="山靈" style="' + filter + '">' +
      '<div class="hmk-cele-title">' + esc(site.mountain) + '・' + titles[stage] + '</div>' +
      '<div class="hmk-cele-sub">' + esc(subs[stage]) + '</div>' +
      '</div>';
    try { Bus.panel('山靈圖鑑', html); } catch (e) {}
    try { Bus.qi(20, 'spirit_' + site.id + '_stage' + stage); } catch (e) {}
  }

  function onBackSpirit(site) {
    if (!site || !site.id) return;
    var counts = load('hmjs_visit_counts', {});
    var stage = spiritStageOf(counts[site.id] || 0);
    if (stage < 0) return;
    var spirits = load('hmjs_spirits', {});
    var prev = (site.id in spirits) ? spirits[site.id] : -1;
    if (stage > prev) {
      spirits[site.id] = stage;
      save('hmjs_spirits', spirits);
      celebrateSpirit(site, stage);
    }
    if (stage === 2) mountResidentSpirit(site);
  }

  function restoreResidentSpirits() {
    var spirits = load('hmjs_spirits', {});
    sites().forEach(function (site) {
      if (spirits[site.id] === 2) mountResidentSpirit(site);
    });
  }

  // ── 隱藏山靈（謎題墨影點）──

  function riddles() {
    return (window.HMJS_RIDDLES && window.HMJS_RIDDLES.length) ? window.HMJS_RIDDLES : [];
  }

  function mountRiddleSpots() {
    var got = load('hmjs_spirits_hidden', []);
    riddles().forEach(function (r, idx) {
      if (got.indexOf(idx) !== -1) return;
      var el = addDecor('hmk-riddle-' + idx, SPIRIT_EGG, r.x, r.y, { w: 48 });
      if (el) el.classList.add('hmk-shadow-spirit');
      riddleDecors[idx] = el;
    });
  }

  function openRiddle(idx) {
    var r = riddles()[idx];
    if (!r || riddleOpen) return;
    riddleOpen = true;
    var html = '<div style="line-height:1.9;font-size:16px;color:#2e2a24;">' + esc(r.q) + '</div>' +
      '<div id="hmk-riddle-opts">' +
      r.opts.map(function (opt, i) {
        return '<button type="button" class="hmk-riddle-opt" data-i="' + i + '">' +
          '（' + '甲乙丙丁'.charAt(i) + '）' + esc(opt) + '</button>';
      }).join('') +
      '</div><div id="hmk-riddle-result"></div>';
    var p;
    try { p = Bus.panel('墨影謎題', html); } catch (e) { riddleOpen = false; return; }
    if (!p || !p.body) { riddleOpen = false; return; }
    var opts = p.body.querySelector('#hmk-riddle-opts');
    var result = p.body.querySelector('#hmk-riddle-result');
    var answered = false;
    if (opts) opts.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('.hmk-riddle-opt') : null;
      if (!btn || answered) return;
      answered = true;
      var pick = parseInt(btn.getAttribute('data-i'), 10);
      if (pick === r.ans) {
        var got = load('hmjs_spirits_hidden', []);
        if (got.indexOf(idx) === -1) {
          got.push(idx);
          save('hmjs_spirits_hidden', got);
          try { Bus.qi(30, 'spirit_hidden_' + idx); } catch (e) {}
        }
        removeDecor(riddleDecors[idx]);
        riddleDecors[idx] = null;
        result.innerHTML =
          '<div class="hmk-cele">' +
          '<img src="' + esc(SPIRIT_EGG) + '" alt="隱藏山靈" style="filter:hue-rotate(150deg) saturate(1.4);width:110px;">' +
          '<div class="hmk-cele-title">收服隱藏山靈「' + esc(r.spirit) + '」！</div>' +
          '<div class="hmk-riddle-why">' + esc(r.why) + '</div></div>';
        try { Bus.toast('收服隱藏山靈：' + r.spirit); } catch (e) {}
      } else {
        result.innerHTML = '<div class="hmk-riddle-why">答錯了……墨影散去，改日再來挑戰。<br>' + esc(r.why || '') + '</div>';
      }
    });
    // 關閉時解鎖（panel 關法未知，用輪詢元素是否仍在 DOM）
    var watch = setInterval(function () {
      if (!p.el || !document.body.contains(p.el)) {
        clearInterval(watch);
        riddleOpen = false;
      }
    }, 600);
  }

  function tickRiddles(x, y) {
    if (riddleOpen) return;
    var got = load('hmjs_spirits_hidden', []);
    riddles().forEach(function (r, idx) {
      if (got.indexOf(idx) !== -1) return;
      var near = dist(x, y, r.x, r.y) < 90;
      if (near && !riddleNear[idx]) {
        riddleNear[idx] = true;
        openRiddle(idx);
      } else if (!near) {
        riddleNear[idx] = false;
      }
    });
  }

  // ── 山靈分頁 ──

  function renderSpiritTab() {
    var spirits = load('hmjs_spirits', {});
    var hidden = load('hmjs_spirits_hidden', []);
    var cells = sites().map(function (site) {
      var stage = (site.id in spirits) ? spirits[site.id] : -1;
      var cls, img, label;
      if (stage === -1) { cls = 'hmk-locked'; img = spiritImg(site.id); label = '未現世'; }
      else if (stage === 0) { cls = 'hmk-egg'; img = SPIRIT_EGG; label = '蛋'; }
      else if (stage === 1) { cls = 'hmk-hatch'; img = spiritImg(site.id); label = '破殼'; }
      else { cls = ''; img = spiritImg(site.id); label = '完全體'; }
      return '<div class="hmk-cell ' + cls + '">' +
        '<img src="' + esc(img) + '" alt="' + esc(site.mountain) + '山靈" loading="lazy">' +
        '<span class="hmk-cell-name">' + esc(site.mountain) + '</span>' +
        '<span class="hmk-cell-stage">' + label + '</span></div>';
    });
    var hiddenCells = riddles().map(function (r, idx) {
      var got = hidden.indexOf(idx) !== -1;
      var cls = got ? 'hmk-hidden-got' : 'hmk-locked';
      var name = got ? r.spirit : '？？？';
      return '<div class="hmk-cell ' + cls + '">' +
        '<img src="' + esc(SPIRIT_EGG) + '" alt="隱藏山靈" loading="lazy">' +
        '<span class="hmk-cell-name">' + esc(name) + '</span>' +
        '<span class="hmk-cell-stage">' + (got ? '已收服' : '隱藏') + '</span></div>';
    });
    return '<div class="hmk-sec-title">十山山靈</div>' +
      '<div class="hmk-grid">' + cells.join('') + '</div>' +
      (hiddenCells.length
        ? '<div class="hmk-sec-title">隱藏山靈</div><div class="hmk-grid">' + hiddenCells.join('') + '</div>'
        : '');
  }

  // ═══════════════════ 二、駐山文人集句冊 ═══════════════════

  var verseRotate = {};  // 山id → 本次瀏覽已吟次數（氣泡輪換用）

  function versesOf(id) {
    var v = window.HMJS_VERSES;
    return (v && v[id] && v[id].length) ? v[id] : null;
  }

  function onCardVerse(site) {
    if (!site || !versesOf(site.id)) return;
    var list = versesOf(site.id);
    var n = verseRotate[site.id] || 0;
    verseRotate[site.id] = n + 1;
    var v = list[n % list.length];
    var old = document.querySelector('.hmk-bubble');
    if (old) old.remove();
    var bubble = document.createElement('div');
    bubble.className = 'hmk-bubble';
    bubble.innerHTML = '<span class="hmk-bubble-who">' + esc(site.mountain) + '駐山文人吟道──</span>' + esc(v.half);
    document.body.appendChild(bubble);
    setTimeout(function () { bubble.remove(); }, 5200);
  }

  function onBackVerse(site) {
    if (!site || !versesOf(site.id)) return;
    var store = load('hmjs_verses', {});
    var c = store[site.id] || 0;
    if (c >= 3) return;
    var v = versesOf(site.id)[c];
    if (!v) return;
    store[site.id] = c + 1;
    save('hmjs_verses', store);
    try { Bus.toast('＋集句：' + v.full); } catch (e) {}
    try { Bus.qi(5, 'verse_' + site.id + '_' + c); } catch (e) {}
  }

  function allTenCollected() {
    var store = load('hmjs_verses', {});
    var list = sites();
    if (!list.length) return false;
    for (var i = 0; i < list.length; i++) {
      if (!versesOf(list[i].id)) continue;    // 資料缺失的山不擋卷軸
      if (!(store[list[i].id] >= 1)) return false;
    }
    return true;
  }

  // ── 集句成卷（canvas 直式卷軸）──

  function drawVerticalText(ctx, text, x, y, size, maxY) {
    // 直排：由上而下逐字；超出底界換到左側新行。回傳最後使用的 x。
    var lh = size * 1.18;
    var cx = x, cy = y;
    for (var i = 0; i < text.length; i++) {
      if (cy > maxY) { cx -= size * 1.5; cy = y; }
      ctx.fillText(text.charAt(i), cx, cy);
      cy += lh;
    }
    return cx;
  }

  function downloadScroll() {
    var W = 760, H = 1360;
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    // 宣紙底
    ctx.fillStyle = '#f7f1e3';
    ctx.fillRect(0, 0, W, H);
    // 邊框（卷軸感）
    ctx.strokeStyle = '#c9bfa5';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, W - 48, H - 48);
    ctx.strokeStyle = '#6b3226';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(34, 34, W - 68, H - 68);
    // 標題（右側首行直排）
    ctx.fillStyle = '#6b3226';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '42px "Noto Serif TC", "PingFang TC", serif';
    drawVerticalText(ctx, '集句成卷', W - 90, 110, 42, H - 120);
    // 十聯直排（右至左）
    ctx.fillStyle = '#2e2a24';
    ctx.font = '30px "Noto Serif TC", "PingFang TC", serif';
    var store = load('hmjs_verses', {});
    var x = W - 170;
    sites().forEach(function (site) {
      var list = versesOf(site.id);
      if (!list || !(store[site.id] >= 1)) return;
      var lastX = drawVerticalText(ctx, list[0].full, x, 90, 30, H - 240);
      x = lastX - 58;
    });
    // 落款
    ctx.fillStyle = '#a03a26';
    ctx.font = '26px "Noto Serif TC", "PingFang TC", serif';
    var dateStr = '';
    try { dateStr = Bus.today(); } catch (e) {}
    drawVerticalText(ctx, '翰墨江山', 80, H - 300, 26, H - 170);
    ctx.fillStyle = '#8a5a2b';
    ctx.font = '18px "Noto Serif TC", "PingFang TC", serif';
    drawVerticalText(ctx, dateStr, 48, H - 300, 18, H - 120);
    // 下載
    try {
      var a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = '翰墨江山_集句成卷_' + (dateStr || 'scroll') + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      try { Bus.toast('卷軸產生失敗，請再試一次'); } catch (e2) {}
    }
  }

  // ═══════════════════ 三、文豪語錄 ═══════════════════

  var quoteDecor = null;

  function quotes() {
    return (window.HMJS_QUOTES && window.HMJS_QUOTES.length) ? window.HMJS_QUOTES : [];
  }

  function collectQuote() {
    var all = quotes();
    var got = load('hmjs_quotes', []);
    var next = -1;
    for (var i = 0; i < all.length; i++) {
      if (got.indexOf(i) === -1) { next = i; break; }
    }
    if (next === -1) {
      try { Bus.toast('三十則文豪語錄已全數收藏'); } catch (e) {}
      return;
    }
    got.push(next);
    save('hmjs_quotes', got);
    try { Bus.qi(5, 'quote_' + next); } catch (e) {}
    var q = all[next];
    var html = '<div class="hmk-cele">' +
      '<div class="hmk-cele-title">' + esc(q.who) + '</div>' +
      '<div class="hmk-verse-line" style="font-size:18px;line-height:2;color:#2e2a24;">' + esc(q.text) + '</div>' +
      '<div class="hmk-cele-sub" style="margin-top:10px;">' + esc(q.plain) + '</div>' +
      '<div class="hmk-cele-sub" style="margin-top:8px;color:#8a5a2b;">語錄收藏 ' + got.length + ' / ' + all.length + '</div>' +
      '</div>';
    try { Bus.panel('文豪語錄', html); } catch (e) {}
    removeDecor(quoteDecor);
    quoteDecor = null;
    // 收滿 30 則一次性大獎
    if (got.length >= all.length && !load('hmjs_quotes_master', false)) {
      save('hmjs_quotes_master', true);
      try { Bus.toast('語錄大家！三十則文豪語錄收藏圓滿'); } catch (e) {}
      try { Bus.qi(50, 'quotes_master'); } catch (e) {}
    }
  }

  function mountQuoteSpot() {
    var all = quotes();
    if (!all.length) return;
    var got = load('hmjs_quotes', []);
    if (got.length >= all.length) return;
    var today = '';
    try { today = Bus.today(); } catch (e) { return; }
    var pick, roll;
    try {
      pick = Bus.seed(today + 'q') % 10;
      roll = Bus.seed(today + 'q_roll') % 100;
    } catch (e) { return; }
    if (roll >= 40) return;  // 40% 機率，同日固定
    var site = sites()[pick];
    if (!site) return;
    var el = addDecor('hmk-quote-spot', SEAL, site.x + 60, site.y + 110, {
      w: 40,
      onClick: collectQuote
    });
    if (el) el.classList.add('hmk-glow');
    quoteDecor = el;
  }

  // ═══════════════════ 四、山水尋詩 ═══════════════════

  var poemSpotEls = {};
  var poemNear = {};
  var poemPaperOpen = false;

  function poems() {
    return (window.HMJS_POEMS && window.HMJS_POEMS.length) ? window.HMJS_POEMS : [];
  }

  function poemGot() {
    var s = load('hmjs_poems', {});
    return (s && s.got && s.got.length) ? s.got : [];
  }

  function mountPoemSpots() {
    var world = document.getElementById('world');
    if (!world || !poems().length) return;
    var got = poemGot();
    POEM_SPOTS.forEach(function (spot, idx) {
      if (idx >= poems().length) return;
      if (got.indexOf(idx) !== -1) return;
      var el = document.createElement('div');
      el.className = 'hmk-poemspot';
      el.style.left = spot.x + 'px';
      el.style.top = spot.y + 'px';
      world.appendChild(el);
      poemSpotEls[idx] = el;
    });
  }

  function showPoemPaper(idx) {
    if (poemPaperOpen) return;
    poemPaperOpen = true;
    var p = poems()[idx];
    var got = poemGot();
    var isNew = got.indexOf(idx) === -1;
    if (isNew) {
      got.push(idx);
      save('hmjs_poems', { got: got });
      try { Bus.qi(10, 'poem_' + idx); } catch (e) {}
    }
    var paper = document.createElement('div');
    paper.className = 'hmk-verse';
    paper.innerHTML = '<h3>' + esc(p.title) + '</h3>' +
      '<div class="hmk-verse-author">' + esc(p.author) + '</div>' +
      p.lines.map(function (l) { return '<div class="hmk-verse-line">' + esc(l) + '</div>'; }).join('') +
      (isNew ? '<div class="hmk-verse-author" style="margin-top:10px;">尋得詩篇 ' + got.length + ' / ' + poems().length + '</div>' : '') +
      '<button type="button" class="hmk-close">收入詩囊</button>';
    document.body.appendChild(paper);
    paper.querySelector('.hmk-close').addEventListener('click', function () {
      paper.remove();
      poemPaperOpen = false;
    });
    removeDecor(poemSpotEls[idx]);
    poemSpotEls[idx] = null;
    // 五首收齊 → 隱藏印「尋幽探勝」
    if (isNew && got.length >= poems().length && !load('hmjs_poem_seal', false)) {
      save('hmjs_poem_seal', true);
      try { Bus.toast('五首詩篇收齊，得隱藏印「尋幽探勝」！'); } catch (e) {}
      try { Bus.qi(50, 'poem_seal'); } catch (e) {}
    }
  }

  function tickPoems(x, y) {
    var got = poemGot();
    POEM_SPOTS.forEach(function (spot, idx) {
      if (idx >= poems().length) return;
      if (got.indexOf(idx) !== -1) return;
      var d = dist(x, y, spot.x, spot.y);
      var el = poemSpotEls[idx];
      if (el) el.classList.toggle('hmk-near', d < 200);
      var near = d < 70;
      if (near && !poemNear[idx]) {
        poemNear[idx] = true;
        showPoemPaper(idx);
      } else if (!near) {
        poemNear[idx] = false;
      }
    });
  }

  // ═══════════════════ 分頁渲染 ═══════════════════

  function renderVerseTab() {
    var store = load('hmjs_verses', {});
    var secs = sites().map(function (site) {
      var list = versesOf(site.id);
      var c = store[site.id] || 0;
      if (!list || c < 1) return '';
      var items = list.slice(0, Math.min(c, list.length)).map(function (v) {
        return '<li><span class="hmk-vwho">' + esc(site.mountain) + '</span>' +
          '<span class="hmk-vfull">' + esc(v.half) + ' → ' + esc(v.full) + '</span><br>' +
          '<span class="hmk-vnote">' + esc(v.note) + '</span></li>';
      }).join('');
      return items;
    }).join('');
    var verseHtml = secs
      ? '<ul class="hmk-verse-list">' + secs + '</ul>'
      : '<div class="hmk-empty">尚未集得聯句。開啟宣紙卡聽文人吟半句，入山歸來即贈整聯。</div>';
    var scrollBtn = allTenCollected()
      ? '<button type="button" class="hmk-scrollbtn" id="hmk-scroll-dl">集句成卷（下載卷軸）</button>'
      : '<div class="hmk-empty">十山各集得一聯後，可將名句裝裱成直式卷軸下載。</div>';
    // 語錄圖鑑（併入下半部）
    var all = quotes();
    var got = load('hmjs_quotes', []);
    var quoteHtml;
    if (!all.length) {
      quoteHtml = '';
    } else if (!got.length) {
      quoteHtml = '<div class="hmk-empty">尚未收藏語錄。留意每日山腳偶現的微光印記。</div>';
    } else {
      quoteHtml = '<ul class="hmk-verse-list">' +
        got.map(function (i) {
          var q = all[i];
          if (!q) return '';
          return '<li><span class="hmk-vwho">' + esc(q.who) + '</span>' +
            '<span class="hmk-vfull">' + esc(q.text) + '</span><br>' +
            '<span class="hmk-vnote">' + esc(q.plain) + '</span></li>';
        }).join('') + '</ul>' +
        '<div class="hmk-empty">語錄收藏 ' + got.length + ' / ' + all.length + '</div>';
    }
    return '<div class="hmk-sec-title">駐山文人集句冊</div>' + verseHtml + scrollBtn +
      (all.length ? '<div class="hmk-sec-title">文豪語錄</div>' + quoteHtml : '');
  }

  function makeTabFn(renderFn) {
    // registerTab 的 fn 介面容錯：給 container 就填充，否則回傳 html 字串
    return function (container) {
      var html = renderFn();
      if (container && container.nodeType === 1) {
        container.innerHTML = html;
        return;
      }
      return html;
    };
  }

  // 卷軸下載按鈕用事件委派（分頁渲染方式不定，委派最穩）
  function bindGlobalDelegates() {
    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (t && t.id === 'hmk-scroll-dl') downloadScroll();
    });
  }

  // ═══════════════════ 初始化 ═══════════════════

  var lastTick = 0;

  function onTick(payload) {
    var now = Date.now();
    if (now - lastTick < 250) return;   // 節流：每 250ms 檢查一次距離
    lastTick = now;
    var x, y;
    if (payload && typeof payload.x === 'number') {
      x = payload.x; y = payload.y;
    } else if (window.HMJSPlayer && typeof window.HMJSPlayer.pos === 'function') {
      var pos = window.HMJSPlayer.pos();
      if (!pos) return;
      x = pos.x; y = pos.y;
    } else {
      return;
    }
    if (window.HMJS_RIDDLES) tickRiddles(x, y);
    if (window.HMJS_POEMS) tickPoems(x, y);
  }

  function init() {
    Bus = window.HMJSBus;
    if (!Bus) return;
    injectStyle();
    bindGlobalDelegates();

    // 一、山靈圖鑑（依賴 visit_counts，不依賴外部資料檔）
    Bus.on('back', function (payload) {
      var site = payload && payload.site;
      if (site) {
        onBackSpirit(site);
        if (window.HMJS_VERSES) onBackVerse(site);
      }
    });
    restoreResidentSpirits();
    if (window.HMJS_RIDDLES) mountRiddleSpots();
    try { Bus.registerTab('山靈', makeTabFn(renderSpiritTab)); } catch (e) {}

    // 二、集句冊（含語錄圖鑑分頁）
    if (window.HMJS_VERSES) {
      Bus.on('card', function (payload) {
        onCardVerse(payload && payload.site);
      });
    }
    try { Bus.registerTab('集句', makeTabFn(renderVerseTab)); } catch (e) {}

    // 三、文豪語錄（每日 40% 機率山腳現點）
    if (window.HMJS_QUOTES) mountQuoteSpot();

    // 四、山水尋詩
    if (window.HMJS_POEMS) mountPoemSpots();

    // tick 共用（謎題＋尋詩）
    if (window.HMJS_RIDDLES || window.HMJS_POEMS) {
      Bus.on('tick', onTick);
    }
  }

  window.addEventListener('hmjs:ready', init);
})();
