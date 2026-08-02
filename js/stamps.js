// js/stamps.js — 到訪印章（localStorage 防禦式）＋遊歷圖＋集滿彩蛋
(function () {
  const KEY = 'hmjs_visited';
  let cache = [];
  function load() {
    try { cache = JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { cache = []; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {} }

  function renderAtlas() {
    const el = document.getElementById('atlas');
    const rows = window.HMJS_SITES.map((s) => {
      const hit = cache.includes(s.id);
      return `<li class="${hit ? 'stamped' : ''}">${hit ? '印' : '○'} ${s.mountain}．${s.siteName}</li>`;
    }).join('');
    const full = cache.length >= window.HMJS_SITES.length;
    el.innerHTML = `<div class="panel"><h2>遊歷圖（${cache.length}／${window.HMJS_SITES.length}）</h2>
      <ul class="atlas-list">${rows}</ul>
      ${full ? `<blockquote class="egg">十景遊遍——<br>「翰墨為山手自攀，江山何處不書關；<br>少年若解勤為徑，踏破雲峰亦等閒。」</blockquote>` : ''}
      <button class="enter-btn" type="button" id="atlas-close">收起</button></div>`;
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
    },
    visited() { return cache.slice(); },
  };
})();
