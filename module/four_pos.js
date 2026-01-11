// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: yin-yang;
/**
 * 手动修改第 8 行的数字
 * 连续未中自动投 ‼️‼️‼️
 * 设置为 0：命中继续投，不中一直停
 * 设置为 1：不论中或不中，每期都投
 * 设置为 3：连续未中 3 期后自动投
 */
const missLimit = 1


/** =======💜 统计盈亏 💜======= */
const isDev = false
const fm = FileManager.local();
const basePath = fm.joinPath(fm.documentsDirectory(), '95du_lottery');
if (!fm.fileExists(basePath)) fm.createDirectory(basePath);

const imageUrl = `https://raw.githubusercontent.com/95du/scripts/master/img/background/glass_2.png`;
const boxjsApi = 'http://boxjs.com/query/data';
const github = 'https://raw.githubusercontent.com/95du/scripts/master/module';

const autoUpdate = async () => {
  const script = await new Request(`${github}/four_pos.js`).loadString();
  fm.writeString(module.filename, script);
};
autoUpdate();

const getBoxjsData = async (key = 'bet_data') => {
  try {
    const data = await new Request(`${boxjsApi}/${key}`).loadJSON();
    return JSON.parse(data.val);
  } catch {}
};

// ✅ 保存 BoxJs 数据
const saveBoxJsData = async (value, key = 'bet_data') => {
  const req = new Request('https://boxjs.com/api/save');
  req.method = 'POST';
  req.headers = { 'Content-Type': 'application/json' };
  req.body = JSON.stringify([{ key, val: JSON.stringify(value) }]);
  try {
    return await req.loadJSON();
  } catch (e) {
    console.error(e);
  }
};

// 🈯️ 获取记录数据
const getRecordRows = async () => {
  const data = await getCacheData('record_rows.json', `${boxjsApi}/record_rows`, 'json', 4);
  let list = JSON.parse(data || '[]');
  if (!Array.isArray(list) || !list.length) {
    list = await new Request(`${github}/records.json`).loadJSON()
    await saveBoxJsData(list, 'record_rows');
  }
  return list;
};

// ✅ 缓存文件
const getCacheData = async (name, url, type = 'json', cacheHours = 4) => {
  const path = fm.joinPath(basePath, name);
  const isExpired = () => {
    fm.fileExists(path) && (Date.now() - fm.creationDate(path).getTime()) / 36e5 > cacheHours;
  }
  const read = () => {
    if (fm.fileExists(path)) {
      if (isExpired()) {
        fm.remove(path);
        return null;
      }
      if (type === 'img') return fm.readImage(path);
      if (type === 'json') return JSON.parse(fm.readString(path));
      return fm.readString(path);
    }
  };
  const write = (data) => {
    if (type === 'img') fm.writeImage(path, data);
    else fm.writeString(path, type === 'json' ? JSON.stringify(data) : data);
  };

  const cached = read();
  if (cached) return cached;
  const req = new Request(url);
  if (type === 'img') data = await req.loadImage();
  else if (type === 'json') {
    const res = await req.loadJSON();
    data = res?.val ?? res;
  } else data = await req.loadString();
  if (data) write(data);
  return data;
};

const presentSheetMenu = async (message, opt = [], sel = null) => {
  const alert = new Alert();
  alert.message = message;
  opt.forEach(option => {
    option === sel ? alert.addDestructiveAction(option) : alert.addAction(option);
  });
  alert.addCancelAction('取消');
  return await alert.presentSheet();
};

// 解析 body
const parseBetBody = (body) => {
  let decoded = '';
  try { decoded = decodeURIComponent(body); } catch { decoded = body || ''; }
  const bet_log = decoded.match(/bet_log=([^&]*)/)?.[1] || '';
  const bet_number = decoded.match(/bet_number=([^&]*)/)?.[1] || '';
  const numCount = bet_number.split(",").length || '';
  const number_type = decoded.match(/number_type=([^&]*)/)?.[1] || '';
  return { 
    bet_number, 
    numCount,
    bet_log, 
    number_type 
  };
};

// 解析四定位号码
const parseBetNumbers = (body) => parseBetBody(body).bet_number.split(',').filter(n => /^\d{4}$/.test(n));

// 获取开奖号码
const drawNumber = r => `${r.thousand_no}${r.hundred_no}${r.ten_no}${r.one_no}`;

// 判断某一期是否命中
const isHit = (row, bodies) => {
  if (!bodies?.length) return false;
  const num = drawNumber(row);
  return bodies.some(b => parseBetNumbers(b).includes(num));
};

const sliceByTime = (rows, targetTime, field = "period_datetime") => {
  if (!rows?.length) return;
  const index = rows.findIndex(
    item => (item[field]?.split(" ")[1] || "").slice(0, 5) === targetTime
  );
  return index !== -1 ? rows.slice(0, index + 1) : [];
};

