// js/meta/legacy.js — 傳承碼：免註冊的進度匯出／匯入（跨裝置搬家）
// 依 docs/meta-integration-spec.md：純靜態、localStorage 走 hmjs_ 前綴、
// 樣式自我注入（class 前綴 hml-）、初始化掛 hmjs:ready。
(function () {
  'use strict';

  var bus = null;

  // ── UTF-8 安全 base64 ─────────────────────────────────────
  function encode(obj) {
    var json = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json)));
  }
  function decode(code) {
    var json = decodeURIComponent(escape(atob(String(code).trim())));
    return JSON.parse(json);
  }

  // ── 進度打包／還原 ────────────────────────────────────────
  function packState() {
    var data = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf('hmjs_') === 0) data[key] = localStorage.getItem(key);
    }
    return { v: 1, t: Date.now(), data: data };
  }

  // 回傳 {ok, payload|msg}；只驗證、不寫入
  function parseCode(code) {
    var payload;
    try { payload = decode(code); } catch (e) {
      return { ok: false, msg: '這段傳承碼讀不出來，請確認有完整貼上' };
    }
    if (!payload || payload.v !== 1 || typeof payload.data !== 'object' || !payload.data) {
      return { ok: false, msg: '傳承碼格式不對，可能不是本站產生的' };
    }
    var keys = Object.keys(payload.data);
    if (!keys.length) return { ok: false, msg: '傳承碼裡沒有任何進度' };
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf('hmjs_') !== 0 || typeof payload.data[keys[i]] !== 'string') {
        return { ok: false, msg: '傳承碼內容不合法，已拒絕匯入' };
      }
    }
    return { ok: true, payload: payload };
  }

  function applyState(payload) {
    var keys = Object.keys(payload.data);
    for (var i = 0; i < keys.length; i++) {
      try { localStorage.setItem(keys[i], payload.data[keys[i]]); } catch (e) {}
    }
  }

  function dateStamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
  }

  // ── 樣式 ─────────────────────────────────────────────────
  function injectStyle() {
    if (document.getElementById('hml-legacy-style')) return;
    var css = '' +
      '.hml-sec { margin: 12px 0 6px; color: #6b3226; font-size: 17px;' +
      '  letter-spacing: 3px; border-bottom: 1px solid #d9cfae; padding-bottom: 4px; }' +
      '.hml-note { color: #4a463d; line-height: 1.8; margin: 6px 0; }' +
      '.hml-warn { font-size: 13px; color: #a03a26; margin: 4px 0 8px; }' +
      '.hml-ta { width: 100%; box-sizing: border-box; min-height: 96px; font-size: 12px;' +
      '  font-family: ui-monospace, Menlo, monospace; background: #fffdf6;' +
      '  border: 1px solid #d9cfae; border-radius: 8px; padding: 8px; color: #2e2a24;' +
      '  word-break: break-all; resize: vertical; }' +
      '.hml-row { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 4px; }' +
      '.hml-btn { font: inherit; font-size: 14px; padding: 5px 14px; cursor: pointer;' +
      '  border: 1.5px solid #6b3226; border-radius: 6px; background: rgba(245,239,226,.9);' +
      '  color: #6b3226; letter-spacing: 2px; white-space: nowrap; }' +
      '.hml-btn:hover { background: #6b3226; color: #f7f1e3; }' +
      '.hml-btn.hml-danger { border-color: #a03a26; color: #a03a26; }' +
      '.hml-btn.hml-danger:hover { background: #a03a26; color: #f7f1e3; }';
    var el = document.createElement('style');
    el.id = 'hml-legacy-style';
    el.textContent = css;
    document.head.appendChild(el);
  }

  // ── 分頁 ─────────────────────────────────────────────────
  function renderLegacy(container) {
    injectStyle();
    container.innerHTML =
      '<div class="hml-note">將這段修行傳給另一台裝置：在這裡產生「傳承碼」，' +
      '到新裝置的同一分頁貼上，文氣、腳程、行囊與手記便一併過去。</div>' +
      '<div class="hml-sec">傳出</div>' +
      '<textarea class="hml-ta" data-role="out" readonly placeholder="按下方「產生傳承碼」"></textarea>' +
      '<div class="hml-row">' +
      '<button type="button" class="hml-btn" data-act="gen">產生傳承碼</button>' +
      '<button type="button" class="hml-btn" data-act="copy">複製傳承碼</button>' +
      '<button type="button" class="hml-btn" data-act="dl">下載成檔案</button>' +
      '</div>' +
      '<div class="hml-sec">傳入</div>' +
      '<div class="hml-warn">匯入會覆蓋此裝置目前的進度</div>' +
      '<textarea class="hml-ta" data-role="in" placeholder="把另一台裝置的傳承碼貼在這裡"></textarea>' +
      '<div class="hml-row">' +
      '<button type="button" class="hml-btn" data-act="import">匯入</button>' +
      '</div>';

    var outTa = container.querySelector('[data-role="out"]');
    var inTa = container.querySelector('[data-role="in"]');
    var importBtn = container.querySelector('[data-act="import"]');
    var armed = null; // 兩段式確認：暫存已驗證的 payload

    function disarm() {
      armed = null;
      importBtn.textContent = '匯入';
      importBtn.classList.remove('hml-danger');
    }

    container.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-act]') : null;
      if (!t) return;
      var act = t.getAttribute('data-act');

      if (act === 'gen') {
        outTa.value = encode(packState());
        bus.toast('傳承碼已產生');
      } else if (act === 'copy') {
        if (!outTa.value) outTa.value = encode(packState());
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(outTa.value).then(function () {
            bus.toast('傳承碼已複製，拿去新裝置貼上吧');
          }, function () {
            outTa.select();
            bus.toast('自動複製失敗，請手動全選複製');
          });
        } else {
          outTa.select();
          bus.toast('請手動複製選取的內容');
        }
      } else if (act === 'dl') {
        if (!outTa.value) outTa.value = encode(packState());
        var blob = new Blob([outTa.value], { type: 'text/plain;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'hanmo-legacy-' + dateStamp() + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
        bus.toast('傳承檔已開始下載');
      } else if (act === 'import') {
        if (!armed) {
          var res = parseCode(inTa.value);
          if (!res.ok) { bus.toast(res.msg); return; }
          armed = res.payload;
          importBtn.textContent = '確定覆蓋本機進度？再按一次確認';
          importBtn.classList.add('hml-danger');
        } else {
          applyState(armed);
          disarm();
          bus.toast('傳承完成，重新載入中');
          setTimeout(function () { location.reload(); }, 900);
        }
      }
    });

    // 改動輸入框就解除待確認狀態，避免貼了新碼卻套用舊 payload
    inTa.addEventListener('input', disarm);
  }

  // ── 初始化 ────────────────────────────────────────────────
  window.addEventListener('hmjs:ready', function () {
    bus = window.HMJSBus;
    if (!bus) return;
    bus.registerTab('傳承', renderLegacy);
  });
})();
