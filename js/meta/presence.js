// js/meta/presence.js — 匿名到訪統計（目前在線／今日／累計；D1 共用庫 hmjs_ 前綴）
(function () {
  var css = [
    '#hmp-toggle{position:fixed;left:14px;bottom:14px;z-index:60;width:40px;height:40px;',
    'border-radius:50%;border:1.5px solid #6b3226;background:rgba(245,239,226,.92);',
    'color:#6b3226;font:700 15px/1 "Noto Serif TC","PingFang TC",serif;cursor:pointer;',
    'box-shadow:0 2px 10px rgba(30,25,15,.25)}',
    '#hmp-card{position:fixed;left:14px;bottom:62px;z-index:60;background:#f7f1e3;',
    'border:1px solid #c9bfa5;border-radius:10px;padding:12px 16px 8px;',
    'box-shadow:0 8px 26px rgba(30,25,15,.3);font-family:"Noto Serif TC","PingFang TC",serif}',
    '#hmp-card[hidden]{display:none}',
    '#hmp-card .hmp-row{display:flex;gap:16px;text-align:center}',
    '#hmp-card .hmp-row p{margin:0}',
    '#hmp-card strong{display:block;font-size:20px;color:#6b3226}',
    '#hmp-card span{font-size:12px;color:#4a463d;letter-spacing:1px}',
    '#hmp-card small{display:block;margin-top:6px;font-size:10px;color:#8a8272;text-align:center}',
  ].join('');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var card = document.createElement('div');
  card.id = 'hmp-card'; card.hidden = true;
  card.innerHTML = '<div class="hmp-row">' +
    '<p><strong data-hmp="online">—</strong><span>目前在線</span></p>' +
    '<p><strong data-hmp="today">—</strong><span>今日到訪</span></p>' +
    '<p><strong data-hmp="total">—</strong><span>累計到訪</span></p></div>' +
    '<small>匿名統計・自 2026/8/2 起</small>';
  var btn = document.createElement('button');
  btn.id = 'hmp-toggle'; btn.type = 'button'; btn.textContent = '硯';
  btn.title = '展開到訪統計'; btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', function () {
    card.hidden = !card.hidden;
    btn.textContent = card.hidden ? '硯' : '×';
    btn.setAttribute('aria-expanded', String(!card.hidden));
  });
  document.body.appendChild(card); document.body.appendChild(btn);

  var host = location.hostname;
  var local = host === 'hanmo-jiangshan.pages.dev' ||
    /\.hanmo-jiangshan\.pages\.dev$/.test(host) ||
    host === 'localhost' || host === '127.0.0.1';
  var endpoint = local ? '/api/presence'
    : 'https://hanmo-jiangshan.pages.dev/api/presence';

  var key = 'hmjs_presence_session', sid = null;
  try { sid = sessionStorage.getItem(key); } catch (e) {}
  if (!sid) {
    sid = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'visit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 14);
    try { sessionStorage.setItem(key, sid); } catch (e) {}
  }

  var pending = false, lastAt = 0;
  var fmt = new Intl.NumberFormat('zh-TW');
  function update() {
    if (pending || document.hidden) return;
    pending = true; lastAt = Date.now();
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sid }),
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.ok) return;
        ['online', 'today', 'total'].forEach(function (k) {
          var el = card.querySelector('[data-hmp="' + k + '"]');
          if (el) el.textContent = fmt.format(d[k]);
        });
      })
      .catch(function () {})
      .finally(function () { pending = false; });
  }
  update();
  setInterval(update, 2 * 60 * 1000);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && Date.now() - lastAt > 60000) update();
  });
})();
