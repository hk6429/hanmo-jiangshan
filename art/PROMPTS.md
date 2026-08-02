# 翰墨江山 生圖任務書（Task 7）

> 供 codex exec（ChatGPT OAuth，不耗 API 額度）批次生圖使用。
> 風格改寫自文豪笑傳 art-bible（`文豪笑傳/art-bible/style-guide.md`）：
> 去金箔、去暖色繪本場景圖那套，往「潑墨山水」傾斜。

## 風格層（每張必帶，逐字沿用）

> 中國水墨潑墨 × 暖色繪本 Q 版。宣紙米白底、墨線描邊＋水彩上色；畫面必有構圖級潑墨元素
> （墨色山影、雲霧、濺墨破框，佔兩三成）；色調以黛青、赭石、暖棕為主、整體明亮；
> 禁止：寫實照片感、3D 渲染感、冷色黑金、簡體字、任何文字入畫、扭曲手指。

英文版（給模型吃）：

> Chinese ink-wash splash painting (潑墨) × warm picture-book chibi style. Rice-paper
> off-white background, ink-line outlines with watercolor coloring. Must include a
> compositional-level ink-splash element (dark mountain silhouette, mist/clouds, or a
> splash breaking the frame — occupying roughly 20–30% of the image). Color palette:
> dai-qing (深靛青/black-blue), ochre/russet, warm brown, overall bright and airy —
> not dark or gloomy. STRICTLY AVOID: photorealism, 3D render look, cold black-gold
> metallic style, Simplified Chinese characters, ANY text/lettering/calligraphy
> rendered into the image, distorted/malformed hands or fingers.

## 工單（14 張）

| # | 檔名 | 規格 | 內容要點 | 門檻 |
|---|---|---|---|---|
| 1 | map_bg.jpg | 1536×1024 橫式 | 潑墨山水全景：遠景群峰雲海、中景九座山頭錯落、西南角一片平地留給貢院、山頭之間留出淺色小徑；壯闊豁然、留白呼吸感；不畫任何文字與地標建築（地標另疊）| >600KB |
| 2 | landmark_cap-guowen.png | 1024×1024 去背 | 泰山：雄渾方正的 Q 版潑墨山頭特寫，山腳一面小旗 | >80KB |
| 3 | landmark_gsat-guowen.png | 1024×1024 去背 | 衡山：南嶽壽岳，柔和圓潤峰頭，山腳一座小亭 | >80KB |
| 4 | landmark_tvet-guowen.png | 1024×1024 去背 | 恆山：北嶽穩重蒼勁，山腰一座小型懸空建築剪影（不寫實、Q版化） | >80KB |
| 5 | landmark_xingyin-doushi.png | 1024×1024 去背 | 華山：險峻如劍的三角銳峰，山腳一卷書卷 | >80KB |
| 6 | landmark_wenxin-diaolong.png | 1024×1024 去背 | 嵩山：中嶽正學，端正厚重雙峰，山腳一卷竹簡 | >80KB |
| 7 | landmark_wenhao-xiaozhuan.png | 1024×1024 去背 | 廬山：雲霧繚繞、一道飛瀑直下山澗 | >80KB |
| 8 | landmark_wenyan-jieyou-zhan.png | 1024×1024 去背 | 終南山：隱逸清幽，山腰淡雲繚繞、一間小茅亭 | >80KB |
| 9 | landmark_zizizhuji.png | 1024×1024 去背 | 峨眉山：秀麗青翠層疊峰巒，山腳一叢竹 | >80KB |
| 10 | landmark_reading-expedition.png | 1024×1024 去背 | 梁山：水泊環繞的低矮山丘，山腳一葉扁舟 | >80KB |
| 11 | landmark_yamen.png | 1024×1024 去背 | 貢院：Q 版木紅色牌樓＋院牆，掛一條紅綢（不寫字） | >80KB |
| 12 | player_idle.png | 1024×1024 去背 | Q 版小書生（頭身比 1:2、藍衫、背書簍、握卷軸），側面向右，站立姿態 | >80KB |
| 13 | player_walk1.png | 1024×1024 去背 | 同一小書生（以 idle 為 reference），側面向右，走路姿態，左腳在前 | >80KB |
| 14 | player_walk2.png | 1024×1024 去背 | 同一小書生（以 idle 為 reference），側面向右，走路姿態，右腳在前 | >80KB |
| 15 | seal.png | 512×512 去背 | 硃紅方印，篆刻風「遊」字意象抽象化（避免真實筆畫錯字），不出現可辨識文字 | >80KB |
| 16 | og.jpg | 1536×1024 | map_bg 構圖延伸，加主角小書生置中偏下遠眺群峰（分享圖） | >600KB |
| 17 | favicon.png | 512×512 | 硃紅印章＋墨山剪影組合圖示 | >80KB |

