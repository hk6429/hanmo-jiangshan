# 翰墨江山遊戲化 26 設定整合規格（v1，2026-08-02）

依 `100_Todo/drafts/2026-08-02_翰墨江山遊戲化50提案.md` 全數實作（排除被否決的提案 20 hash 憑證；功名一律印章制不計點擊；全站任何 streak 斷簽只退一級或只計總天數，禁止歸零）。

## 鐵則
- 純靜態、無後端；localStorage 全走 `hmjs_` 前綴，讀寫都包 try/catch，失效時靜默降級為「可玩但不記錄」。
- 繁體中文台灣用語、禁簡體。日期一律 `new Date()` 本地日 `YYYY-MM-DD` 字串。
- 日期 seed 函式統一用 core.js 的 `HMJSBus.seed(str)`（字串 hash → 正整數）。
- 新增 UI 全部沿用宣紙卡風（#f7f1e3 底、#6b3226 主色、serif）。
- 不改 js/logic.js。對既有檔案的修改只允許整合任務（Task G）做。

## 事件匯流排（core.js 提供，其他模組只准經由它掛鉤）
```js
window.HMJSBus = {
  on(evt, fn), emit(evt, payload), seed(str)->uint32,
  today()->'YYYY-MM-DD', qi(delta, reason)->newTotal, // 文氣統一入口（防重複由呼叫端記 hmjs_ 鍵）
}
```
事件（整合任務負責在既有檔案補 emit）：
- `tick {x,y}`：player 每 frame（原 onMove 改為同時 emit）
- `card {site}`：宣紙卡開啟
- `enter {site}`：點「入山」外連當下
- `back {site, awayMs}`：入山後返回分頁（pageshow/visibilitychange，awayMs>=15000 才算真入山）
- `atlas-render {container, tab}`：遊歷圖分頁渲染請求

## localStorage 鍵總表
| 鍵 | 內容 | 模組 |
|---|---|---|
| hmjs_visited | 到訪 id 陣列（既有） | stamps |
| hmjs_visit_counts | {山id: 入山次數}（back 事件才 +1） | core |
| hmjs_rank | 功名等級 0-4（衍生值可重算，存供動畫判斷） | core |
| hmjs_qi | 文氣總量 | core |
| hmjs_qi_log | {日期: {事由: true}} 防重複 | core |
| hmjs_daily | {日期: {mountain, done}} | daily |
| hmjs_checkin | {total, streakLevel, lastDate} | daily |
| hmjs_oracle | {日期: true} 已答御題；hmjs_oracle_frag {山id: 碎片數} | daily |
| hmjs_fortunes | 已收籤詩 idx 陣列＋lastDate | daily |
| hmjs_solarterms | 已領節氣印 | daily |
| hmjs_inkdrops | {日期: [已拾座標idx]}＋total | daily |
| hmjs_spirits | {山id: 階段0蛋/1破殼/2完全體}；hmjs_spirits_hidden | collect |
| hmjs_verses | 集句冊 {山id: 已得聯數}；hmjs_quotes 語錄 idx；hmjs_poems 尋詩已得句 | collect |
| hmjs_distance | 累計移動 px | shop |
| hmjs_wardrobe / hmjs_outfit | 已購清單／穿戴中 | shop |
| hmjs_notes | [{date, mountain, text}] 札記 | social |
| hmjs_onboarded | 紙鶴教學完成 | explore |
| hmjs_fog | 已開霧山 id 陣列 | explore |
| hmjs_banners | 師命遊學帖進度 | social |
| hmjs_relics | 山靈信物旗（back 事件 awayMs>=120000 授旗） | explore |

