const assert = require('assert');
const L = require('../js/logic.js');

// clamp
assert.strictEqual(L.clamp(5, 0, 10), 5);
assert.strictEqual(L.clamp(-3, 0, 10), 0);
assert.strictEqual(L.clamp(99, 0, 10), 10);

// stepToward：直線逼近、到點回 arrived、面向
let s = L.stepToward(0, 0, 100, 0, 10);
assert.deepStrictEqual([Math.round(s.x), Math.round(s.y), s.arrived, s.facingLeft], [10, 0, false, false]);
s = L.stepToward(100, 0, 0, 0, 10);
assert.strictEqual(s.facingLeft, true);
s = L.stepToward(98, 0, 100, 0, 10);       // 一步內到達
assert.deepStrictEqual([s.x, s.y, s.arrived], [100, 0, true]);
s = L.stepToward(50, 50, 50, 50, 10);      // 原地
assert.strictEqual(s.arrived, true);

// nearbySite：半徑內取最近
const sites = [{ id: 'a', x: 0, y: 0 }, { id: 'b', x: 100, y: 0 }];
assert.strictEqual(L.nearbySite(90, 0, sites, 140).id, 'b');
assert.strictEqual(L.nearbySite(60, 0, sites, 30), null);  // 改: 半徑30使都不在內
assert.strictEqual(L.nearbySite(40, 0, sites, 140).id, 'a');

// cameraOffset：主角置中、地圖邊緣夾住
let c = L.cameraOffset(1300, 800, 1000, 600, 2600, 1600);
assert.deepStrictEqual([c.ox, c.oy], [-800, -500]);
c = L.cameraOffset(0, 0, 1000, 600, 2600, 1600);       // 左上角
assert.deepStrictEqual([c.ox, c.oy], [0, 0]);
c = L.cameraOffset(2600, 1600, 1000, 600, 2600, 1600); // 右下角
assert.deepStrictEqual([c.ox, c.oy], [-1600, -1000]);
c = L.cameraOffset(1300, 800, 3000, 2000, 2600, 1600); // 視窗比地圖大 → 不出負界
assert.deepStrictEqual([c.ox, c.oy], [0, 0]);

console.log('ALL CLEAN');
