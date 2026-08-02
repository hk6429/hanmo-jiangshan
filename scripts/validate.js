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
// ── 遊戲化 meta 資料層 ──
const questions = loadWindowScript('data/meta/questions.js', 'HMJS_QUESTIONS');
assert.strictEqual(Object.keys(questions).length, 10, '題庫必須十山');
for (const id of ids) {
  const qs = questions[id];
  assert.ok(Array.isArray(qs) && qs.length === 12, `${id} 題數必須 12`);
  const dist = [0, 0, 0, 0];
  for (const q of qs) {
    assert.ok(q.q && q.opts.length === 4 && q.why, `${id} 題目欄位不全`);
    assert.ok(Number.isInteger(q.ans) && q.ans >= 0 && q.ans <= 3, `${id} ans 出界`);
    dist[q.ans]++;
  }
  assert.ok(Math.max(...dist) <= 5, `${id} 正解位置過度集中 ${dist}`);
}
const fortunes = loadWindowScript('data/meta/fortunes.js', 'HMJS_FORTUNES');
assert.strictEqual(fortunes.length, 120, '籤詩必須 120 支');
assert.strictEqual(new Set(fortunes.map(f => f.text)).size, 120, '籤詩不可重複');
for (const f of fortunes) assert.ok(f.text && f.plain, '籤詩欄位不全');
const verses = loadWindowScript('data/meta/verses.js', 'HMJS_VERSES');
for (const id of ids) {
  assert.ok(Array.isArray(verses[id]) && verses[id].length === 3, `${id} 集句必須 3 組`);
  for (const v of verses[id]) assert.ok(v.half && v.full && v.note, `${id} 集句欄位不全`);
}
assert.strictEqual(global.window.HMJS_POEMS.length, 5, '尋詩必須 5 首');
for (const p of global.window.HMJS_POEMS)
  assert.ok(p.title && p.author && p.lines.length === 4, '尋詩欄位不全');
assert.strictEqual(global.window.HMJS_QUOTES.length, 30, '語錄必須 30 則');
const terms = loadWindowScript('data/meta/misc.js', 'HMJS_TERMS');
assert.strictEqual(terms.length, 24, '節氣必須 24');
assert.strictEqual(Object.keys(global.window.HMJS_HINTS).length, 10, '暗示必須 10 山');
assert.strictEqual(global.window.HMJS_RIDDLES.length, 4, '謎題必須 4 則');
for (const r of global.window.HMJS_RIDDLES)
  assert.ok(r.x > 0 && r.y > 0 && r.opts.length === 4 && r.ans >= 0 && r.ans <= 3 && r.spirit,
    '謎題欄位不全');
assert.strictEqual(global.window.HMJS_FACTS.length, 30, '冷知識必須 30 則');

// 禁簡體抽查（常見字）
const fs = require('fs');
const BAD_CHARS = ['国','学','题','级','历','复','关','废','测','读'];
const CHECK_FILES = ['data/sites.js','data/exams.js','index.html',
  'data/meta/questions.js','data/meta/fortunes.js','data/meta/verses.js','data/meta/misc.js',
  'js/meta/core.js','js/meta/daily.js','js/meta/collect.js','js/meta/shop.js',
  'js/meta/social.js','js/meta/explore.js'];
for (const f of CHECK_FILES) {
  const t = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  for (const bad of BAD_CHARS)
    assert.ok(!t.includes(bad), `${f} 含簡體字「${bad}」`);
}
console.log('ALL CLEAN');
