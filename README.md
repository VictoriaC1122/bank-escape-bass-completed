# 銀行逃犯逃脫記 完成版備份

這個 repo 是 BASS 遊戲《銀行逃犯逃脫記》的靜態備份與補完版。

## Play

- GitHub Pages 入口：`index.html`
- 本地入口：`play/index.html`
- 完成版劇本 XML：`games/005/56203040.xml`

## 補完內容

- 補上 `想出去` 路線中缺失的三個舞台：
  - `星雲都昏`
  - `愛小雪`
  - `關心星雲`
- 補完原本空白的 `鈴兒與星雲2`
- 新增主線收束：
  - `真正的出口`
  - `好結局`
- 使用遊戲內已下載素材重新合成新版封面：`games/cover/56203040.jpg`

## 驗證

- `games/005/56203040.xml` 可被 XML parser 正常解析。
- 缺失 stage reference：0。
- 素材下載清單在 `tools/asset-urls.tsv`。
- 下載器在 `tools/download-assets.zsh`。

## 原始備份

- `original-game-page.html`
- `original-56203040.xml`
- `games/cover/original-56203040.jpg`
- `completed-56203040.xml`
- `inspection-report.md`
