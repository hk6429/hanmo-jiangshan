// js/meta/daily.js — 每日系統六件套：每日一山／山神御題／終南籤筒／貢院晨鐘／節氣山河／尋墨日藏
// 依 docs/meta-integration-spec.md；全部經 HMJSBus 掛鉤，資料檔缺失時各子系統靜默跳過。
(function () {
  'use strict';

  // ---------- 共用小工具 ----------
  function esc(t) {
    const d = document.createElement('div');
    d.textContent = String(t == null ? '' : t);
    return d.innerHTML;
  }
  function bus() { return window.HMJSBus; }
  function sites() { return Array.isArray(window.HMJS_SITES) ? window.HMJS_SITES : []; }
  function findSite(id) { return sites().find((s) => s.id === id) || null; }
  function playerPos() {
    try { return window.HMJSPlayer && window.HMJSPlayer.pos ? window.HMJSPlayer.pos() : null; }
    catch (e) { return null; }
  }
  function walkTo(x, y) {
    try { window.HMJSPlayer && window.HMJSPlayer.walkTo && window.HMJSPlayer.walkTo(x, y); }
    catch (e) { /* 靜默 */ }
  }

  // ---------- 樣式注入（class 一律 hmd- 前綴） ----------
  function injectStyle() {
    if (document.getElementById('hmd-style')) return;
    const st = document.createElement('style');
    st.id = 'hmd-style';
    st.textContent = `
/* 每日一山：紅燈籠光暈角標 */
.hmd-lantern { position: absolute; right: -4px; top: -26px; width: 14px; height: 14px;
  border-radius: 50%; background: #c0392b; pointer-events: none; z-index: 6;
  animation: hmd-lantern-breathe 2.2s ease-in-out infinite; }
@keyframes hmd-lantern-breathe {
  0%, 100% { box-shadow: 0 0 6px 2px rgba(192,57,43,.55); opacity: .85; }
  50%      { box-shadow: 0 0 18px 8px rgba(192,57,43,.85); opacity: 1; } }

/* 今日籤詩小卡（HUD 下方） */
.hmd-daily-card { position: fixed; top: 60px; left: 16px; z-index: 20; cursor: pointer;
  width: min(230px, calc(100vw - 32px)); background: #f7f1e3; border: 1.5px solid #c9bfa5;
  border-radius: 8px; padding: 10px 12px; box-shadow: 0 4px 14px rgba(30,25,15,.25);
  font-family: inherit; color: #4a463d; }
.hmd-daily-card .hmd-daily-title { font-size: 13px; color: #6b3226; letter-spacing: 2px; }
.hmd-daily-card .hmd-daily-hint { font-size: 14px; line-height: 1.6; margin-top: 4px; }
.hmd-daily-card.hmd-done { position: fixed; }
.hmd-daily-card.hmd-done::after { content: "已遊"; position: absolute; right: 8px; top: 8px;
  padding: 2px 8px; border: 1.5px solid #b8860b; border-radius: 6px; color: #b8860b;
  font-size: 13px; letter-spacing: 2px; background: rgba(255,250,235,.85); transform: rotate(-8deg);
  text-shadow: 0 0 4px rgba(184,134,11,.4); }
.hmd-daily-card.hmd-done .hmd-daily-hint { opacity: .55; }

/* 山神小試按鈕 */
.hmd-oracle-btn { display: inline-block; margin: 10px 8px 0 0; padding: 7px 18px;
  font: inherit; font-size: 14px; letter-spacing: 2px; cursor: pointer;
  background: #2c5545; color: #f7f1e3; border: none; border-radius: 6px; }
.hmd-oracle-btn:hover { filter: brightness(1.12); }

/* 御題答題面板 */
.hmd-quiz-q { font-size: 17px; line-height: 1.8; color: #2e2a24; margin-bottom: 14px; }
.hmd-quiz-opt { display: block; width: 100%; text-align: left; margin: 8px 0; padding: 10px 14px;
  font: inherit; font-size: 15px; line-height: 1.6; cursor: pointer; border-radius: 6px;
  border: 1px solid #c9bfa5; background: #fffdf6; color: #4a463d; }
.hmd-quiz-opt:hover { border-color: #6b3226; }
.hmd-quiz-opt.hmd-right { border-color: #2c5545; background: #e8f0ea; color: #2c5545; font-weight: 700; }
.hmd-quiz-opt.hmd-wrong { border-color: #a03a26; background: #f6e7e2; color: #a03a26; }
.hmd-quiz-why { margin-top: 12px; padding: 10px 14px; border-left: 4px solid #6b3226;
  background: #fbf7ec; color: #4a463d; line-height: 1.8; font-size: 14px; }
.hmd-frag-row { margin-top: 14px; font-size: 14px; color: #6b3226; letter-spacing: 1px; }
.hmd-scroll-img { display: block; max-width: 220px; width: 60%; margin: 14px auto; }

/* 籤詩 */
.hmd-fortune-text { font-size: 19px; line-height: 2; color: #6b3226; text-align: center;
  letter-spacing: 2px; margin: 16px 0 8px; }
.hmd-fortune-plain { font-size: 14px; line-height: 1.8; color: #4a463d; text-align: center; }
.hmd-fortune-list { list-style: none; line-height: 2; padding: 0; }
.hmd-fortune-list li { border-bottom: 1px dashed #d9cfae; padding: 6px 2px; }
.hmd-fortune-list .hmd-fp { color: #8a857a; font-size: 13px; }
.hmd-panel-btn { display: inline-block; margin-top: 14px; padding: 8px 22px; font: inherit;
  background: #6b3226; color: #f7f1e3; border: none; border-radius: 6px; cursor: pointer;
  letter-spacing: 3px; }

/* 晨鐘搖擺 */
.hmd-bell-ring { animation: hmd-bell-swing .9s ease-in-out 2; transform-origin: top center; }
@keyframes hmd-bell-swing {
  0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(-14deg); }
  50% { transform: rotate(12deg); } 80% { transform: rotate(-6deg); } }
.hmd-checkin-day { font-size: 30px; color: #a03a26; text-align: center; margin: 12px 0;
  letter-spacing: 4px; }
.hmd-checkin-note { text-align: center; color: #4a463d; line-height: 1.9; }

/* 節氣 HUD 角標 */
.hmd-term-badge { position: fixed; top: 60px; right: 16px; z-index: 20; padding: 4px 12px;
  background: rgba(245,239,226,.9); border: 1.5px solid #6b3226; border-radius: 999px;
  color: #6b3226; font-size: 13px; letter-spacing: 2px; }
.hmd-term-poem { font-size: 17px; line-height: 2; color: #2c5545; text-align: center; margin: 14px 0; }

/* 季節濾鏡（極輕微） */
body.hmd-spring #viewport { filter: saturate(1.06) hue-rotate(-4deg); }
body.hmd-summer #viewport { filter: saturate(1.1) brightness(1.02); }
body.hmd-autumn #viewport { filter: sepia(.08); }
body.hmd-winter #viewport { filter: saturate(.9) brightness(1.03); }

/* 尋墨日藏：墨滴微光 */
.hmd-ink { position: absolute; width: 44px; transform: translate(-50%, -50%); z-index: 4;
  pointer-events: none; animation: hmd-ink-glow 2.6s ease-in-out infinite; }
@keyframes hmd-ink-glow {
  0%, 100% { filter: drop-shadow(0 0 3px rgba(58,63,61,.5)); opacity: .8; }
  50%      { filter: drop-shadow(0 0 12px rgba(44,85,69,.85)); opacity: 1; } }
`;
    document.head.appendChild(st);
  }

  // ==========================================================
  // 一、每日一山
  // ==========================================================
  const dailyMod = (function () {
    let todaySite = null;
    let cardEl = null;

    function state() { return bus().load('hmjs_daily', {}); }

    function pickSite() {
      const list = sites();
      if (!list.length || !window.HMJS_HINTS) return null;
      return list[bus().seed(bus().today()) % list.length] || null;
    }

    function renderCard() {
      const t = bus().today();
      const rec = state()[t];
      const hint = (window.HMJS_HINTS && window.HMJS_HINTS[todaySite.id]) || '今日宜遊山攬勝。';
      if (!cardEl) {
        cardEl = document.createElement('div');
        cardEl.className = 'hmd-daily-card';
        cardEl.addEventListener('click', () => walkTo(todaySite.x, todaySite.y));
        document.body.appendChild(cardEl);
      }
      cardEl.innerHTML = `<div class="hmd-daily-title">今日籤詩</div>
        <div class="hmd-daily-hint">${esc(hint)}</div>`;
      cardEl.classList.toggle('hmd-done', !!(rec && rec.done));
    }

    function markLantern() {
      const lm = document.querySelector(`.landmark[data-id="${todaySite.id}"]`);
      if (lm && !lm.querySelector('.hmd-lantern')) {
        const dot = document.createElement('span');
        dot.className = 'hmd-lantern';
        lm.appendChild(dot);
      }
    }

    function complete() {
      const t = bus().today();
      const st = state();
      if (st[t] && st[t].done) return;
      st[t] = { mountain: todaySite.id, done: true };
      bus().save('hmjs_daily', st);
      bus().qi(15, '每日一山');
      bus().toast('今日一山遊畢，文氣＋15！');
      renderCard();
    }

    function init() {
      todaySite = pickSite();
      if (!todaySite) return;
      const t = bus().today();
      const st = state();
      if (!st[t]) { st[t] = { mountain: todaySite.id, done: false }; bus().save('hmjs_daily', st); }
      markLantern();
      renderCard();
      bus().on('back', (p) => {
        if (p && p.site && p.site.id === todaySite.id) complete();
      });
      // 貢院無外連不會有 back 事件，改以開卡視同到訪
      if (todaySite.isYamen || !todaySite.url) {
        bus().on('card', (p) => {
          if (p && p.site && p.site.id === todaySite.id) complete();
        });
      }
    }
    return { init };
  })();

  // ==========================================================
  // 二、山神御題
  // ==========================================================
  const oracleMod = (function () {
    function questionsOf(id) {
      const q = window.HMJS_QUESTIONS;
      return (q && Array.isArray(q[id]) && q[id].length) ? q[id] : null;
    }

    function fragState() { return bus().load('hmjs_oracle_frag', {}); }
    function scrollState() { return bus().load('hmjs_oracle_scroll', {}); }

    function openQuiz(site) {
      const list = questionsOf(site.id);
      if (!list) return;
      const q = list[bus().seed(bus().today() + site.id) % list.length];
      if (!q || !Array.isArray(q.opts)) return;
      const p = bus().panel(`${site.mountain}．山神小試`, '');
      const body = p.body;
      body.innerHTML = `<p class="hmd-quiz-q">${esc(q.q)}</p>`;
      const btns = [];
      q.opts.forEach((opt, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hmd-quiz-opt';
        b.textContent = `（${'ㄧ二三四'[i] || i + 1}）${opt}`;
        b.addEventListener('click', () => answer(site, q, i, btns, body, p));
        body.appendChild(b);
        btns.push(b);
      });
    }

    function answer(site, q, picked, btns, body, p) {
      const key = bus().today() + '_' + site.id;
      const oracle = bus().load('hmjs_oracle', {});
      if (oracle[key]) return; // 面板內防連點
      oracle[key] = true;
      bus().save('hmjs_oracle', oracle);
      btns.forEach((b, i) => {
        b.disabled = true;
        if (i === q.ans) b.classList.add('hmd-right');
        else if (i === picked) b.classList.add('hmd-wrong');
      });
      if (picked === q.ans) {
        const frag = fragState();
        frag[site.id] = (frag[site.id] || 0) + 1;
        bus().save('hmjs_oracle_frag', frag);
        bus().qi(10, '山神御題');
        bus().toast(`答對！得畫卷碎片（${site.mountain} ${frag[site.id]}／7），文氣＋10`);
        const row = document.createElement('p');
        row.className = 'hmd-frag-row';
        row.textContent = `畫卷碎片：${frag[site.id]}／7`;
        body.appendChild(row);
        if (frag[site.id] >= 7) checkScroll(site, p);
      } else {
        const why = document.createElement('div');
        why.className = 'hmd-quiz-why';
        why.textContent = `山神提點：${q.why || '再想想，明日可再來。'}`;
        body.appendChild(why);
        const note = document.createElement('p');
        note.className = 'hmd-frag-row';
        note.textContent = '不扣文氣，明日再試身手。';
        body.appendChild(note);
      }
    }

    function checkScroll(site, prevPanel) {
      const sc = scrollState();
      if (sc[site.id]) return;
      sc[site.id] = true;
      bus().save('hmjs_oracle_scroll', sc);
      bus().qi(50, '山水畫卷成');
      if (prevPanel && prevPanel.close) { try { prevPanel.close(); } catch (e) { /* 靜默 */ } }
      const p = bus().panel('山水畫卷成', '');
      p.body.innerHTML = `
        <img class="hmd-scroll-img" src="assets/img/icon_scroll.png" alt="山水畫卷"
          onerror="this.remove()">
        <p class="hmd-checkin-note">七片碎片聚齊，${esc(site.mountain)}山水畫卷渾然天成！<br>文氣＋50</p>`;
    }

    function attachButton(site) {
      if (!questionsOf(site.id)) return;
      const key = bus().today() + '_' + site.id;
      if (bus().load('hmjs_oracle', {})[key]) return;
      const card = document.getElementById('site-card');
      if (!card || card.querySelector('.hmd-oracle-btn')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hmd-oracle-btn';
      b.textContent = '山神小試';
      b.addEventListener('click', () => openQuiz(site));
      card.appendChild(b);
    }

    function init() {
      if (!window.HMJS_QUESTIONS) return;
      bus().on('card', (p) => { if (p && p.site) attachButton(p.site); });
    }
    return { init };
  })();

  // ==========================================================
  // 三、終南山籤筒
  // ==========================================================
  const fortuneMod = (function () {
    function fortunes() {
      return (Array.isArray(window.HMJS_FORTUNES) && window.HMJS_FORTUNES.length)
        ? window.HMJS_FORTUNES : null;
    }
    function state() { return bus().load('hmjs_fortunes', { list: [], lastDate: null }); }

    function todayIdx() { return bus().seed(bus().today()) % fortunes().length; }

    function openDraw() {
      const fs = fortunes();
      if (!fs) return;
      const st = state();
      const t = bus().today();
      const idx = todayIdx();
      const f = fs[idx] || { text: '', plain: '' };
      const drawn = st.lastDate === t;
      const collected = st.list.indexOf(idx) !== -1;
      const p = bus().panel(drawn ? '今日籤（已抽）' : '終南山籤筒', '');
      p.body.innerHTML = `
        <p class="hmd-fortune-text">${esc(f.text)}</p>
        <p class="hmd-fortune-plain">${esc(f.plain)}</p>
        <p class="hmd-checkin-note">已收籤詩：${st.list.length}／${fs.length}</p>`;
      if (!drawn || !collected) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hmd-panel-btn';
        b.textContent = '收入籤詩冊';
        b.addEventListener('click', () => {
          const s2 = state();
          if (s2.list.indexOf(idx) === -1) s2.list.push(idx);
          s2.lastDate = t;
          bus().save('hmjs_fortunes', s2);
          bus().toast('籤詩已收入冊中。');
          checkTitle(s2);
          p.close();
        });
        p.body.appendChild(b);
      }
      if (!drawn) { st.lastDate = t; bus().save('hmjs_fortunes', st); }
    }

    function checkTitle(st) {
      if (st.title || st.list.length < 30) return;
      st.title = true;
      bus().save('hmjs_fortunes', st);
      bus().qi(100, '狀元籤');
      bus().toast('三十籤在冊，解鎖「狀元籤」稱號！文氣＋100');
    }

    function renderTab(container) {
      const fs = fortunes() || [];
      const st = state();
      let html;
      if (!st.list.length) {
        html = '<p class="hmd-checkin-note">尚未收得籤詩，到終南山籤筒抽一支吧。</p>';
      } else {
        const items = st.list.map((i) => {
          const f = fs[i];
          if (!f) return '';
          return `<li>${esc(f.text)}<br><span class="hmd-fp">${esc(f.plain)}</span></li>`;
        }).join('');
        html = `<p class="hmd-checkin-note">已收 ${st.list.length}／${fs.length} 籤${st.title ? '．狀元籤' : ''}</p>
          <ul class="hmd-fortune-list">${items}</ul>`;
      }
      if (container && 'innerHTML' in container) container.innerHTML = html;
      return html;
    }

    function init() {
      if (!fortunes()) return;
      const site = findSite('wenyan-jieyou-zhan');
      if (site) {
        bus().addDecor('hmd-lottube', 'assets/img/deco_lottube.png',
          site.x + 90, site.y + 60, { w: 70, onClick: openDraw });
      }
      if (bus().registerTab) bus().registerTab('籤詩', renderTab);
    }
    return { init };
  })();

  // ==========================================================
  // 四、貢院晨鐘
  // ==========================================================
  const bellMod = (function () {
    function state() { return bus().load('hmjs_checkin', { total: 0, streak: 0, lastDate: null }); }

    function yesterday() {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const p2 = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
    }

    // 段位：連續 14 天以上退到 14、7 以上退到 7、3 以上退到 3，否則 1（永不歸零）
    function levelOf(streak) {
      if (streak >= 14) return 14;
      if (streak >= 7) return 7;
      if (streak >= 3) return 3;
      return 1;
    }

    function cheerLine(streak, resumed) {
      if (resumed) return '書聲再起，功力仍在，今日又是好開卷日。';
      if (streak >= 14) return '晨鐘長鳴十四朝，翰墨已成日常。';
      if (streak >= 7) return '連開七日卷，文氣自成江河。';
      if (streak >= 3) return '三日不輟，筆下漸有山河氣象。';
      return '日日開卷，聚沙成塔。';
    }

    function ring(ev) {
      // 鐘聲搖擺動畫（能找到裝飾元素才做，找不到不擋流程）
      try {
        const t = ev && (ev.currentTarget || ev.target);
        const el = t && t.closest ? (t.closest('img') || t) : t;
        if (el && el.classList) {
          el.classList.remove('hmd-bell-ring');
          void el.offsetWidth; // 重觸發動畫
          el.classList.add('hmd-bell-ring');
        }
      } catch (e) { /* 靜默 */ }

      const st = state();
      const t = bus().today();
      let resumed = false;
      if (st.lastDate !== t) {
        if (st.lastDate === yesterday()) {
          st.streak = (st.streak || 0) + 1;
        } else if (st.lastDate) {
          // 斷簽只退一級：回到上次連續的段位，永不歸零
          st.streak = Math.max(1, levelOf(st.streak || 0));
          resumed = true;
        } else {
          st.streak = 1;
        }
        st.total = (st.total || 0) + 1; // total 永遠只增
        st.lastDate = t;
        bus().save('hmjs_checkin', st);
        bus().qi(5, '貢院晨鐘');
      }
      const p = bus().panel('貢院晨鐘', '');
      p.body.innerHTML = `
        <p class="hmd-checkin-day">開卷第 ${st.total} 日</p>
        <p class="hmd-checkin-note">${esc(cheerLine(st.streak, resumed))}<br>
        連續開卷：${st.streak} 日</p>`;
    }

    function init() {
      const site = findSite('yamen');
      if (!site) return;
      bus().addDecor('hmd-bell', 'assets/img/deco_bell.png',
        site.x - 100, site.y + 50, { w: 80, onClick: ring });
    }
    return { init };
  })();

  // ==========================================================
  // 五、節氣山河
  // ==========================================================
  const termMod = (function () {
    function terms() {
      return (Array.isArray(window.HMJS_TERMS) && window.HMJS_TERMS.length)
        ? window.HMJS_TERMS : null;
    }

    function currentTerm(now) {
      const list = terms().slice().sort((a, b) => (a.month * 100 + a.day) - (b.month * 100 + b.day));
      const md = (now.getMonth() + 1) * 100 + now.getDate();
      let cur = list[list.length - 1]; // 年初小寒之前 → 沿用去年最末節氣
      for (const t of list) {
        if (t.month * 100 + t.day <= md) cur = t;
      }
      return cur;
    }

    function seasonClass(month) {
      if (month >= 3 && month <= 5) return 'hmd-spring';
      if (month >= 6 && month <= 8) return 'hmd-summer';
      if (month >= 9 && month <= 11) return 'hmd-autumn';
      return 'hmd-winter';
    }

    function showBadge(term) {
      let b = document.querySelector('.hmd-term-badge');
      if (!b) {
        b = document.createElement('div');
        b.className = 'hmd-term-badge';
        document.body.appendChild(b);
      }
      b.textContent = `節氣・${term.name}`;
    }

    function greet(term) {
      const claimed = bus().load('hmjs_solarterms', []);
      const has = claimed.indexOf(term.name) !== -1;
      const p = bus().panel(`今日${term.name}`, '');
      p.body.innerHTML = `<p class="hmd-term-poem">${esc(term.poem || '')}</p>
        <p class="hmd-checkin-note">${has ? '節氣印已在冊。' : '恰逢節氣，特頒節氣印一枚。'}</p>`;
      if (!has) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hmd-panel-btn';
        btn.textContent = `領「${term.name}」節氣印`;
        btn.addEventListener('click', () => {
          const c2 = bus().load('hmjs_solarterms', []);
          if (c2.indexOf(term.name) === -1) {
            c2.push(term.name);
            bus().save('hmjs_solarterms', c2);
            bus().qi(20, '節氣印');
            bus().toast(`得「${term.name}」節氣印，文氣＋20！`);
          }
          p.close();
        });
        p.body.appendChild(btn);
      }
    }

    function init() {
      if (!terms()) return;
      const now = new Date();
      const cur = currentTerm(now);
      if (cur) showBadge(cur);
      document.body.classList.remove('hmd-spring', 'hmd-summer', 'hmd-autumn', 'hmd-winter');
      document.body.classList.add(seasonClass(now.getMonth() + 1));
      const exact = terms().find((t) => t.month === now.getMonth() + 1 && t.day === now.getDate());
      if (exact) greet(exact);
    }
    return { init };
  })();

  // ==========================================================
  // 六、尋墨日藏
  // ==========================================================
  const inkMod = (function () {
    // 20 個地圖留白座標池（避開各山頭 140px 觸發圈）
    const POOL = [
      [400, 420], [880, 300], [1450, 330], [2050, 380], [300, 900],
      [2250, 850], [650, 1300], [1500, 1250], [2100, 1300], [1300, 760],
      [700, 500], [1150, 550], [1850, 900], [550, 700], [1000, 1100],
      [1700, 1500], [2400, 1150], [350, 1350], [1250, 1450], [2450, 450],
    ];
    const PICK_R = 80;
    let active = []; // [{idx, x, y, el}]

    function facts() {
      return (Array.isArray(window.HMJS_FACTS) && window.HMJS_FACTS.length)
        ? window.HMJS_FACTS : null;
    }
    function state() { return bus().load('hmjs_inkdrops', { total: 0 }); }

    function todayIdxs() {
      const base = bus().seed(bus().today());
      const out = [];
      for (let i = 0; i < 4; i++) out.push((base + i * 7) % POOL.length); // 7 與 20 互質 → 必不重複
      return out;
    }

    function spawn() {
      const world = document.getElementById('world');
      if (!world) return;
      const t = bus().today();
      const st = state();
      const picked = Array.isArray(st[t]) ? st[t] : [];
      for (const idx of todayIdxs()) {
        if (picked.indexOf(idx) !== -1) continue;
        const [x, y] = POOL[idx];
        const img = document.createElement('img');
        img.className = 'hmd-ink';
        img.src = 'assets/img/icon_inkdrop.png';
        img.alt = '';
        img.style.left = x + 'px';
        img.style.top = y + 'px';
        img.onerror = function () { this.onerror = null; this.removeAttribute('src'); }; // 圖缺仍可拾取（隱形點）
        world.appendChild(img);
        active.push({ idx, x, y, el: img });
      }
    }

    function pick(drop) {
      active = active.filter((d) => d !== drop);
      if (drop.el && drop.el.parentNode) drop.el.parentNode.removeChild(drop.el);
      const t = bus().today();
      const st = state();
      // 只留今日鍵，舊日期鍵順手清掉
      for (const k of Object.keys(st)) {
        if (k !== 'total' && k !== 'title' && k !== t) delete st[k];
      }
      if (!Array.isArray(st[t])) st[t] = [];
      if (st[t].indexOf(drop.idx) === -1) st[t].push(drop.idx);
      st.total = (st.total || 0) + 1;
      bus().save('hmjs_inkdrops', st);
      bus().qi(8, '尋墨日藏');
      const fs = facts();
      const fact = fs ? fs[bus().seed(bus().today() + drop.idx) % fs.length] : '';
      bus().toast(fact ? `拾得墨寶＋8 文氣｜${fact}` : '拾得墨寶，文氣＋8！');
      if (st.total >= 30 && !st.title) {
        st.title = true;
        bus().save('hmjs_inkdrops', st);
        bus().qi(50, '墨癡');
        bus().toast('尋墨三十顆，解鎖「墨癡」稱號！文氣＋50');
      }
    }

    function onTick(p) {
      if (!active.length || !p) return;
      for (const drop of active.slice()) {
        if (Math.hypot(p.x - drop.x, p.y - drop.y) < PICK_R) pick(drop);
      }
    }

    function init() {
      if (!facts()) return;
      spawn();
      bus().on('tick', onTick);
    }
    return { init };
  })();

  // ---------- 啟動 ----------
  function boot() {
    const b = bus();
    if (!b || typeof b.on !== 'function' || typeof b.seed !== 'function'
      || typeof b.today !== 'function' || typeof b.load !== 'function') return;
    injectStyle();
    // 各子系統獨立 try/catch，一個壞不影響其他
    [dailyMod, oracleMod, fortuneMod, bellMod, termMod, inkMod].forEach((m) => {
      try { m.init(); } catch (e) { /* 靜默降級 */ }
    });
  }

  window.addEventListener('hmjs:ready', boot);
})();