// ✅ 普通回放
const replayNormal = (rows, rule) => {
  const bodies = [rule.body];
  let totalProfit = 0;
  let win = 0, lose = 0, score = 0;

  const cost = parseBetNumbers(rule.body).length;
  const prize = 9920 - cost;
  const ordered = rows.slice().reverse();
  const records = [];

  ordered.forEach(r => {
    const open_code = drawNumber(r);
    const time = r.draw_datetime?.slice(11, 16);
    const period_no = r.period_no.slice(-3);
    const hit = isHit(r, bodies);

    if (hit) {
      win++; score++; 
      totalProfit += prize;
    } else {
      lose++; score--; 
      totalProfit -= cost;
    }

    records.push({
      hit,
      hit_icon: hit ? '✅' : '🚫',
      time,
      period_no,
      open_code,
      action: '投',
      profit: totalProfit,
      forced: false
    });
  });

  return {
    mode: 'normal',
    title: rule.title,
    desc: '普通规则：每期都投 ( 默认 )',
    summary: {
      total: rows.length,
      win,
      lose,
      unbet: 0,
      score,
      profit: totalProfit
    },
    records: records.reverse()
  };
};

// ✅ 模拟投注回放
const replaySimulate = (rows, rule, lastRow) => {
  const bodies = [rule.body];
  let canBet = lastRow ? isHit(lastRow, bodies) : false;
  let totalProfit = 0;
  let win = 0, lose = 0, score = 0;
  let missCount = 0;
  let forceBet = false;
  let unbet = 0;

  const cost = parseBetNumbers(rule.body).length;
  const prize = 9920 - cost;
  const ordered = rows.slice().reverse();
  const records = [];

  ordered.forEach(r => {
    const open_code = drawNumber(r);
    const time = r.draw_datetime?.slice(11, 16);
    const period_no = r.period_no.slice(-3);
    const hit = isHit(r, bodies);

    if (!canBet && !forceBet && missLimit !== 1) {
      unbet++;

      if (hit) {
        canBet = true;
        missCount = 0;
      } else {
        missCount++;
        if (missLimit > 0 && missCount >= missLimit) forceBet = true;
      }

      records.push({
        hit,
        hit_icon: hit ? '✅' : '⏸️',
        time,
        period_no,
        open_code,
        action: '停',
        profit: totalProfit,
        forced: false
      });
      return;
    }

    let forced = forceBet;
    if (forceBet) canBet = true;

    if (hit) {
      win++; score++; 
      totalProfit += prize;
      missCount = 0;
      canBet = true;
      forceBet = false;
    } else {
      lose++; score--; 
      totalProfit -= cost;
      missCount++;
      if (!forceBet) canBet = false;
    }

    records.push({
      hit,
      hit_icon: hit ? '✅' : '🚫',
      time,
      period_no,
      open_code,
      action: '投',
      profit: totalProfit,
      forced
    });
  });

  return {
    mode: 'simulate',
    title: rule.title,
    desc: `指定规则：不中即停，中则继续，${missLimit} 期未中强制投`,
    summary: {
      total: rows.length,
      win,
      lose,
      unbet,
      score,
      profit: totalProfit
    },
    records: records.reverse()
  };
};

// ✅ 规则列表
const getRuleList = async (bodies) => {
  return bodies.map((b, i) => {
    const info = parseBetBody(b);
    if (info.number_type !== '40') return null;
    return { 
      index: i, 
      body: b, 
      title: info.bet_log, 
      label: `规则 ${i + 1} - ${info.numCount} 组`
    };
  }).filter(Boolean);
};

// ✅ 日期列表
const getDateList = async () => {
  const records = await getRecordRows();
  const today = new Date().toISOString().slice(0, 10);
  const hasToday = records[0]?.date === today;
  const dates = hasToday
    ? records.map(r => r.date)
    : [today, ...records.map(r => r.date)];
  return { dates, records, hasToday };
};

const getReplayData = async (date, ruleId, bodies, drawRows) => {
  const rules = await getRuleList(bodies);
  const { dates, records, hasToday } = await getDateList();
  const rule = rules.find(r => r.index == ruleId);
  if (!rule) return null;
  let rows = [];
  let lastRow = null;

  // 今日数据
  if (date === dates[0] && !hasToday) {
    rows = drawRows;
    lastRow = records[0]?.data?.[0];
  } else {
    const idx = records.findIndex(r => r.date === date);
    rows = records[idx]?.data || [];
    lastRow = records[idx + 1]?.data?.[0] || null;
  }

  return {
    rules: rules.map(r => ({ id: r.index, label: r.label, body: r.body })),
    dates: dates.map(d => ({ value: d, label: d })),
    normal: replayNormal(rows, rule),
    simulate: replaySimulate(rows, rule, lastRow)
  };
};