> 上表工單編號逐檔列出方便追蹤生成狀態；實際落盤總數見下方「落盤清單」（共 17 個檔案：
> map_bg + 10 地標〔9 山＋貢院〕+ player 3 張 + seal + og + favicon）。

## 落盤清單（實際檔案，共 17 個）

```
翰墨江山/assets/img/map_bg.jpg
翰墨江山/assets/img/landmark_cap-guowen.png
翰墨江山/assets/img/landmark_gsat-guowen.png
翰墨江山/assets/img/landmark_tvet-guowen.png
翰墨江山/assets/img/landmark_xingyin-doushi.png
翰墨江山/assets/img/landmark_wenxin-diaolong.png
翰墨江山/assets/img/landmark_wenhao-xiaozhuan.png
翰墨江山/assets/img/landmark_wenyan-jieyou-zhan.png
翰墨江山/assets/img/landmark_zizizhuji.png
翰墨江山/assets/img/landmark_reading-expedition.png
翰墨江山/assets/img/landmark_yamen.png
翰墨江山/assets/img/player_idle.png
翰墨江山/assets/img/player_walk1.png
翰墨江山/assets/img/player_walk2.png
翰墨江山/assets/img/seal.png
翰墨江山/assets/img/og.jpg
翰墨江山/assets/img/favicon.png
```

## 座標依據（`翰墨江山/data/sites.js`，x/y 為地圖上相對位置，僅供地標疊圖時參考）

| id | mountain | x | y |
|---|---|---|---|
| cap-guowen | 泰山 | 2050 | 520 |
| gsat-guowen | 衡山 | 1750 | 1250 |
| tvet-guowen | 恆山 | 1350 | 300 |
| xingyin-doushi | 華山 | 1450 | 780 |
| wenxin-diaolong | 嵩山 | 1650 | 700 |
| wenhao-xiaozhuan | 廬山 | 2200 | 1050 |
| wenyan-jieyou-zhan | 終南山 | 950 | 850 |
| zizizhuji | 峨眉山 | 450 | 1050 |
| reading-expedition | 梁山 | 2350 | 750 |
| yamen | 貢院（西南角平地） | 900 | 1300 |

## Lane 分工

- **Lane A**：map_bg + landmark 1–5（cap-guowen / gsat-guowen / tvet-guowen / xingyin-doushi / wenxin-diaolong）
- **Lane B**：landmark 6–10（wenhao-xiaozhuan / wenyan-jieyou-zhan / zizizhuji / reading-expedition / yamen）+ player 三張 + seal + og + favicon

## 主角一致性鐵則

player_idle 先生成，player_walk1 / player_walk2 用 player_idle.png 當 `-i` reference image，
prompt 明寫「三張為同一角色，服色（藍衫）、背書簍、卷軸、頭身比 1:2 完全一致，僅動作不同」。

## 執行規則（強制）

1. 每張 prompt 走 stdin（不用 `-i` 位置參數吃 prompt），固定加 `-c 'features.code_mode_host=false'`。
2. 單張 timeout ~200s（看門狗 `( sleep 220; kill $PID ) &` 或等效機制）。
3. 已存在且達門檻的檔案 SKIP，可重跑失敗張。
4. 每張生成後必 shell 驗證：`map_bg.jpg` / `og.jpg` > 600KB；其餘 PNG > 80KB 且檔案存在；
   未達門檻視為失敗，重跑（單張最多 3 次）。
5. landmark／player／seal 為透明背景 PNG；若模型輸出帶底色，prompt 加強
   `transparent background, isolated on transparent, PNG alpha channel, no background color fill`
   後重生。
6. 圖內禁任何文字（含中文字、印章字可抽象化）、禁簡體字樣、禁寫實照片感。
