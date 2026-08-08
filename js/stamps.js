// js/stamps.js — 到訪印章（localStorage 防禦式）＋遊歷圖＋集滿彩蛋
(function () {
  const KEY = 'hmjs_visited';
  let cache = [];
  function load() {
    try { cache = JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { cache = []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {} }

  function stampsHTML() {
    const rows = window.HMJS_SITES.map((s) => {
      const hit = cache.includes(s.id);
      return `<li class="${hit ? 'stamped' : ''}">${hit ? '印' : '○'} ${s.mountain}．${s.siteName}</li>`;
    }).join('');
    const full = cache.length >= window.HMJS_SITES.length;
    return `<ul class="atlas-list">${rows}</ul>
      ${full ? `<blockquote class="egg">十一景遊遍——<br>「翰墨為山手自攀，江山何處不書關；<br>少年若解勤為徑，踏破雲峰亦等閒。」</blockquote>` : ''}`;
  }

  function renderAtlas() {
    const el = document.getElementById('atlas');
    // 分頁 = 內建「印章」＋各遊戲化模組經 HMJSBus.registerTab 註冊的分頁
    const tabs = [{ label: '印章', render: (box) => { box.innerHTML = stampsHTML(); } }]
      .concat(window.HMJSBus?.tabs || []);
    el.innerHTML = `<div class="panel"><h2>遊歷圖（${cache.length}／${window.HMJS_SITES.length}）</h2>
      <nav id="atlas-tabs"></nav><div id="atlas-body"></div>
      <button class="enter-btn" type="button" id="atlas-close">收起</button></div>`;
    const nav = el.querySelector('#atlas-tabs');
    const body = el.querySelector('#atlas-body');
    tabs.forEach((t, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'atlas-tab'; b.textContent = t.label;
      b.addEventListener('click', () => {
        nav.querySelectorAll('.atlas-tab').forEach((x) => x.classList.remove('on'));
        b.classList.add('on');
        body.innerHTML = '';
        try { t.render(body); } catch (e) { body.textContent = '此頁暫時打不開'; }
      });
      nav.appendChild(b);
      if (i === 0) b.click();
    });
    el.hidden = false;
    document.getElementById('atlas-close').addEventListener('click', () => { el.hidden = true; });
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
  }

  window.HMJSStamps = {
    init() {
      load();
      for (const id of cache)
        document.querySelector(`.landmark[data-id="${id}"]`)?.classList.add('visited');
      document.getElementById('atlas-btn').addEventListener('click', renderAtlas);
    },
    markVisited(id) {
      if (cache.includes(id)) return;
      cache.push(id); save();
      window.HMJSBus?.emit?.('stamp', { id, count: cache.length });
    },
    visited() { return cache.slice(); },
  };
})();
