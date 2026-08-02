// js/map.js — 地標渲染＋鏡頭套用＋圖片 fallback
(function () {
  const world = () => document.getElementById('world');
  let clickHandler = null;

  window.HMJSMap = {
    init() {
      const wrap = document.getElementById('landmarks');
      for (const s of window.HMJS_SITES) {
        const el = document.createElement('div');
        el.className = 'landmark';
        el.dataset.id = s.id;
        el.style.left = s.x + 'px';
        el.style.top = s.y + 'px';
        const img = document.createElement('img');
        img.src = 'assets/img/landmark_' + s.id + '.png';
        img.alt = '';
        img.onerror = () => img.remove(); // 地標圖缺 → 只剩名牌，不擋操作
        const name = document.createElement('span');
        name.className = 'lm-name';
        name.textContent = s.mountain;
        el.append(img, name);
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          if (clickHandler) clickHandler(s);
        });
        wrap.appendChild(el);
      }
      const bg = document.getElementById('map-bg');
      bg.onerror = () => { bg.remove(); }; // 底圖缺 → 露出 #viewport 潑墨漸層
    },
    applyCamera(px, py) {
      const { ox, oy } = HMJSLogic.cameraOffset(px, py, innerWidth, innerHeight, 2600, 1600);
      world().style.transform = `translate(${ox}px, ${oy}px)`;
      // 視差：遠霧層以 0.4 倍速反向漂移
      document.getElementById('mist').style.transform = `translate(${ox * 0.4}px, ${oy * 0.4}px)`;
    },
    onLandmarkClick(fn) { clickHandler = fn; },
  };
})();
