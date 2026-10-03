import { mkdir, readFile, writeFile } from 'node:fs/promises';

const apiRoot = 'https://lottery.timetable.tw/api';
const minExpectedDraws = 1000;

async function getJson(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'number-group-history-daily-sync' },
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`資料來源回覆 ${response.status}: ${url}`);
  return response.json();
}

const games = await getJson(`${apiRoot}/games`);
const game = games.find((item) => {
  const label = `${item.name} ${item.display_name} ${item.slug}`;
  return /39/.test(label) && /樂合彩|he-cai|lotto39/i.test(label);
});
if (!game) throw new Error('資料來源中找不到 39 樂合彩遊戲');

const all = [];
let offset = 0;
let totalCount = Infinity;
while (offset < totalCount) {
  const query = new URLSearchParams({
    gameTypeId: String(game.id),
    limit: '500',
    offset: String(offset),
    sortOrder: 'ASC',
  });
  const page = await getJson(`${apiRoot}/draws?${query}`);
  const records = Array.isArray(page.records) ? page.records : [];
  totalCount = Number(page.totalCount ?? offset + records.length);
  all.push(...records.map((draw) => ({
    period: String(draw.period || ''),
    date: String(draw.draw_date || ''),
    numbers: draw.numbers || [],
  })));
  offset += records.length;
  if (!records.length) break;
}

const unique = [...new Map(all.map((draw) => [draw.period, draw])).values()]
  .filter((draw) => /^\d{9}$/.test(draw.period)
    && /^\d{4}-\d{2}-\d{2}$/.test(draw.date)
    && draw.numbers.length === 5
    && new Set(draw.numbers).size === 5
    && draw.numbers.every((number) => Number.isInteger(number) && number >= 1 && number <= 39))
  .sort((a, b) => a.period.localeCompare(b.period));

if (unique.length < minExpectedDraws) {
  throw new Error(`只取得 ${unique.length} 期，低於完整歷史資料檢查門檻；保留既有資料，不會覆蓋。`);
}

const output = {
  source: '公開 39 樂合彩歷史資料 API（依台灣彩券公開開獎資訊彙整）',
  sourceUrl: 'https://lottery.timetable.tw/draws/39-le-he-cai',
  updatedAt: new Date().toISOString(),
  totalCount: unique.length,
  records: unique,
};
const path = 'data/history.json';
await mkdir('data', { recursive: true });
let previous = '';
try { previous = await readFile(path, 'utf8'); } catch {}
const next = `${JSON.stringify(output, null, 2)}\n`;
if (previous !== next) {
  await writeFile(path, next, 'utf8');
  console.log(`更新 ${path}：${unique.length} 期，最新一期 ${unique.at(-1).period}（${unique.at(-1).date}）。`);
} else {
  console.log(`資料沒有變化：${unique.length} 期，最新一期 ${unique.at(-1).period}。`);
}
