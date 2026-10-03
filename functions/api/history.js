export async function onRequestGet({ request, waitUntil }) {
  const cache = caches.default;
  const url = new URL(request.url);
  const key = new Request(`${url.origin}/api/history`);
  const cached = await cache.match(key);
  if (cached) return cached;

  try {
    const api = 'https://lottery.timetable.tw/api';
    const gamesResponse = await fetch(`${api}/games`, {
      headers: { Accept: 'application/json' },
    });
    if (!gamesResponse.ok) throw new Error('無法取得彩券清單');
    const games = await gamesResponse.json();
    const game = games.find((item) => {
      const label = `${item.name} ${item.display_name} ${item.slug}`;
      return /39/.test(label) && /樂合彩|he-cai|lotto39/i.test(label);
    });
    if (!game) throw new Error('找不到 39 組歷史資料');

    const records = [];
    let offset = 0;
    let totalCount = Infinity;
    while (offset < totalCount) {
      const query = new URLSearchParams({
        gameTypeId: String(game.id),
        limit: '500',
        offset: String(offset),
        sortOrder: 'ASC',
      });
      const response = await fetch(`${api}/draws?${query}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error('讀取歷史開獎資料失敗');
      const page = await response.json();
      const batch = Array.isArray(page.records) ? page.records : [];
      totalCount = Number.isFinite(page.totalCount) ? page.totalCount : offset + batch.length;
      records.push(...batch.map((draw) => ({
        period: String(draw.period || ''),
        date: String(draw.draw_date || ''),
        numbers: draw.numbers || [],
      })));
      offset += batch.length;
      if (!batch.length) break;
    }

    const body = JSON.stringify({ records, totalCount: records.length, updatedAt: new Date().toISOString() });
    const result = new Response(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=86400',
      },
    });
    waitUntil(cache.put(key, result.clone()));
    return result;
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message || '歷史資料暫時無法取得' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }
}
