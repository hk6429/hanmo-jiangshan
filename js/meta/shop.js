// js/meta/shop.js — 腳程錄＋墨寶閣（商店）＋坐騎＋換裝
// 依 docs/meta-integration-spec.md：純靜態、localStorage 走 hmjs_ 前綴（經 HMJSBus.load/save）、
// 樣式自我注入（class 前綴 hms-）、初始化掛 hmjs:ready。
(function () {
  'use strict';

  // ── 商品設定 ──────────────────────────────────────────────
  var MILESTONES = [
    { px: 5000, mount: 'crane' },
    { px: 20000, mount: 'carp' },
    { px: 50000, mount: 'dragon' },
  ];
  var MOUNTS = [
    { id: 'crane', name: '紙鶴', price: 100, mult: 1.3, needPx: 5000,
      img: 'assets/img/mount_crane.png' },
    { id: 'carp', name: '墨鯉', price: 250, mult: 1.6, needPx: 20000,
      img: 'assets/img/mount_carp.png' },
    { id: 'dragon', name: '水墨龍', price: 600, mult: 2.0, needPx: 50000,
      img: 'assets/img/mount_dragon.png' },
  ];
  var ACCS = [
    { id: 'hat', name: '斗笠', price: 30 },
    { id: 'umbrella', name: '紙傘', price: 50 },
    { id: 'cloak', name: '披風', price: 80 },
    { id: 'jade', name: '玉佩', price: 120 },
  ];

  var bus = null;
  var distance = 0;        // 累計移動 px
  var unsaved = 0;         // 尚未落盤的位移量
  var unlocked = [];       // 已達里程碑的坐騎 id
  var wardrobe = [];       // 已購 id（配飾＋坐騎混放）
  var outfit = { mount: null, acc: [] };
  var prev = null;         // 上一幀座標
  var shopPanel = null;    // 開啟中的商店面板

  function findMount(id) {
    for (var i = 0; i < MOUNTS.length; i++) if (MOUNTS[i].id === id) return MOUNTS[i];
    return null;
  }
  function findAcc(id) {
    for (var i = 0; i < ACCS.length; i++) if (ACCS[i].id === id) return ACCS[i];
    return null;
  }
  function owned(id) { return wardrobe.indexOf(id) !== -1; }

  // ── 樣式注入 ──────────────────────────────────────────────
  function injectStyle() {
    if (document.getElementById('hms-shop-style')) return;
    var css = '' +
      '@keyframes hms-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }' +
      '.hms-mount-icon { position: absolute; left: -52px; top: -18px; width: 60px;' +
      '  pointer-events: none; animation: hms-float 2.4s ease-in-out infinite; }' +
      '.hms-shop-sec { margin: 14px 0 6px; color: #6b3226; font-size: 17px;' +
      '  letter-spacing: 3px; border-bottom: 1px solid #d9cfae; padding-bottom: 4px; }' +
      '.hms-shop-balance { color: #8a5a2b; font-weight: 700; margin-bottom: 4px; }' +
      '.hms-item { display: flex; align-items: center; justify-content: space-between;' +
      '  gap: 10px; background: #fffdf6; border: 1px solid #d9cfae; border-radius: 8px;' +
      '  padding: 10px 14px; margin: 8px 0; line-height: 1.6; }' +
      '.hms-item-info { flex: 1; min-width: 0; }' +
      '.hms-item-name { color: #2e2a24; font-weight: 700; }' +
      '.hms-item-note { font-size: 13px; color: #4a463d; }' +
      '.hms-item-note.hms-locked { color: #a03a26; }' +
      '.hms-price { color: #8a5a2b; font-size: 14px; white-space: nowrap; }' +
      '.hms-btn { font: inherit; font-size: 14px; padding: 5px 14px; cursor: pointer;' +
      '  border: 1.5px solid #6b3226; border-radius: 6px; background: rgba(245,239,226,.9);' +
      '  color: #6b3226; letter-spacing: 2px; white-space: nowrap; }' +
      '.hms-btn:hover { background: #6b3226; color: #f7f1e3; }' +
      '.hms-btn.hms-on { background: #6b3226; color: #f7f1e3; }' +
      '.hms-btn[disabled] { opacity: .45; cursor: not-allowed; }' +
      '.hms-btn[disabled]:hover { background: rgba(245,239,226,.9); color: #6b3226; }' +
      '.hms-bag { line-height: 1.9; color: #4a463d; }' +
      '.hms-bag-stat { margin: 6px 0; }' +
      '.hms-bag-stat b { color: #6b3226; }' +
      '.hms-progress { position: relative; height: 14px; border-radius: 999px;' +
      '  background: #e6dec8; border: 1px solid #d9cfae; overflow: hidden; margin: 6px 0 2px; }' +
      '.hms-progress-fill { position: absolute; left: 0; top: 0; bottom: 0;' +
      '  background: linear-gradient(90deg, #8a5a2b, #a03a26); border-radius: 999px; }' +
      '.hms-progress-label { font-size: 13px; color: #4a463d; }' +
      '.hms-tag { display: inline-block; font-size: 12px; padding: 1px 8px; margin-left: 6px;' +
      '  border-radius: 999px; border: 1px solid #c9bfa5; color: #6b3226; vertical-align: middle; }' +
      '.hms-tag.hms-wearing { background: #6b3226; color: #f7f1e3; border-color: #6b3226; }';
    var el = document.createElement('style');
    el.id = 'hms-shop-style';
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ── 存讀 ─────────────────────────────────────────────────
  function loadState() {
    distance = Number(bus.load('hmjs_distance', 0)) || 0;
    unlocked = bus.load('hmjs_mount_unlock', []) || [];
    wardrobe = bus.load('hmjs_wardrobe', []) || [];
    var o = bus.load('hmjs_outfit', null);
    if (o && typeof o === 'object') {
      outfit.mount = o.mount || null;
      outfit.acc = Array.isArray(o.acc) ? o.acc : [];
    }
  }
  function saveOutfit() { bus.save('hmjs_outfit', outfit); }
  function saveWardrobe() { bus.save('hmjs_wardrobe', wardrobe); }
  function saveDistance() { bus.save('hmjs_distance', Math.round(distance)); unsaved = 0; }

  // ── 腳程錄 ────────────────────────────────────────────────
  function onTick(p) {
    if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return;
    if (prev) {
      var d = Math.hypot(p.x - prev.x, p.y - prev.y);
      if (d > 0 && d < 200) { // 靜止不加；瞬移（walkTo 直跳等異常）不計
        distance += d;
        unsaved += d;
        checkMilestones();
        if (unsaved >= 300) saveDistance(); // 節流落盤，避免每幀寫 localStorage
      }
    }
    prev = { x: p.x, y: p.y };
  }

  function checkMilestones() {
    for (var i = 0; i < MILESTONES.length; i++) {
      var m = MILESTONES[i];
      if (distance >= m.px && unlocked.indexOf(m.mount) === -1) {
        unlocked.push(m.mount);
        bus.save('hmjs_mount_unlock', unlocked);
        saveDistance();
        var mt = findMount(m.mount);
        bus.toast('腳程解鎖：可購' + mt.name + '！快去墨寶閣看看');
      }
    }
  }

  function nextMilestone() {
    for (var i = 0; i < MILESTONES.length; i++) {
      if (distance < MILESTONES[i].px) return MILESTONES[i];
    }
    return null;
  }

  // ── 坐騎效果 ──────────────────────────────────────────────
  function applyMount() {
    var m = outfit.mount ? findMount(outfit.mount) : null;
    window.HMJS_SPEED_MULT = m ? m.mult : 1;
    var player = document.getElementById('player');
    if (!player) return;
    var icon = player.querySelector('.hms-mount-icon');
    if (m) {
      if (!icon) {
        icon = document.createElement('img');
        icon.className = 'hms-mount-icon';
        icon.alt = '';
        player.appendChild(icon);
      }
      icon.src = m.img;
    } else if (icon) {
      icon.remove();
    }
  }

  // ── 穿戴／購買 ────────────────────────────────────────────
  function buy(id) {
    var item = findMount(id) || findAcc(id);
    if (!item || owned(id)) return;
    var mount = findMount(id);
    if (mount && unlocked.indexOf(id) === -1) {
      bus.toast('腳程未達 ' + mount.needPx + ' 步，還騎不了' + mount.name);
      return;
    }
    if (bus.getQi() < item.price) {
      bus.toast('文氣不足，還差 ' + (item.price - bus.getQi()) + ' 點，多遊歷再來吧');
      return;
    }
    bus.qi(-item.price, 'shop');
    wardrobe.push(id);
    saveWardrobe();
    bus.toast('購得「' + item.name + '」！');
  }

  function toggleWear(id) {
    if (!owned(id)) return;
    if (findMount(id)) {
      outfit.mount = (outfit.mount === id) ? null : id;
      applyMount();
    } else {
      var idx = outfit.acc.indexOf(id);
      if (idx === -1) outfit.acc.push(id); else outfit.acc.splice(idx, 1);
    }
    saveOutfit();
  }

  // ── 墨寶閣面板 ────────────────────────────────────────────
  function itemRow(item, isMount) {
    var has = owned(item.id);
    var wearing = isMount ? outfit.mount === item.id : outfit.acc.indexOf(item.id) !== -1;
    var lock = isMount && unlocked.indexOf(item.id) === -1;
    var note;
    if (isMount) {
      note = lock
        ? '<div class="hms-item-note hms-locked">需累計腳程 ' + item.needPx +
          ' 步解鎖（目前 ' + Math.floor(distance) + '）</div>'
        : '<div class="hms-item-note">坐騎．腳程 ×' + item.mult + '</div>';
    } else {
      note = '<div class="hms-item-note">配飾．遊歷圖與名帖展示</div>';
    }
    var btn;
    if (!has) {
      btn = '<button class="hms-btn" data-hms-buy="' + item.id + '"' +
        (lock ? ' disabled' : '') + '>購買</button>';
    } else {
      btn = '<button class="hms-btn' + (wearing ? ' hms-on' : '') +
        '" data-hms-wear="' + item.id + '">' + (wearing ? '卸下' : '穿戴') + '</button>';
    }
    return '<div class="hms-item"><div class="hms-item-info">' +
      '<span class="hms-item-name">' + item.name + '</span>' +
      (wearing ? '<span class="hms-tag hms-wearing">穿戴中</span>'
               : (has ? '<span class="hms-tag">已購</span>' : '')) +
      note + '</div>' +
      (has ? '' : '<span class="hms-price">' + item.price + ' 文氣</span>') +
      btn + '</div>';
  }

  function shopHTML() {
    var h = '<div class="hms-shop-balance">身上文氣：' + bus.getQi() + ' 點</div>';
    h += '<div class="hms-shop-sec">配飾</div>';
    for (var i = 0; i < ACCS.length; i++) h += itemRow(ACCS[i], false);
    h += '<div class="hms-shop-sec">坐騎</div>';
    for (var j = 0; j < MOUNTS.length; j++) h += itemRow(MOUNTS[j], true);
    return h;
  }

  function openShop() {
    if (shopPanel) { try { shopPanel.close(); } catch (e) {} }
    shopPanel = bus.panel('墨寶閣', shopHTML());
    shopPanel.body.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-hms-buy],[data-hms-wear]') : null;
      if (!t) return;
      var buyId = t.getAttribute('data-hms-buy');
      var wearId = t.getAttribute('data-hms-wear');
      if (buyId) buy(buyId);
      if (wearId) toggleWear(wearId);
      shopPanel.body.innerHTML = shopHTML(); // 重繪反映餘額與穿戴狀態
    });
  }

  // ── 遊歷圖「行囊」分頁 ────────────────────────────────────
  function renderBag(container) {
    var li = Math.floor(distance / 500);
    var next = nextMilestone();
    var h = '<div class="hms-bag">';
    h += '<div class="hms-bag-stat">文氣餘額：<b>' + bus.getQi() + '</b> 點</div>';
    h += '<div class="hms-bag-stat">累計腳程：<b>' + Math.floor(distance) +
      '</b> 步（約 <b>' + li + '</b> 里）</div>';
    if (next) {
      var mt = findMount(next.mount);
      var pct = Math.min(100, Math.round(distance / next.px * 100));
      h += '<div class="hms-bag-stat">下一里程碑：' + next.px + ' 步解鎖「' + mt.name + '」' +
        '<div class="hms-progress"><div class="hms-progress-fill" style="width:' + pct +
        '%"></div></div><div class="hms-progress-label">' + Math.floor(distance) + ' / ' +
        next.px + '（' + pct + '%）</div></div>';
    } else {
      h += '<div class="hms-bag-stat">里程碑：<b>全數達成</b>，三騎皆可購！</div>';
    }
    h += '<div class="hms-shop-sec">行囊清單</div>';
    if (!wardrobe.length) {
      h += '<div class="hms-bag-stat">尚無收藏——多走多攢文氣，再去墨寶閣挑一件吧。</div>';
    } else {
      var all = ACCS.concat(MOUNTS);
      for (var i = 0; i < all.length; i++) {
        var it = all[i];
        if (!owned(it.id)) continue;
        var wearing = findMount(it.id) ? outfit.mount === it.id
                                       : outfit.acc.indexOf(it.id) !== -1;
        h += '<div class="hms-item"><div class="hms-item-info">' +
          '<span class="hms-item-name">' + it.name + '</span>' +
          (wearing ? '<span class="hms-tag hms-wearing">穿戴中</span>'
                   : '<span class="hms-tag">收於行囊</span>') +
          '</div><button class="hms-btn' + (wearing ? ' hms-on' : '') +
          '" data-hms-wear="' + it.id + '">' + (wearing ? '卸下' : '穿戴') + '</button></div>';
      }
    }
    h += '</div>';
    container.innerHTML = h;
    if (!container._hmsWearBound) {
      container._hmsWearBound = true;
      container.addEventListener('click', function (e) {
        var t = e.target.closest ? e.target.closest('[data-hms-wear]') : null;
        if (!t) return;
        toggleWear(t.getAttribute('data-hms-wear'));
        renderBag(container);
      });
    }
  }

  // ── 初始化 ────────────────────────────────────────────────
  window.addEventListener('hmjs:ready', function () {
    bus = window.HMJSBus;
    if (!bus) return;
    injectStyle();
    loadState();
    applyMount(); // 依 hmjs_outfit 還原坐騎倍率與小圖示

    bus.on('tick', onTick);

    bus.addDecor('shop', 'assets/img/deco_shop.png', 760, 1240, {
      w: 150, onClick: openShop,
    });

    bus.registerTab('行囊', renderBag);

    // 離頁前把未落盤的腳程存起來
    window.addEventListener('pagehide', function () {
      if (unsaved > 0) saveDistance();
    });
  });
})();
