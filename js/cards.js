// js/cards.js — 宣紙介紹卡（鄰近自動開、點地標直開）＋貢院四卡覆蓋層
(function () {
  const TRIGGER_R = 140;
  let currentId = null;

  function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  function openCard(site) {
    if (currentId === site.id) return;
    currentId = site.id;
    window.HMJSStamps?.markVisited?.(site.id);
    document.querySelector(`.landmark[data-id="${site.id}"]`)?.classList.add('visited');
    const card = document.getElementById('site-card');
    const action = site.isYamen
      ? `<button class="enter-btn" type="button" id="yamen-open">進貢院</button>`
      : `<a class="enter-btn" href="${site.url}" target="_blank" rel="noopener">入山</a>`;
    card.innerHTML = `
      <h2>${esc(site.mountain)}．${esc(site.siteName)}</h2>
      <p class="card-tagline">${esc(site.tagline)}</p>
      <p class="card-stats">${esc(site.stats)}</p>
      <p class="card-aud">適合：${esc(site.audience)}</p>
      ${action}`;
    card.hidden = false;
    document.getElementById('yamen-open')?.addEventListener('click', openYamen);
  }
  function closeCard() {
    currentId = null;
    document.getElementById('site-card').hidden = true;
  }

  function openYamen() {
    const el = document.getElementById('yamen');
    const cards = window.HMJS_EXAMS.map((e) => {
      const m = window.HMJS_SITES.find((s) => s.id === e.mountainId);
      return `<article class="exam-card">
        <h3>${esc(e.name)}</h3>
        <p>${esc(e.intro)}</p>
        <p class="exam-date">${esc(e.dateNote)}</p>
        <p><a href="${e.officialUrl}" target="_blank" rel="noopener">${esc(e.officialName)}</a>
        ｜<a href="${m.url}" target="_blank" rel="noopener">前往${esc(m.mountain)}練功</a></p>
      </article>`;
    }).join('');
    el.innerHTML = `<div class="panel"><h2>貢院．備考資訊</h2>
      <div class="exam-grid">${cards}</div>
      <button class="enter-btn" type="button" id="yamen-close">離開貢院</button></div>`;
    el.hidden = false;
    document.getElementById('yamen-close').addEventListener('click', () => { el.hidden = true; });
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
  }

  window.HMJSCards = {
    init() {
      HMJSMap.onLandmarkClick(openCard);
      HMJSPlayer.onMove((x, y) => {
        const near = HMJSLogic.nearbySite(x, y, window.HMJS_SITES, TRIGGER_R);
        if (near) openCard(near);
        else if (currentId) closeCard();
      });
    },
  };
})();