## 模組與檔案（每個模組一檔，自我初始化：DOMContentLoaded 後檢查 window.HMJSBus 存在才啟動）
| 檔 | 系統 | 要點 |
|---|---|---|
| js/meta/core.js | 匯流排＋文氣＋功名＋印階＋成就＋詔書動畫 | 功名門檻：印章 1/3/5/8/10 → 童生/秀才/舉人/貢士/狀元；升階彈詔書（icon_edict.png）＋換袍（rank>=2 烏紗帽 sprite 組、rank==4 狀元袍組，player 圖路徑集中 core 管理）；印階：visit_counts 3 次白銀、10 次鎏金（CSS 濾鏡＋印面框色）；成就 config：三試及第(泰衡恆)/五嶽真形(泰衡恆華嵩，含雲霧散開動畫)/三山帖(廬終峨)/鬥字雙俠(華峨)；文氣：card 首次/日 +5、back +10、其他模組經 qi() 入帳；streak 倍率 3/7/14 天 ×1.5/2/3，斷簽退一級 |
| js/meta/daily.js | 每日一山＋山神御題＋籤詩＋晨鐘簽到＋節氣山河＋尋墨日藏 | 每日一山：seed(today) 選山，紅燈籠特效＋籤詩暗示卡，點卡 walkTo；當日 back 該山 → 描金點＋文氣；御題：宣紙卡「山神小試」按鈕，data/meta/questions.js 依 seed(today+山id) 出 1 題，答對 +碎片+文氣，7 碎片成畫卷；籤詩：終南山籤筒每日一抽（data/meta/fortunes.js，seed(today) 全站同籤），收籤詩冊，30 張解狀元籤；晨鐘：貢院晨鐘每日首訪蓋「開卷第 N 日」，連 3 描金連 7 解披風色，斷簽退一級；節氣：data/meta/misc.js 24 節氣表，當日到訪領節氣印，地圖 CSS filter 依季節；尋墨：seed(today) 從 20 座標池刷 4 顆墨寶，走近（tick 距離<80）拾取 +文氣+冷知識 |
| js/meta/collect.js | 山靈圖鑑＋集句冊＋語錄圖鑑＋山水尋詩 | 山靈：首 back 得蛋(spirit_egg)、3 次破殼(完全體圖+50%灰階)、10 次完全體(spirit_{id}.png)；4 隱藏山靈在指定座標答謎收服（謎題在 misc.js）；集句：card 開啟時文人吟半句（氣泡），back 後贈全聯（每山 3 聯輪換），十聯滿可下載卷軸（canvas 直式）；語錄：載入時 40% 機率隨機山腳出現語錄卡點（icon 用 seal 縮小），點擊得語錄（misc.js 30 則）；尋詩：5 個留白座標（tick 距離<70）浮半句，集 4 句成絕句＋隱藏印「尋幽探勝」 |
| js/meta/shop.js | 腳程錄＋坐騎＋墨寶閣＋換裝 | tick 累計距離（每 frame 加位移量）；5000/20000/50000 px 解鎖紙鶴/墨鯉/水墨龍坐騎購買資格；墨寶閣（地圖 (760,1240) 建築 deco_shop）商店卡：斗笠30/紙傘50/披風80/仙鶴200 文氣，坐騎提速（SPEED 乘數經 core 掛到 player 讀的全域 window.HMJS_SPEED_MULT，整合任務讓 player.js 讀它）；穿戴中坐騎顯示於 player 旁小圖示＋提速 1.3x/1.6x/2x |
| js/meta/social.js | 金榜名帖/家長遊歷帖＋師命遊學帖＋小書生札記 | 名帖：canvas 1080×1528 直式宣紙（讀功名/印章/印階/集句數/暱稱/最近札記），學生版＋家長版（固定「無儲值、無排名」說明＋陪伴提問），下載 PNG；遊學帖：貢院分頁，老師勾山＋截止日→base64 URL＋QR（用 canvas 畫簡易 QR 可用第三方內嵌演算法或改提供純連結＋複製鈕——禁外部 CDN，無法內嵌 QR 就只做連結）；學生開 ?quest= 參數→指定山插令旗（deco_flag），完成（該山有印＋御題對過）→結業宣紙卡 canvas；札記：back 事件後浮「寫一句」輸入（可跳過），遊歷圖札記分頁 |
| js/meta/explore.js | 紙鶴引路＋雲霧開圖＋涼亭奉茶＋文豪偶遇＋山靈信物 | 紙鶴：首訪三段氣泡教學＋飛向最近的山（mount_crane 圖 CSS 移動）；雲霧：初訪僅泰山/貢院清晰，其餘 .landmark 蓋霧 CSS（blur+白紗+剪影），back 某山後開該山鄰接 1-2 座（鄰接表寫死）；涼亭：(1180,1180) deco_pavilion，全域計時 30 分 → 小書生 walkTo 涼亭＋奉茶卡護眼提醒；偶遇：40% 機率載入時山腳放文豪點（同語錄卡機制整合，collect 出資料、explore 出位置——由 collect 實作，explore 只留涼亭/紙鶴/雲霧/信物）；信物：back 且 awayMs>=120000 → 該山插信物旗，5 旗解鎖隱藏第 11 景「翰墨秘境」卡（一幅題詩＋大印下載） |

