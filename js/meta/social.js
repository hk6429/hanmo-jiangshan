// js/meta/social.js — 社交模組：小書生札記＋金榜名帖/家長遊歷帖＋師命遊學帖
// 依 docs/meta-integration-spec.md（social 系統）。純靜態、localStorage 全走 hmjs_ 前綴。
(function () {
  'use strict';

  var Bus = null;          // window.HMJSBus，hmjs:ready 後取得
  var lastRank = null;     // 最近一次 'rank' 事件 {level, name}

  /* ===================== 共用工具 ===================== */

  function sites() { return window.HMJS_SITES || []; }

  function siteById(id) {
    var list = sites();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function esc(t) {
    var d = document.createElement('div');
    d.textContent = String(t == null ? '' : t);
    return d.innerHTML;
  }

  function load(key, def) {
    try { var v = Bus.load(key); return (v === null || v === undefined) ? def : v; }
    catch (e) { return def; }
  }
  function save(key, val) {
    try { Bus.save(key, val); } catch (e) { /* 靜默降級 */ }
  }

  // 功名稱號（印章數衍生；有 rank 事件則以事件為準）
  function rankName() {
    if (lastRank && lastRank.name) return lastRank.name;
    var n = (load('hmjs_visited', []) || []).length;
    if (n >= 10) return '狀元';
    if (n >= 8) return '貢士';
    if (n >= 5) return '舉人';
    if (n >= 3) return '秀才';
    if (n >= 1) return '童生';
    return '白身';
  }

  function stampCount() { return (load('hmjs_visited', []) || []).length; }

  function verseCount() {
    var v = load('hmjs_verses', {}) || {};
    var total = 0;
    for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) total += (+v[k] || 0);
    return total;
  }

  /* ===================== 樣式注入 ===================== */

  function injectStyle() {
    if (document.getElementById('hmso-style')) return;
    var css = [
      '.hmso-note{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:45;',
      '  width:min(420px,calc(100vw - 32px));background:#f7f1e3;border:1px solid #c9bfa5;',
      '  border-radius:8px;box-shadow:0 8px 30px rgba(30,25,15,.35);padding:14px 16px;',
      '  animation:hmso-rise .25s ease-out;}',
      '@keyframes hmso-rise{from{opacity:0;transform:translate(-50%,14px);}to{opacity:1;transform:translate(-50%,0);}}',
      '.hmso-note p{font-size:14px;color:#4a463d;margin-bottom:8px;}',
      '.hmso-note input{width:100%;font:inherit;font-size:15px;padding:6px 10px;',
      '  border:1px solid #c9bfa5;border-radius:6px;background:#fffdf6;color:#2e2a24;}',
      '.hmso-note .hmso-row{display:flex;gap:8px;justify-content:flex-end;margin-top:10px;}',
      '.hmso-btn{font:inherit;font-size:14px;padding:6px 18px;border-radius:6px;cursor:pointer;',
      '  border:1.5px solid #6b3226;background:#6b3226;color:#f7f1e3;letter-spacing:2px;}',
      '.hmso-btn.hmso-ghost{background:rgba(245,239,226,.9);color:#6b3226;}',
      '.hmso-list{list-style:none;margin:10px 0;}',
      '.hmso-list li{display:flex;gap:10px;align-items:baseline;padding:8px 4px;',
      '  border-bottom:1px dashed #d9cfae;line-height:1.7;font-size:14px;color:#2e2a24;}',
      '.hmso-list .hmso-date{color:#8a5a2b;white-space:nowrap;font-size:13px;}',
      '.hmso-list .hmso-mt{color:#6b3226;white-space:nowrap;font-weight:700;}',
      '.hmso-list .hmso-txt{flex:1;}',
      '.hmso-del{font:inherit;font-size:12px;border:none;background:none;color:#a03a26;cursor:pointer;}',
      '.hmso-empty{color:#8a8271;font-size:14px;padding:14px 4px;line-height:1.8;}',
      '.hmso-sec{margin:14px 0;padding:12px 14px;background:#fffdf6;border:1px solid #d9cfae;border-radius:8px;}',
      '.hmso-sec h3{color:#6b3226;font-size:16px;margin-bottom:8px;letter-spacing:2px;}',
      '.hmso-sec p{font-size:13px;color:#4a463d;line-height:1.8;}',
      '.hmso-checks{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:4px 10px;margin:8px 0;}',
      '.hmso-checks label{font-size:14px;color:#2e2a24;cursor:pointer;line-height:1.9;}',
      '.hmso-checks input{margin-right:4px;}',
      '.hmso-due{font:inherit;font-size:14px;padding:4px 8px;border:1px solid #c9bfa5;border-radius:6px;',
      '  background:#fffdf6;color:#2e2a24;margin:0 6px 0 2px;}',
      '.hmso-linkbox{display:flex;gap:8px;margin-top:10px;}',
      '.hmso-linkbox input{flex:1;font-size:12px;padding:6px 8px;border:1px solid #c9bfa5;',
      '  border-radius:6px;background:#fffdf6;color:#4a463d;}',
      '.hmso-prog{font-size:14px;color:#2e2a24;line-height:2;}',
      '.hmso-prog .hmso-done{color:#a03a26;font-weight:700;}',
      '.hmso-expired{color:#8a5a2b;font-size:13px;}',
      '.hmso-canvas-wrap{text-align:center;margin-top:10px;}',
      '.hmso-canvas-wrap canvas{max-width:100%;height:auto;border:1px solid #c9bfa5;border-radius:6px;}',
      '.hmso-flag{animation:hmso-flutter 2.4s ease-in-out infinite;transform-origin:bottom center;}',
      '@keyframes hmso-flutter{0%,100%{transform:rotate(-3deg) translateY(0);}50%{transform:rotate(3deg) translateY(-3px);}}'
    ].join('\n');
    var style = document.createElement('style');
    style.id = 'hmso-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ===================== 一、小書生札記 ===================== */

  var NOTE_MAX = 200;
  var NOTE_QI_PER_DAY = 3;
  var noteBox = null;
  var noteTimer = null;

  function closeNoteBox() {
    if (noteTimer) { clearTimeout(noteTimer); noteTimer = null; }
    if (noteBox && noteBox.parentNode) noteBox.parentNode.removeChild(noteBox);
    noteBox = null;
  }

  function armNoteTimer() {
    if (noteTimer) clearTimeout(noteTimer);
    noteTimer = setTimeout(closeNoteBox, 8000);
  }

  function saveNote(mountain, text) {
    var t = String(text || '').trim();
    if (!t) return;
    var notes = load('hmjs_notes', []) || [];
    notes.push({ date: Bus.today(), mountain: mountain, text: t.slice(0, 60) });
    while (notes.length > NOTE_MAX) notes.shift();
    save('hmjs_notes', notes);
    // 文氣：每日最多 3 次入帳
    var day = Bus.today();
    var log = load('hmjs_notes_qi', {}) || {};
    if ((+log[day] || 0) < NOTE_QI_PER_DAY) {
      log[day] = (+log[day] || 0) + 1;
      save('hmjs_notes_qi', log);
      try { Bus.qi(3, '小書生札記'); } catch (e) {}
      try { Bus.toast('已記入札記，文氣＋3'); } catch (e) {}
    } else {
      try { Bus.toast('已記入札記'); } catch (e) {}
    }
  }

  function showNotePrompt(site) {
    if (!site) return;
    closeNoteBox();
    noteBox = document.createElement('div');
    noteBox.className = 'hmso-note';
    noteBox.innerHTML =
      '<p>剛從' + esc(site.mountain) + '回來——這一站學到／想記下一句話？</p>' +
      '<input type="text" maxlength="60" placeholder="寫下一句話…（可略過）">' +
      '<div class="hmso-row">' +
      '<button type="button" class="hmso-btn hmso-ghost" data-act="skip">略過</button>' +
      '<button type="button" class="hmso-btn" data-act="ok">記下</button>' +
      '</div>';
    document.body.appendChild(noteBox);
    var input = noteBox.querySelector('input');
    var submit = function () { saveNote(site.mountain, input.value); closeNoteBox(); };
    noteBox.querySelector('[data-act="ok"]').addEventListener('click', submit);
    noteBox.querySelector('[data-act="skip"]').addEventListener('click', closeNoteBox);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
      armNoteTimer();
    });
    input.addEventListener('input', armNoteTimer);
    input.addEventListener('focus', armNoteTimer);
    noteBox.addEventListener('pointerdown', function (e) { e.stopPropagation(); armNoteTimer(); });
    armNoteTimer();
  }

  function renderNotesTab(container) {
    if (!container) return;
    var notes = load('hmjs_notes', []) || [];
    if (!notes.length) {
      container.innerHTML = '<p class="hmso-empty">還沒有札記。入山遊歷歸來時，小書生會請你寫下一句話。</p>';
      return;
    }
    var rows = [];
    for (var i = notes.length - 1; i >= 0; i--) {
      var n = notes[i];
      rows.push(
        '<li><span class="hmso-date">' + esc(n.date) + '</span>' +
        '<span class="hmso-mt">' + esc(n.mountain) + '</span>' +
        '<span class="hmso-txt">' + esc(n.text) + '</span>' +
        '<button type="button" class="hmso-del" data-i="' + i + '">刪除</button></li>'
      );
    }
    container.innerHTML = '<ul class="hmso-list">' + rows.join('') + '</ul>';
    container.querySelectorAll('.hmso-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = +btn.getAttribute('data-i');
        var cur = load('hmjs_notes', []) || [];
        if (idx >= 0 && idx < cur.length) {
          cur.splice(idx, 1);
          save('hmjs_notes', cur);
        }
        renderNotesTab(container);
      });
    });
  }

  /* ===================== 二、金榜名帖／家長遊歷帖（canvas） ===================== */

  var CARD_W = 1080, CARD_H = 1528;

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // 逐字換行（中文為主，不靠空白斷詞）
  function wrapText(ctx, text, x, y, maxW, lineH, maxLines) {
    var line = '', lines = 0;
    for (var i = 0; i < text.length; i++) {
      var test = line + text[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y);
        y += lineH;
        lines++;
        line = text[i];
        if (maxLines && lines >= maxLines - 1) {
          // 最後一行截斷加省略
          var rest = text.slice(i);
          while (ctx.measureText(rest + '…').width > maxW && rest.length) rest = rest.slice(0, -1);
          ctx.fillText(rest + (i + rest.length < text.length ? '…' : ''), x, y);
          return y + lineH;
        }
      } else {
        line = test;
      }
    }
    if (line) { ctx.fillText(line, x, y); y += lineH; }
    return y;
  }

  // 共通底：宣紙底＋深褐雙框＋橫題＋日期落款＋右下大紅方印
  function drawCardBase(ctx, title) {
    ctx.fillStyle = '#f7f1e3';
    ctx.fillRect(0, 0, CARD_W, CARD_H);
    // 淡淡宣紙紋（斜向細線）
    ctx.save();
    ctx.strokeStyle = 'rgba(107,50,38,0.04)';
    ctx.lineWidth = 1;
    for (var i = -CARD_H; i < CARD_W; i += 26) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + CARD_H, CARD_H);
      ctx.stroke();
    }
    ctx.restore();
    // 外框＋內框
    ctx.strokeStyle = '#6b3226';
    ctx.lineWidth = 10;
    ctx.strokeRect(36, 36, CARD_W - 72, CARD_H - 72);
    ctx.lineWidth = 2;
    ctx.strokeRect(58, 58, CARD_W - 116, CARD_H - 116);
    // 頂部橫題
    ctx.fillStyle = '#2e2a24';
    ctx.font = 'bold 66px "Noto Serif TC", "PingFang TC", serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, CARD_W / 2, 158);
    // 題下細飾線
    ctx.strokeStyle = '#a03a26';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(CARD_W / 2 - 250, 190);
    ctx.lineTo(CARD_W / 2 + 250, 190);
    ctx.stroke();
    // 日期落款（左下）
    ctx.fillStyle = '#6b3226';
    ctx.font = '30px "Noto Serif TC", "PingFang TC", serif';
    ctx.textAlign = 'left';
    ctx.fillText('翰墨江山 · ' + Bus.today() + ' 立帖', 90, CARD_H - 100);
    // 右下大紅方印
    ctx.fillStyle = '#a03a26';
    roundRect(ctx, CARD_W - 240, CARD_H - 250, 150, 150, 16);
    ctx.fill();
    ctx.fillStyle = '#f7f1e3';
    ctx.font = 'bold 56px "Noto Serif TC", "PingFang TC", serif';
    ctx.textAlign = 'center';
    ctx.fillText('翰', CARD_W - 165, CARD_H - 185);
    ctx.fillText('墨', CARD_W - 165, CARD_H - 122);
    ctx.textAlign = 'left';
  }

  // 印章列：10 個小圓，已得上紅
  function drawStampRow(ctx, x, y, got) {
    var r = 20, gap = 56;
    for (var i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.arc(x + i * gap, y, r, 0, Math.PI * 2);
      if (i < got) {
        ctx.fillStyle = '#a03a26';
        ctx.fill();
      } else {
        ctx.strokeStyle = '#c9bfa5';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }

  function labelValue(ctx, label, value, x, y) {
    ctx.fillStyle = '#6b3226';
    ctx.font = 'bold 34px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillText(label, x, y);
    ctx.fillStyle = '#2e2a24';
    ctx.font = '34px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillText(value, x + ctx.measureText(label).width + 130, y);
  }

  // 穿戴中的坐騎＋配飾名稱（名稱表由 shop.js 掛在 window.HMJS_GEAR_NAMES）
  function gearText() {
    var names = window.HMJS_GEAR_NAMES || {};
    var o = load('hmjs_outfit', null);
    if (!o || typeof o !== 'object') return '';
    var ids = [];
    if (o.mount) ids.push(o.mount);
    if (Array.isArray(o.acc)) ids = ids.concat(o.acc);
    var out = [];
    for (var i = 0; i < ids.length; i++) if (names[ids[i]]) out.push(names[ids[i]]);
    return out.join('・');
  }

  function getNickname() {
    var nick = load('hmjs_nickname', '');
    if (!nick) {
      var input = null;
      try { input = window.prompt('請問小書生尊姓大名？（會寫在名帖上）'); } catch (e) {}
      nick = String(input || '').trim().slice(0, 12) || '小書生';
      save('hmjs_nickname', nick);
    }
    return nick;
  }

  function drawStudentCard() {
    var canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    var ctx = canvas.getContext('2d');
    drawCardBase(ctx, '翰墨江山遊歷帖');

    var nick = getNickname();
    var x = 110, y = 300;

    // 暱稱＋功名
    ctx.fillStyle = '#2e2a24';
    ctx.font = 'bold 58px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillText(nick, x, y);
    ctx.fillStyle = '#a03a26';
    ctx.font = 'bold 44px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillText('功名：' + rankName(), x, y + 76);

    // 印章列
    y += 190;
    ctx.fillStyle = '#6b3226';
    ctx.font = 'bold 34px "Noto Serif TC", "PingFang TC", serif';
    var got = stampCount();
    ctx.fillText('遊歷印章　' + got + ' / 10', x, y);
    drawStampRow(ctx, x + 30, y + 66, got);

    // 文氣／集句
    y += 190;
    var qiTotal = 0;
    try { qiTotal = +Bus.getQi() || 0; } catch (e) {}
    labelValue(ctx, '文氣值', String(qiTotal), x, y);
    labelValue(ctx, '集句數', String(verseCount()) + ' 聯', x, y + 66);
    var gear = gearText();
    if (gear) labelValue(ctx, '隨身行頭', gear, x, y + 132);

    // 最近三則札記
    y += 190;
    ctx.fillStyle = '#6b3226';
    ctx.font = 'bold 34px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillText('遊歷手記', x, y);
    ctx.strokeStyle = '#c9bfa5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 20);
    ctx.lineTo(CARD_W - 110, y + 20);
    ctx.stroke();
    y += 80;
    var notes = load('hmjs_notes', []) || [];
    var recent = notes.slice(-3).reverse();
    ctx.font = '30px "Noto Serif TC", "PingFang TC", serif';
    if (!recent.length) {
      ctx.fillStyle = '#8a8271';
      ctx.fillText('（尚無札記——下山歸來時記一句吧）', x, y);
    } else {
      for (var i = 0; i < recent.length; i++) {
        ctx.fillStyle = '#8a5a2b';
        ctx.fillText(recent[i].date + '　' + recent[i].mountain, x, y);
        y += 48;
        ctx.fillStyle = '#2e2a24';
        y = wrapText(ctx, '「' + recent[i].text + '」', x + 24, y, CARD_W - 260, 46, 2);
        y += 22;
      }
    }
    return canvas;
  }

  function drawParentCard() {
    var canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    var ctx = canvas.getContext('2d');
    drawCardBase(ctx, '翰墨江山遊歷帖');

    var nick = load('hmjs_nickname', '') || '小書生';
    var x = 110, y = 290;

    ctx.fillStyle = '#6b3226';
    ctx.font = 'bold 40px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillText('致家長：' + nick + ' 的遊歷近況', x, y);

    // 摘要
    y += 90;
    var got = stampCount();
    var qiTotal = 0;
    try { qiTotal = +Bus.getQi() || 0; } catch (e) {}
    labelValue(ctx, '功名稱號', rankName(), x, y);
    labelValue(ctx, '遊歷印章', got + ' / 10', x, y + 62);
    labelValue(ctx, '文氣值', String(qiTotal), x, y + 124);
    labelValue(ctx, '集句數', verseCount() + ' 聯', x, y + 186);
    drawStampRow(ctx, x + 30, y + 268, got);

    // 固定說明區
    y += 360;
    ctx.fillStyle = '#fffdf6';
    roundRect(ctx, x - 20, y - 40, CARD_W - 180, 240, 14);
    ctx.fill();
    ctx.strokeStyle = '#d9cfae';
    ctx.lineWidth = 2;
    roundRect(ctx, x - 20, y - 40, CARD_W - 180, 240, 14);
    ctx.stroke();
    ctx.fillStyle = '#6b3226';
    ctx.font = 'bold 34px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillText('給家長的話', x, y + 10);
    ctx.fillStyle = '#4a463d';
    ctx.font = '30px "Noto Serif TC", "PingFang TC", serif';
    wrapText(ctx,
      '本站無儲值、無排名、無廣告，孩子的「功名」來自實際走訪各學習站——每一枚印章，都是一次真實的練功。',
      x, y + 66, CARD_W - 250, 48, 3);

    // 陪伴提問三句
    y += 290;
    ctx.fillStyle = '#6b3226';
    ctx.font = 'bold 34px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillText('今晚可以這樣陪孩子聊', x, y);
    var qs = [
      '「今天你去了哪座山？」',
      '「山神御題考了什麼？」',
      '「哪句集句你最喜歡？」'
    ];
    ctx.fillStyle = '#2e2a24';
    ctx.font = '32px "Noto Serif TC", "PingFang TC", serif';
    for (var i = 0; i < qs.length; i++) {
      ctx.fillText('・' + qs[i], x + 10, y + 62 + i * 58);
    }
    return canvas;
  }

  function downloadCanvas(canvas, filename) {
    try {
      var a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      try { Bus.toast('名帖已產生，開始下載'); } catch (e) {}
    } catch (e) {
      try { Bus.toast('下載失敗，請再試一次'); } catch (e2) {}
    }
  }

  function renderCardTab(container) {
    if (!container) return;
    container.innerHTML =
      '<div class="hmso-sec"><h3>金榜名帖</h3>' +
      '<p>把遊歷成果做成一張直式名帖 PNG——學生版記功名與手記，家長版附陪伴提問，' +
      '可以下載留存或分享。</p>' +
      '<div class="hmso-row" style="justify-content:flex-start;margin-top:10px;display:flex;gap:10px;">' +
      '<button type="button" class="hmso-btn" data-act="student">產生我的名帖</button>' +
      '<button type="button" class="hmso-btn hmso-ghost" data-act="parent">產生家長帖</button>' +
      '</div><div class="hmso-canvas-wrap" data-role="preview"></div></div>';
    var preview = container.querySelector('[data-role="preview"]');
    function show(canvas, filename) {
      preview.innerHTML = '';
      preview.appendChild(canvas);
      downloadCanvas(canvas, filename);
    }
    container.querySelector('[data-act="student"]').addEventListener('click', function () {
      show(drawStudentCard(), '翰墨江山-金榜名帖.png');
    });
    container.querySelector('[data-act="parent"]').addEventListener('click', function () {
      show(drawParentCard(), '翰墨江山-家長遊歷帖.png');
    });
  }

  /* ===================== 三、師命遊學帖 ===================== */

  function encodeQuest(obj) {
    var json = JSON.stringify(obj);
    return encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
  }
  function decodeQuest(code) {
    // URLSearchParams 已做過一次 percent-decode，這裡直接 atob
    return JSON.parse(decodeURIComponent(escape(atob(code))));
  }

  function getBanner() { return load('hmjs_banners', null); }
  function setBanner(b) { save('hmjs_banners', b); }

  function parseQuestParam() {
    var code = null;
    try { code = new URLSearchParams(location.search).get('quest'); } catch (e) {}
    if (!code) return;
    var data = null;
    try { data = decodeQuest(code); } catch (e) { return; } // 壞碼靜默忽略
    if (!data || !Array.isArray(data.m) || !data.m.length) return;
    var ids = data.m.filter(function (id) { return !!siteById(id); });
    if (!ids.length) return;
    var cur = getBanner();
    if (cur && cur.code === code) return; // 同一份帖，保留既有進度
    setBanner({ code: code, m: ids, due: String(data.due || ''), done: [] });
    try { Bus.toast('收到師命遊學帖！共 ' + ids.length + ' 座山待遊歷'); } catch (e) {}
  }

  function bannerExpired(b) {
    return !!(b && b.due && Bus.today() > b.due);
  }
  function bannerComplete(b) {
    return !!(b && b.done && b.done.length >= b.m.length);
  }

  function plantFlags() {
    var b = getBanner();
    if (!b || bannerComplete(b)) return;
    for (var i = 0; i < b.m.length; i++) {
      if (b.done.indexOf(b.m[i]) !== -1) continue;
      var site = siteById(b.m[i]);
      if (!site) continue;
      try {
        var el = Bus.addDecor('hmso-flag-' + site.id,
          'assets/img/deco_flag.png', site.x - 70, site.y - 40, { w: 60 });
        if (el && el.classList) el.classList.add('hmso-flag');
      } catch (e) { /* 裝飾失敗不影響遊玩 */ }
    }
  }

  function drawDiplomaCard(banner) {
    var canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    var ctx = canvas.getContext('2d');
    drawCardBase(ctx, '遊學結業帖');

    var x = 110, y = 320;
    var names = banner.m.map(function (id) {
      var s = siteById(id);
      return s ? s.mountain : id;
    });

    ctx.fillStyle = '#2e2a24';
    ctx.font = 'bold 48px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillText('奉師命遊歷' + numToHan(names.length) + '山，如期而成', x, y);

    ctx.strokeStyle = '#a03a26';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 30);
    ctx.lineTo(CARD_W - 110, y + 30);
    ctx.stroke();

    y += 110;
    ctx.fillStyle = '#6b3226';
    ctx.font = 'bold 34px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillText('遊歷諸山', x, y);
    ctx.fillStyle = '#2e2a24';
    ctx.font = '36px "Noto Serif TC", "PingFang TC", serif';
    y += 66;
    y = wrapText(ctx, names.join('　'), x + 10, y, CARD_W - 240, 58, 6);

    y += 60;
    var nick = load('hmjs_nickname', '') || '小書生';
    ctx.fillStyle = '#6b3226';
    ctx.font = '34px "Noto Serif TC", "PingFang TC", serif';
    ctx.fillText('遊學者：' + nick + '（' + rankName() + '）', x, y);
    if (banner.due) ctx.fillText('師命之期：' + banner.due, x, y + 58);

    y += 160;
    ctx.fillStyle = '#4a463d';
    ctx.font = '30px "Noto Serif TC", "PingFang TC", serif';
    wrapText(ctx, '山不在高，有仙則名；學不在多，日進則靈。願持此帖，再上層樓。',
      x, y, CARD_W - 240, 50, 3);
    return canvas;
  }

  function numToHan(n) {
    var han = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    return (n >= 0 && n <= 10) ? han[n] : String(n);
  }

  function completeBanner(banner) {
    var doneLog = load('hmjs_banners_done', {}) || {};
    if (doneLog[banner.code]) return; // 依 code 防重複入帳
    doneLog[banner.code] = true;
    save('hmjs_banners_done', doneLog);
    try { Bus.qi(50, '遊學結業'); } catch (e) {}
    var canvas = drawDiplomaCard(banner);
    var p = null;
    try {
      p = Bus.panel('遊學結業',
        '<p style="line-height:1.9;color:#4a463d;">恭喜！奉師命遊歷的' + numToHan(banner.m.length) +
        '座山已全數走訪，文氣＋50。結業帖如下，可下載留念：</p>' +
        '<div class="hmso-canvas-wrap" data-role="diploma"></div>' +
        '<div class="hmso-row" style="display:flex;justify-content:center;margin-top:12px;">' +
        '<button type="button" class="hmso-btn" data-act="dl">下載結業帖</button></div>');
    } catch (e) {}
    if (p && p.body) {
      var wrap = p.body.querySelector('[data-role="diploma"]');
      if (wrap) wrap.appendChild(canvas);
      var dl = p.body.querySelector('[data-act="dl"]');
      if (dl) dl.addEventListener('click', function () {
        downloadCanvas(canvas, '翰墨江山-遊學結業帖.png');
      });
    } else {
      downloadCanvas(canvas, '翰墨江山-遊學結業帖.png');
    }
  }

  function onBackForBanner(site) {
    var b = getBanner();
    if (!b || !site) return;
    if (b.m.indexOf(site.id) === -1) return;
    if (b.done.indexOf(site.id) !== -1) return;
    b.done.push(site.id);
    setBanner(b);
    if (bannerComplete(b)) {
      if (!bannerExpired(b)) {
        completeBanner(b);
      } else {
        try { Bus.toast('帖已過期，仍可繼續遊歷'); } catch (e) {}
      }
    } else {
      var msg = '遊學帖進度 ' + b.done.length + '/' + b.m.length;
      if (bannerExpired(b)) msg += '（帖已過期，仍可繼續遊歷）';
      try { Bus.toast(msg); } catch (e) {}
    }
  }

  function copyText(text, inputEl) {
    var ok = function () { try { Bus.toast('連結已複製'); } catch (e) {} };
    var fallback = function () {
      try {
        inputEl.focus();
        inputEl.select();
        inputEl.setSelectionRange(0, inputEl.value.length);
        try { Bus.toast('已選取連結，請按 Ctrl/Cmd＋C 複製'); } catch (e) {}
      } catch (e) {}
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else {
      fallback();
    }
  }

  function renderQuestTab(container) {
    if (!container) return;
    var list = sites();
    var checks = list.map(function (s) {
      return '<label><input type="checkbox" value="' + esc(s.id) + '">' +
        esc(s.mountain) + '</label>';
    }).join('');

    // 學生端狀態區
    var statusHtml = '';
    var b = getBanner();
    if (b) {
      var rows = b.m.map(function (id) {
        var s = siteById(id);
        var name = s ? s.mountain : id;
        var done = b.done.indexOf(id) !== -1;
        return (done ? '<span class="hmso-done">✔ ' + esc(name) + '</span>' : esc(name));
      }).join('　');
      statusHtml = '<div class="hmso-sec"><h3>我的遊學帖</h3>' +
        '<p class="hmso-prog">' + rows + '</p>' +
        '<p class="hmso-prog">進度 <span class="hmso-done">' + b.done.length + '</span> / ' + b.m.length +
        (b.due ? '　截止：' + esc(b.due) : '') + '</p>' +
        (bannerComplete(b)
          ? '<p class="hmso-prog hmso-done">已結業，帖成！</p>'
          : (bannerExpired(b) ? '<p class="hmso-expired">帖已過期，仍可繼續遊歷。</p>' : '')) +
        '</div>';
    } else {
      statusHtml = '<div class="hmso-sec"><h3>我的遊學帖</h3>' +
        '<p class="hmso-empty">目前沒有進行中的遊學帖。老師給你任務連結後，開啟即會自動掛旗。</p></div>';
    }

    container.innerHTML =
      statusHtml +
      '<div class="hmso-sec"><h3>老師出帖</h3>' +
      '<p>勾選要學生走訪的山，設定截止日，產生任務連結貼給學生。</p>' +
      '<div class="hmso-checks">' + checks + '</div>' +
      '<p>截止日：<input type="date" class="hmso-due" data-role="due">' +
      '<button type="button" class="hmso-btn" data-act="gen" style="margin-left:8px;">產生任務連結</button></p>' +
      '<div class="hmso-linkbox" data-role="linkbox" hidden>' +
      '<input type="text" readonly data-role="link">' +
      '<button type="button" class="hmso-btn hmso-ghost" data-act="copy">複製</button>' +
      '</div></div>';

    var linkbox = container.querySelector('[data-role="linkbox"]');
    var linkInput = container.querySelector('[data-role="link"]');
    container.querySelector('[data-act="gen"]').addEventListener('click', function () {
      var ids = Array.prototype.map.call(
        container.querySelectorAll('.hmso-checks input:checked'),
        function (c) { return c.value; });
      if (!ids.length) {
        try { Bus.toast('請至少勾選一座山'); } catch (e) {}
        return;
      }
      var due = container.querySelector('[data-role="due"]').value || '';
      var code = encodeQuest({ m: ids, due: due });
      linkInput.value = location.origin + location.pathname + '?quest=' + code;
      linkbox.hidden = false;
    });
    container.querySelector('[data-act="copy"]').addEventListener('click', function () {
      if (linkInput.value) copyText(linkInput.value, linkInput);
    });
  }

  /* ===================== 初始化 ===================== */

  window.addEventListener('hmjs:ready', function () {
    Bus = window.HMJSBus;
    if (!Bus) return;
    injectStyle();

    Bus.on('rank', function (p) { lastRank = p || lastRank; });

    // 札記：入山歸來浮出小紙條
    Bus.on('back', function (p) {
      if (!p || !p.site) return;
      onBackForBanner(p.site);
      showNotePrompt(p.site);
    });

    // 遊歷圖分頁
    try { Bus.registerTab('札記', renderNotesTab); } catch (e) {}
    try { Bus.registerTab('名帖', renderCardTab); } catch (e) {}
    try { Bus.registerTab('遊學帖', renderQuestTab); } catch (e) {}

    // 師命遊學帖：解析 ?quest=、插令旗
    parseQuestParam();
    plantFlags();
  });
})();