const getModule = async (selected) => {
  const codeMaker = await getCacheData('codeMaker.js', `${github}/codeMaker.js`, 'js', 24);
  await getCacheData('kuaixuan.js', `${github}/kuaixuan.js`, 'js', 4);
  if (typeof require === 'undefined') require = importModule;
  const { CodeMaker } = require(isDev ? './kuaixuan' : `${basePath}/kuaixuan`);
  const module = await new CodeMaker(codeMaker, selected);
  return module;
};

// ✅ 回放主函数
const statMenu = async () => {
  const [betData, agentData] = await Promise.all([
    getBoxjsData('bet_data'),
    getBoxjsData('agent_data')
  ]);
  const account = betData[0];
  const bodies = account.settings.custom?.fastPick || []
  const drawRows = sliceByTime(agentData.drawRows || [], "08:05");

  const kx = await getModule(account);
  const today = new Date().toISOString().slice(0, 10);
  const statData = await getReplayData(today, 0, bodies, drawRows);
  if (!statData) return;
  
  const html = await kx.replayHtml(statData);
  const webView = new WebView();
  await webView.loadHTML(html);
  const injectListener = async () => {
    const event = await webView.evaluateJavaScript(`
      (() => {
        const controller = new AbortController();
        const listener = (e) => {
          completion(e.detail);
          controller.abort();
        };
      window.addEventListener('JBridge', listener, { signal: controller.signal });
      })()`, true
    ).catch(err => console.error(err));
    if (event.type === 'query') {
      const data = await getReplayData(event.date, event.ruleId, bodies, drawRows);
      await webView.evaluateJavaScript(
        `window.renderReplay(${JSON.stringify(data)})`
      );
    }
    injectListener();
  };
  injectListener();
  await webView.present();
};

// 🈯️ 处理小组件数据逻辑
const pickFastPickFromAccount = (account) => {
  const list = account.settings.custom?.fastPick || []
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
};

const pickStrategyOnce = async () => {
  const betData = await getBoxjsData('bet_data') || [];
  const validAccs = betData.filter(acc => (acc.settings?.custom?.fastPick || []).some(a => a?.length));
  if (!validAccs.length) return null;
  const account = validAccs[Math.floor(Math.random() * validAccs.length)];
  const fastPick = pickFastPickFromAccount(account);
  return fastPick ? { account, fastPick } : null;
};

const runReplayCollect = async (rows, date, lastRow, account, rule) => {
  if (!rows?.length) return null;
  const sim = replaySimulate(rows, rule, lastRow);
  
  return {
    account: account.Data.member_account,
    credit_balance: account.Data.credit_balance,
    title: parseBetBody(rule.body).bet_log,
    date,
    profit: sim.summary.profit,
  };
};

const collectAllRecords = async () => {
  const [list, draw, accent] = await Promise.all([
    getBoxjsData('record_rows'),
    getBoxjsData('agent_data'),
    pickStrategyOnce()
  ]);
  
  if (!Array.isArray(list) || !list.length || !accent || !draw) {
    return { results: [], total: 0 };
  }
  
  const records = list.slice(0, 10);
  const { account, fastPick } = accent;
  const rows = sliceByTime(draw.drawRows, "08:05");
  const lastRow = records[0]?.data?.[0]
  
  const rule = { body: fastPick };
  const replayData = replaySimulate(rows, rule, lastRow);
  const numCount = parseBetBody(fastPick).numCount;
  const bet_log = parseBetBody(fastPick).bet_log;
  const today = new Date().toISOString().slice(0, 10);
  const tasks = [];
  
  // 今日
  if (records[0]?.date !== today) {
    tasks.push((async () => {
      return runReplayCollect(rows, today, lastRow, account, rule);
    })());
  }

  // 历史
  records.forEach((record, idx) => {
    const lastRow = records[idx + 1]?.data?.[0] || null;
    tasks.push(
      runReplayCollect(record.data, record.date, lastRow, account, rule)
    );
  });

  const results = (await Promise.all(tasks)).filter(Boolean);
  const total = results.reduce((s, r) => s + (r.profit || 0), 0);
  return { 
    todayList: replayData.records, 
    results, 
    total, 
    numCount,
    bet_log
  };
};

// 🈯️ 小组件排列逻辑
const getRank = async (stack, { column }) => {
  let i = -1;
  const rows = [];
  const add = async (fn) => {
    i++;
    if (i % column === 0) {
      stack.layoutVertically();
      rows.push(stack.addStack());
    }
    const r = Math.floor(i / column);
    await fn(rows[r]);
  };
  return { add };
};

