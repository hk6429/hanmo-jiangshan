// js/main.js — 組裝
document.addEventListener('DOMContentLoaded', () => {
  HMJSMap.init();
  HMJSStamps.init();
  HMJSCards.init();
  HMJSPlayer.init(1300, 1000);
  // 通知遊戲化模組（js/meta/*）開始初始化
  window.dispatchEvent(new CustomEvent('hmjs:ready'));
});
