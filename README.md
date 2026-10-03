# 英文組歷史統計網站

這是一個可部署到 Cloudflare Pages 的靜態網站，含 Pages Function 作為歷史資料快取代理。訪客開啟網站時會讀取完整 39 組歷史資料，並可搜尋期別、日期與開獎號碼。歷史資料由公開唯讀 API 提供；快取有效期 30 分鐘。頁面另內含整理好的 239 期作為離線備援。

## 發佈為公開網站

1. 將此資料夾內容放入一個 GitHub 儲存庫。
2. 在 Cloudflare Pages 建立專案並連接該儲存庫。
3. Framework preset 選 `None`，Build command 留空，Build output directory 設為 `.`。
4. 完成部署後，Cloudflare Pages 會提供可公開分享的 `pages.dev` 網址；也可在 Cloudflare 設定自訂網域。

若要從本機用 Wrangler 部署，先安裝 Wrangler 並登入 Cloudflare，再於此資料夾執行 `wrangler pages deploy .`。

## 資料與統計

- 頁面開啟時自動取得歷史期別；「更新線上歷史」可手動重新整理。
- 支援最近 100、500、1,000 期、全部或自訂期數的統計報告。
- 可按期別、日期或開獎號碼搜尋歷史紀錄，結果可分頁瀏覽。
- 可匯入 CSV/TXT、貼上期別資料，並下載目前報告 CSV。
- 來源服務的資料可能更新或暫時無法連線；線上載入失敗時，頁面保留內含資料與手動匯入功能。