const addItem = async (widget, item, max, index, large, small) => {
  const stack = widget.addStack();
  stack.layoutHorizontally();
  stack.centerAlignContent();
  stack.size = new Size(0, large ? 22 : 20);

  const indexStack = stack.addStack();
  indexStack.size = new Size(large ? 20 : 19, 0);
  if (large) {
    const indexText = indexStack.addText(item.hit ? '✅' : (item.action === '停' ? '⏸️' : '🚫'));
    indexText.font = Font.boldSystemFont(15);
  } else {
    const indexText = indexStack.addText(String(index));
    indexText.font = Font.boldSystemFont(15);
    const textColor = index <= 3 
      ? '#FF0000' 
      : index <= 6
      ? small ? '#00C400' : '#FCA100' 
      : '#00C400';
    indexText.textColor = new Color(textColor);
  }
  
  stack.addSpacer(5);
  const dateTime = large ?  item.time : item.date.slice(5);
  const titleText = stack.addText(dateTime);
  titleText.font = Font.mediumSystemFont(15);
  titleText.textColor = Color.dynamic(new Color('000000', 0.8), new Color('FFFFFF', 0.9));
  stack.addSpacer(8);
  
  const profitText = stack.addText(String(item.profit));
  profitText.font = Font.mediumSystemFont(15);
  profitText.textColor = large && item.forced 
    ? new Color('#FF6800') 
    : large 
      ? Color.blue() 
      : (item.profit < 0 ? Color.red() : Color.blue());
  stack.addSpacer();
};

// ✅ 创建组件
const createWidget = async (data) => {
  const { account } = data.results[0];
  const rawText = data.bet_log.replace(/\[四定位\]，?/g, '');
  const titleText =
    data.bet_log.length <= 20
      ? rawText
      : data.bet_log.length <= 40
        ? rawText.replace(/：.*$/, '')
        : `隔 ${missLimit} 期未中强制投`;
  
  const family = config.widgetFamily;
  const small = family === 'small';
  const large = family === 'large';
  
  const widget = new ListWidget();
  widget.setPadding(...(large ? [15, 20, 18, 15] : [15, 18, 15, 15]));
  widget.url = 'scriptable:///run/' + encodeURIComponent(Script.name());
  if (family === 'medium') {
    widget.backgroundImage = await getCacheData('glass', imageUrl, 'img');
  }
  widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  mainStack.addSpacer(5);
  
  const topStack = mainStack.addStack();
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  topStack.addSpacer(6.5);
  
  const columnStack = topStack.addStack();
  columnStack.size = new Size(7, 23);
  columnStack.cornerRadius = 50;
  columnStack.backgroundColor = new Color('#8B5FF4');
  topStack.addSpacer(10);
  
  if (!small) {
    const nameText = topStack.addText(`${data.numCount} 组，${titleText}`);
    nameText.font = Font.mediumSystemFont(16);
    nameText.textOpacity = 0.9
    topStack.addSpacer(10);
    
    const barStack = topStack.addStack();
    barStack.setPadding(2, 7, 2, 7);
    barStack.cornerRadius = 7;
    barStack.backgroundColor = data.total < 0 ? Color.red() : Color.blue();
    const statusText = barStack.addText(`${data.total}`);
    statusText.font = Font.boldSystemFont(14);
    statusText.textColor = Color.white();
  }
  
  if (small) {
    const dateText = topStack.addText(`${data.numCount}组隔${missLimit}期`);
    dateText.font = Font.systemFont(16);
    dateText.textOpacity = 0.9
  }
  mainStack.addSpacer();
  
  const stackItems = widget.addStack();
  const count = small ? 1 : 2;
  const line = large ? 14 : 5;
  const items = large ? 'todayList' : 'results';
  const { add } = await getRank(stackItems, { column: count });
  const max = line * count;
  for (let i = 0; i < max; ++i) {
    const item = data[items][i];
    if (!item) continue;
    await add(stack => addItem(stack, item, max, i + 1, large, small));
  };
  mainStack.addSpacer();
  return widget;
};

// 🈯️ 错误组件
const createErrorWidget = () => {
  const widget = new ListWidget();
  const text = widget.addText('某账号未写入规则');
  text.font = Font.systemFont(17);
  text.centerAlignText();
  Script.setWidget(widget);
};

await (async () => {
  if (config.runsInApp) {
    await statMenu();
  } else {
    const finalResults = await collectAllRecords();
    if (!finalResults.results.length) {
      return await createErrorWidget();
    }
    const widget = await createWidget(finalResults);
    if (config.runsInApp) {
      widget.presentMedium();
    } else {
      Script.setWidget(widget);
      Script.complete();
    }
  }
})();