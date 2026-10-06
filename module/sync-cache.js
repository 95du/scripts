const fs = require('fs');
const path = require('path');

const memberApi = process.env.MEMBER_API;
const cookie = process.env.MEMBER_COOKIE;
const cacheFile = path.join(__dirname, 'records_cache.json');
const maxPages = 17;
const maxRecords = 252;

if (!memberApi || !cookie) throw new Error('缺少 MEMBER_API 或 MEMBER_COOKIE');

const headers = {
  'User-Agent': 'Mozilla/5.0',
  'X-Requested-With': 'XMLHttpRequest',
  'Cookie': cookie
};

const fetchPage = async page => {
  try {
    const res = await fetch(`${memberApi}/DrawNo/GetDrawNoTable?pageindex=${page}`, {
      headers
    });
    const data = await res.json();
    return data?.Status === 1 && Array.isArray(data?.Data?.Rows) ? data.Data.Rows : [];
  } catch {
    return [];
  }
};

const getDrawNoTable = async (pages, retry = 3) => {
  let result = Array(pages).fill(null);
  for (let n = 0; n < retry && result.some(v => !v); n++) {
    const pending = result.map((v, i) => !v ? i + 1 : 0).filter(Boolean);
    const rows = await Promise.all(pending.map(fetchPage));
    pending.forEach((page, i) => {
      result[page - 1] = rows[i];
    });
  }
  return result.flatMap(v => v || []);
};

const isNormalJump = (a, b) => {
  const x = String(a.period_no).slice(-3);
  const y = String(b.period_no).slice(-3);
  return (x === '097' && y === '060') || (x === '001' && y === '288');
};

const hasGap = rows => rows.some((a, i) => {
  const b = rows[i + 1];
  if (!b || isNormalJump(a, b)) return false;
  return Math.abs(new Date(a.draw_datetime) - new Date(b.draw_datetime)) / 60000 > 5;
});

const mergeData = async (oldData, newData) => {
  if (!oldData.length) return newData.sort((a, b) => +b.period_no - +a.period_no).slice(0, maxRecords);
  if (!newData.length) return oldData;

  let result = [...new Map([...oldData, ...newData].map(v => [v.period_no, v])).values()]
    .sort((a, b) => +b.period_no - +a.period_no)
    .slice(0, maxRecords);

  if (hasGap(result)) {
    const fullData = await getDrawNoTable(maxPages);
    if (fullData.length) {
      result = [...new Map(fullData.map(v => [v.period_no, v])).values()]
        .sort((a, b) => +b.period_no - +a.period_no)
        .slice(0, maxRecords);
    }
  }

  return result;
};

const readCache = () => {
  try {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  } catch {
    return [];
  }
};

const saveCache = data => {
  fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf8');
};

(async () => {
  const cache = readCache();
  const pages = cache.length ? 1 : maxPages;
  const newData = await getDrawNoTable(pages);
  if (!newData.length) throw new Error('开奖结果请求失败');
  const result = await mergeData(cache, newData);
  saveCache(result);
  console.log(`缓存更新：${result.length}/252`);
})();