## 資料檔（純內容，agents 可並行產）
- data/meta/questions.js `window.HMJS_QUESTIONS = {山id: [{q, opts:[4], ans:0-3, why(<=40字)}]}` 每山 12 題，題型呼應該站學科（華山字形、峨眉字音成語、嵩山修辭、梁山閱讀短文題、泰衡恆考古題風、廬山文豪典故、終南文言字詞），內容必須正確、絕不出爭議題
- data/meta/fortunes.js `window.HMJS_FORTUNES = [{text, plain}]` 120 句國學金句籤（原句＋白話一行），出處正確
- data/meta/verses.js `window.HMJS_VERSES = {山id: [{half, full, note}]×3}` 駐山文人對聯/名句（泰山杜甫、衡山朱熹、恆山酈道元、華山寇準、嵩山韓愈、廬山李白、終南王維、峨眉李白蘇軾、梁山施耐庵、貢院文天祥）＋`window.HMJS_POEMS` 尋詩 5 絕句＋`window.HMJS_QUOTES` 30 則文豪語錄（名句＋白話）
- data/meta/misc.js 24 節氣（名/國曆近似日/一句詩）＋每日一山籤詩暗示 10 句＋4 隱藏山靈謎題＋功名/成就/商店 config＋尋墨冷知識 30 則

## 新增美術（生圖產線，風格層同 art/PROMPTS.md 潑墨×Q版，全部透明背景 PNG 除註明）
deco_pavilion 涼亭、deco_shop 墨寶閣、deco_bell 晨鐘、deco_lottube 籤筒、deco_flag 令旗、icon_gourd 墨葫蘆、icon_inkdrop 墨滴、icon_scroll 畫卷、icon_edict 詔書卷軸、spirit_egg 水墨蛋、spirit_{十山id} 山靈×10（泰山石敢當/衡山朱雀/恆山玄武/華山劍靈/嵩山少林小虎/廬山瀑布龍/終南鹿仙/峨眉靈猴/梁山錦鯉俠/貢院文昌鳥）、mount_crane 紙鶴/mount_carp 墨鯉/mount_dragon 水墨龍、player_rank3_{idle,walk1,walk2} 烏紗帽官服版、player_rank5_{idle,walk1,walk2} 狀元紅袍版（以現有 player_idle.png 為 reference 同一人）。共 29 張。

## 整合任務（Task G，唯一可改既有檔）
1. player.js：onMove 同步 emit `tick`；SPEED 乘上 window.HMJS_SPEED_MULT||1；sprite 路徑改讀 window.HMJS_SPRITES||預設。
2. cards.js：openCard emit `card`；「入山」a 加 click emit `enter`＋記 pending，pageshow/visibilitychange 回來 emit `back`。
3. stamps.js：遊歷圖改分頁（印章/成就/山靈/集句/籤詩/札記），各分頁 emit `atlas-render` 交由模組填充。
4. index.html：script 順序 data/meta/* → js/meta/core.js → 其他 meta；地圖裝飾（涼亭/墨寶閣/晨鐘/籤筒掛座標）。
5. css append：meta 元件樣式集中一段。
6. 驗證：validate.js 擴充檢查 meta 資料檔（題數、選項數、ans 範圍、禁簡體）；test-logic 不動；smoke 不動。
7. 三平台部署照舊（副本圖檔記得縮到顯示 2x 解析度）。
