// scripts/validate.js — 資料層驗證：node scripts/validate.js
const assert = require('assert');
const path = require('path');
function loadWindowScript(rel, key) {
  global.window = global.window || {};
  require(path.join(__dirname, '..', rel));
  return global.window[key];
}
const sites = loadWindowScript('data/sites.js', 'HMJS_SITES');
const exams = loadWindowScript('data/exams.js', 'HMJS_EXAMS');
const MAP_W = 2600, MAP_H = 1600;

assert.strictEqual(sites.length, 10, '必須十個地點');
const ids = new Set();
for (const s of sites) {
  for (const k of ['id','mountain','siteName','tagline','stats','audience'])
    assert.ok(typeof s[k] === 'string' && s[k].length > 0, `${s.id||'?'} 缺 ${k}`);
  assert.ok(!ids.has(s.id), `id 重複: ${s.id}`); ids.add(s.id);
  assert.ok(s.x >= 100 && s.x <= MAP_W - 100 && s.y >= 100 && s.y <= MAP_H - 100,
    `${s.id} 座標出界`);
  if (s.isYamen) assert.strictEqual(s.url, null);
  else assert.ok(/^https:\/\/.+\.pages\.dev\/$/.test(s.url), `${s.id} URL 格式錯誤`);
}
assert.strictEqual(sites.filter(s => s.isYamen).length, 1, '貢院必須恰好一座');

assert.strictEqual(exams.length, 4, '貢院必須四卡');
for (const e of exams) {
  for (const k of ['id','name','intro','dateNote','officialName','officialUrl','mountainId'])
    assert.ok(e[k] && String(e[k]).length > 0, `${e.id||'?'} 缺 ${k}`);
  assert.ok(ids.has(e.mountainId), `${e.id} 導流目標 ${e.mountainId} 不存在`);
  assert.ok(!/（Step 2/.test(e.dateNote), `${e.id} dateNote 還是佔位文字，未填官方日期`);
}
// 禁簡體抽查（常見字）
const fs = require('fs');
const BAD_CHARS = ['国','学','题','级','历','复','关','废','测','读'];
for (const f of ['data/sites.js','data/exams.js','index.html']) {
  const t = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  for (const bad of BAD_CHARS)
    assert.ok(!t.includes(bad), `${f} 含簡體字「${bad}」`);
}
console.log('ALL CLEAN');
