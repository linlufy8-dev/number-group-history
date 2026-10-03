# 英文組歷史統計網站

網站會載入 `data/history.json` 中的完整歷史紀錄。GitHub Actions 每天台灣時間 05:30 取得並驗證全部期別；資料有變動時才更新 JSON 並提交到 `main`。Cloudflare Pages 連接此 repo 後，會在資料更新提交後自動重新部署，訪客打開網站即可讀到新資料。更新流程也可在 GitHub Actions 手動執行。

資料服務採公開唯讀 API，該服務彙整台灣彩券公開開獎資訊；實際獎號請以[台灣彩券官方結果頁](https://www.taiwanlottery.com/lotto/result/39_m5)為準。同步腳本要求至少取得 1,000 期且每筆資料通過格式檢查才會覆蓋網站資料。

## Cloudflare Pages 設定

1. 在 Cloudflare Workers & Pages 選擇建立 Pages 專案並連接 GitHub 儲存庫 `linlufy8-dev/number-group-history`。
2. Production branch 設為 `main`，Framework preset 選 `None`，Build command 留空，Build output directory 設為 `.`。
3. 開始部署後，Cloudflare 會提供公開的 `pages.dev` 網址；後續每日資料提交會觸發自動部署。

## 網站功能

- 可依最近 30、50、100、500、1,000 期、最近一個月、最近兩個月、全部或自訂期數產生組別統計。
- 可用期別、日期或號碼搜尋歷史開獎紀錄。
- 支援 CSV/TXT 匯入、貼上資料與下載統計 CSV。
- `functions/api/history.js` 提供 Cloudflare Pages 的備援資料代理；正常情況優先讀取每日同步的 `data/history.json`。
