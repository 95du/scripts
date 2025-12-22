// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: yin-yang;
/**
 * 手动修改第 8 行的数字
 * 连续未中自动投注 ‼️‼️‼️
 * 设置为 0：关闭此功能，不中一直停
 * 设置为 1：不论中或不中，每期都投
 * 设置为 3：连续未中 3 期后自动投注
 */
const missLimit = 0


/** =======💜 统计盈亏 💜======= */
const fm = FileManager.local();
const basePath = fm.joinPath(fm.documentsDirectory(), 'lottery');
if (!fm.fileExists(basePath)) fm.createDirectory(basePath);

const imageUrl = `https://raw.githubusercontent.com/95du/scripts/master/img/background/glass_2.png`;
const boxjsApi = 'http://boxjs.com/query/data';

const getBoxjsData = async (key = 'bet_data') => {
  try {
    const data = await new Request(`${boxjsApi}/${key}`).loadJSON();
    return JSON.parse(data.val);
  } catch {}
};

const autoUpdate = async () => {
  const script = await new Request('https://raw.githubusercontent.com/95du/scripts/master/module/stat_four_pos_2.js').loadString();
  fm.writeString(module.filename, script);
};

// ✅ 缓存文件
const getCacheData = (name, url, type = 'json', cacheHours = 4) => {
  const path = fm.joinPath(basePath, name);
  const isExpired = () => cacheHours !== undefined && fm.fileExists(path) &&
    (Date.now() - fm.creationDate(path).getTime()) / 36e5 > cacheHours;
  const read = () => {
    if (!fm.fileExists(path) || isExpired()) return null;
    if (type === 'img') return fm.readImage(path);
    if (type === 'json') return JSON.parse(fm.readString(path));
    return fm.readString(path);
  };
  const write = (data) => {
    if (type === 'img') fm.writeImage(path, data);
    else fm.writeString(path, type === 'json' ? JSON.stringify(data) : data);
  };
  return (async () => {
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
  })();
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
  const number_type = decoded.match(/number_type=([^&]*)/)?.[1] || '';
  return { 
    bet_number, 
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
  const index = rows.findIndex(
    item => (item[field]?.split(" ")[1] || "").slice(0, 5) === targetTime
  );
  return index !== -1 ? rows.slice(0, index + 1) : [];
};

// ✅ 普通回放
const replayNormal = (rows, bodies) => {
  let win = 0, lose = 0, score = 0;
  let totalProfit = 0;
  const cost = parseBetNumbers(bodies[0]).length;
  const prize = 9920 - cost;
  const ordered = rows.slice().reverse();
  const lines = [];
  
  ordered.forEach(r => {
    const num = drawNumber(r);
    const time = r.draw_datetime?.slice(11, 16);
    const period = r.period_no.slice(-3);
    const hit = bodies.some(b => parseBetNumbers(b).includes(num));

    if (hit) {
      win++; score++;
      totalProfit += prize;
      lines.push(` ✅ ${time} - ${period}期   【 ${num} 】     ${totalProfit}`);
    } else {
      lose++; score--;
      totalProfit -= cost;
      lines.push(` 🚫 ${time} - ${period}期   【 ${num} 】     ${totalProfit}`);
    }
  });

  return {
    win, lose, score,
    total: rows.length,
    totalProfit,
    lines: lines.reverse()
  };
};

// ✅ 模拟投注回放
const replaySimulate = (rows, bodies, lastRow, isToday = false) => {
  let canBet = lastRow ? isHit(lastRow, bodies) : false;
  let win = 0, lose = 0, score = 0;
  let totalProfit = 0;
  const cost = parseBetNumbers(bodies[0]).length;
  const prize = 9920 - cost;
  const ordered = rows.slice().reverse();
  const tempLines = [];
  const todayList = [];
  let missCount = 0;
  let forceBet = false;

  ordered.forEach(r => {
    const num = drawNumber(r);
    const time = r.draw_datetime?.slice(11, 16);
    const period = r.period_no.slice(-3);
    const hit = isHit(r, bodies);

    /** 未投注状态 */
    if (!canBet && !forceBet && missLimit !== 1) {
      if (!isToday) {
        tempLines.push(` ${hit ? '✅' : '⏸️'} ${time} - ${period}期 【 ${num} 】 ${hit ? '投 →' : '停'}`);
      } else {
        todayList.push({
          time,
          hit,
          action: hit ? '投' : '停',
          forced: false,
          profit: totalProfit
        });
      }

      if (hit) {
        canBet = true;
        missCount = 0;
      } else {
        missCount++;
        if (missLimit > 0 && missCount === missLimit) {
          forceBet = true;
        }
      }
      return;
    }

    /** 正常 / 强制 / missLimit = 1 */
    const isForce = forceBet && !canBet;
    forceBet = false;
    canBet = true;

    if (hit) {
      win++;
      score++;
      totalProfit += prize;
      missCount = 0;
      canBet = true;
    } else {
      lose++;
      score--;
      totalProfit -= cost;
      missCount = 1;
      canBet = missLimit === 1;
    }

    if (!isToday) {
      tempLines.push(` ${hit ? '✅' : '🚫'} ${time} - ${period}期 【 ${num} 】 (投)${isForce ? ' ⚠️' : ''} ${totalProfit}`);
    } else {
      todayList.push({
        time,
        hit,
        action: '投',
        forced: isForce,
        profit: totalProfit
      });
    }
  });

  /** 返回分流 */
  return isToday ? { todayList: todayList.reverse().slice(0, 28) } : {
    win,
    lose,
    score,
    totalProfit,
    total: rows.length,
    lines: tempLines.reverse()
  };
};

// ✅ 选择 fastPick
const chooseFastPick = async (bodies) => {
  const filtered = bodies.filter(b => {
    const { number_type } = parseBetBody(b);
    return number_type === '40';
  });
  if (!filtered.length) return null;

  const alert = new Alert();
  alert.message = filtered.map((b, i) => `${i + 1}、${parseBetBody(b).bet_log}`).join('\n');
  filtered.forEach((b, i) => {
    const { bet_number } = parseBetBody(b);
    alert.addAction(`规则 ${i + 1} - ${bet_number.split(',').length} 组`);
  });
  alert.addCancelAction('取消');
  const idx = await alert.presentSheet();
  if (idx === -1) return null;
  return { body: filtered[idx], title: parseBetBody(filtered[idx]).bet_log };
};

// ✅ 获取当前账号请求体
const getBetBody = async (drawRows) => {
  const rows = sliceByTime(drawRows, "08:05");
  if (!rows?.length) return;
  const betData = await getBoxjsData('bet_data') || [];
  const bodies = betData?.[0]?.settings?.custom?.fastPick || [];
  if (!bodies.length) {
    QuickLook.present('❌ 未设置规则');
    return { bodies: [] };
  }
  return { bodies, rows };
};

// ✅ 回放主函数 ( 预览 )
const runReplay = async (drawRows, date, lastRow) => {
  const { bodies, rows } = await getBetBody(drawRows);
  if (!bodies.length) return
  
  while(true){
    const picked = await chooseFastPick(bodies);
    if(!picked) break;
    const r = replayNormal(rows, [picked.body]);
    const sim = replaySimulate(rows, [picked.body], lastRow);

    const iconsDesc1 = '图标说明:  ✅ 命中，🚫 未中';
    const iconsDesc2 = '图标说明:  ✅ 命中，🚫 未中, ⚠️ 强制投注';
    const ruleDesc = missLimit > 0 ? `不中即停，中则继续，${missLimit} 期未中强制投` : '不中即停，中则继续';
    
    const output = `🅰️ ${picked.title}\n${iconsDesc1}\n——————————————————————\n 日期: ${date}\n 期数: ${r.total}\n 命中: ${r.win}\n 未中: ${r.lose}\n 结果: ${r.score > 0 ? '+' : ''}${r.score}\n 盈亏: ${r.totalProfit}\n——————————————————————
\n${r.lines.join('\n')}`;
    const simulate = `🅱️ ${picked.title}\n💜 指定  【 ${ruleDesc} 】\n${iconsDesc2}\n——————————————————————\n 日期: ${date}\n 期数: ${sim.total}\n 命中: ${sim.win} \n 未中: ${sim.lose}\n 未投: ${sim.total - sim.win - sim.lose}\n 结果: ${sim.score > 0 ? '+' : ''}${sim.score}\n 盈亏: ${sim.totalProfit}\n——————————————————————
\n${sim.lines.join('\n')}`;
    await QuickLook.present(output);
    await QuickLook.present(simulate);
    autoUpdate();
  }
  await showDateMenu();
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

const runReplayCollect = async (rows, date, lastRow, account, fastPick) => {
  if (!rows?.length) return null;
  const sim = replaySimulate(rows, [fastPick], lastRow);
  
  return {
    account: account.Data.member_account,
    credit_balance: account.Data.credit_balance,
    title: parseBetBody(fastPick).bet_log,
    date,
    total: sim.total,
    win: sim.win,
    lose: sim.lose,
    score: sim.score,
    profit: sim.totalProfit,
  };
};

const collectAllRecords = async () => {
  const [records, draw, accent] = await Promise.all([
    getBoxjsData('record_rows'),
    getBoxjsData('agent_data'),
    pickStrategyOnce()
  ]);

  if (!Array.isArray(records) || !records.length || !accent) {
    return { results: [], total: 0 };
  }

  const { account, fastPick } = accent;
  const rows = sliceByTime(draw.drawRows, "08:05");
  const lastRow = records[0]?.data?.[0] || null;
  const { todayList } = replaySimulate(rows, [fastPick], lastRow, true);
  const today = new Date().toISOString().slice(0, 10);
  const tasks = [];
  
  // 今日
  if (records[0]?.date !== today) {
    tasks.push((async () => {
      return runReplayCollect(rows, today, lastRow, account, fastPick);
    })());
  }

  // 历史
  records.forEach((record, idx) => {
    const lastRow = records[idx + 1]?.data?.[0] || null;
    tasks.push(
      runReplayCollect(record.data, record.date, lastRow, account, fastPick)
    );
  });

  const results = (await Promise.all(tasks)).filter(Boolean);
  const total = results.reduce((s, r) => s + (r.profit || 0), 0);
  return { todayList, results, total };
};

// 🈯️ 主程序
const showDateMenu = async () => {
  const data = await getCacheData('record_rows', `${boxjsApi}/record_rows`, 'json', 4);
  const list = JSON.parse(data);
  if (!Array.isArray(list) || !list.length) return;

  const records = list.slice(0, 8);
  const today = new Date().toISOString().slice(0, 10);
  const hasToday = records[0]?.date === today;

  const titles = hasToday
    ? records.map(r => r.date)
    : [today, ...records.map(r => r.date)];

  const idx = await presentSheetMenu('选择日期查看记录', titles, today);
  if (idx === -1) return;
  if (!hasToday && idx === 0) {
    const { drawRows } = await getBoxjsData('agent_data') || {};
    const lastRow = records[0]?.data?.[0] || null;
    return runReplay(drawRows, today, lastRow);
  }

  const recordIndex = hasToday ? idx : idx - 1;
  const record = records[recordIndex];
  const lastRow = records[recordIndex + 1]?.data?.[0] || null;
  return runReplay(record.data, record.date, lastRow);
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
  profitText.font = Font.mediumSystemFont(15.5);
  profitText.textColor = large && item.forced 
    ? new Color('#FF6800') 
    : large 
      ? Color.blue() 
      : (item.profit < 0 ? Color.red() : Color.blue());
  
  if (item.forced) {
    stack.addSpacer(6);
    const actionText = stack.addText(item.action);
    actionText.font = Font.mediumSystemFont(14);
    actionText.textColor = new Color('#FF4800');
  }
  stack.addSpacer();
};

// ✅ 创建组件
const createWidget = async (data) => {
  const { account, credit_balance } = data.results[0];
  const family = config.widgetFamily;
  const small = family === 'small';
  const large = family === 'large';
  
  const widget = new ListWidget();
  widget.setPadding(15, 15, 15, 15);
  widget.url = 'scriptable:///run/' + encodeURIComponent(Script.name());
  widget.backgroundImage = await getCacheData('glass', imageUrl, 'img');
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
  columnStack.backgroundColor = new Color(Number(credit_balance) < 30000 ? '#8B5FF4' : '#00C400');
  topStack.addSpacer(10);
  
  if (!small) {
    const missText = missLimit > 0 
      ? `，${missLimit} 期未中强制投` 
      : `，可用 ${credit_balance}`;
    const nameText = topStack.addText(`账号 ${account}${missText}`);
    nameText.font = Font.mediumSystemFont(16);
    nameText.textOpacity = 0.9
    topStack.addSpacer(10);
    
    const barStack = topStack.addStack();
    barStack.setPadding(2, 7, 2, 7);
    barStack.cornerRadius = 7;
    barStack.backgroundColor = data.total < 0 ? Color.red() : Color.green();
    const statusText = barStack.addText(`${data.total}`);
    statusText.font = Font.boldSystemFont(14);
    statusText.textColor = Color.white();
  }
  
  if (small) {
    const dateText = topStack.addText(`${missLimit} 期未中强投`);
    dateText.font = Font.systemFont(16);
    dateText.textOpacity = 0.95;
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
  
  if (config.runsInApp) {
    widget.presentMedium()
  } else {
    Script.setWidget(widget);
    Script.complete();
  }
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
    await showDateMenu();
  } else {
    const finalResults = await collectAllRecords();
    console.log(finalResults)
    if (!finalResults.results.length) {
      return await createErrorWidget();
    }
    await createWidget(finalResults);
  }
})();