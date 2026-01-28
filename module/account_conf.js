// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: user-astronaut;
const fm = FileManager.local();
const basePath = fm.joinPath(fm.documentsDirectory(), '95du_lottery');
if (!fm.fileExists(basePath)) fm.createDirectory(basePath);

const isDev = false
const boxjsApi = 'http://boxjs.com/query/data';
const github = 'https://raw.githubusercontent.com/95du/scripts/master/module';

// ✅ 默认配置
const defaultConfig = {
  custom: {
    start: '08:00',
    end: '05:00',
    runTask: true,
    hasRule: false,
    fastPick: [],
    cutRule: [],
    water: 9800,
    missLimit: 1,
    profitLimit: 0,
    lossLimit: 0,
    globalMultiplier: 1
  }
};

const defaultData = {
  member_account: 'admin',
  type: 'test',
  settings: defaultConfig,
  Data: {
    member_account: "admin",
    period_no: "202601120097",
    credit_balance: "0",
    previous_draw_no: "0,0,0,0,0",
  }
}

const autoUpdate = async () => {
  const script = await new Request(`${github}/account_conf.js`).loadString();
  fm.writeString(module.filename, script);
};
autoUpdate();

// ✅ 请求接口
const getMemberApi = async (selected, path, options = {}) => {
  try {
    const req = new Request(`${selected.baseUrl}${path}`);
    const {
      method = "GET",
      body = null,
      headers = {}
    } = options;
    req.method = method.toUpperCase();
    req.headers = {
      'User-Agent': 'Mozilla/5.0',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: selected.cookie,
      ...headers
    };

    if (body) req.body = body;
    const res = await req.loadJSON();
    const { Status, Data } = res;
    return Status === 1 ? Data : null;
  } catch (err) {
    console.log(`\n⭕️ ${selected.member_account}，${path}，请求失败: ${err}`);
    return null;
  }
};

// ✅ 缓存文件
const getCacheData = async (name, url, type = 'json', cacheHours = 4) => {
  const path = fm.joinPath(basePath, name);
  const isExpired = () => {
    if (cacheHours === undefined || !fm.fileExists(path)) return false;
    const last = fm.modificationDate(path);
    return (Date.now() - last.getTime()) / 36e5 > cacheHours;
  };
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
  }
  const write = (data) => {
    if (type === 'img') fm.writeImage(path, data);
    else fm.writeString(path, type === 'json' ? JSON.stringify(data) : data);
  }
  const cached = read();
  if (cached) return cached;
  const req = new Request(url);
  let data;
  if (type === 'img') data = await req.loadImage();
  else if (type === 'json') {
    const res = await req.loadJSON();
    data = res?.val ? JSON.parse(res.val) : res;
  } else data = await req.loadString();
  if (data) write(data);
  return data;
};

// ✅ 获取 BoxJs 数据
const getBoxjsData = async (key) => {
  try {
    const data = await new Request(`${boxjsApi}/${key}`).loadJSON();
    const val = data?.val;
    return JSON.parse(val ?? (key === 'bet_data' ? '[]' : '{}'));
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
  let list = await getCacheData('records_rows.json', `${boxjsApi}/record_rows`, 'json', 4);
  if (!list?.length) {
    list = await new Request(`${github}/records.json`).loadJSON();
    await saveBoxJsData(list, 'record_rows');
  }
  return list;
};

// ✅ 通用 UI / 弹窗 
const generateAlert = async (title, message, options, destructive = false) => {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  options.forEach((opt, i) =>
    destructive && i === 1 ? alert.addDestructiveAction(opt) : alert.addAction(opt)
  );
  return await alert.presentAlert();
};

const collectInputs = async (title, message, fields) => {
  const alert = new Alert();
  alert.title = title;
  alert.message = message;
  fields.forEach(({ hint, value }) => {
    alert.addTextField(hint, String(value ?? ''))
  });
  alert.addAction("取消");
  alert.addAction("确认");
  const idx = await alert.presentAlert();
  return idx === 1 ? fields.map((_, i) => alert.textFieldValue(i)) : [];
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

const getSafeInt = (input, oldVal = 0, min = 0) => {
  const v = Number(input[0]);
  if (!Number.isInteger(v)) return oldVal;
  if (v < min) return oldVal;
  return v;
};

// ✅ 查看规则
const viewRule = async (data) => {
  const html = `
  <html lang="zh">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: "微软雅黑"; user-select: none; }
      body { min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; padding: 20px; overflow-x: hidden; overflow: hidden; background: linear-gradient(45deg, #ff6b6b, #f5c500, #48a935, #1d386f); animation: bg-animation 10s infinite alternate ease-in-out; }
      @keyframes bg-animation { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); }}
      .particle { position: absolute; width: 5px; height: 5px; background: rgba(255, 255, 255, 0.8); border-radius: 50%; opacity: 0; animation: floatParticles 5s infinite ease-in-out; }
      @keyframes floatParticles { 0% { opacity: 0; transform: translateY(0) scale(0.5); } 50% { opacity: 1; transform: translateY(-50px) scale(1); }
      100% { opacity: 0; transform: translateY(-100px) scale(0.5); }}
      .card { width: 100%; max-width: 400px; padding: 10px; border-radius: 15px; text-align: center; background: rgba(255,255,255,0.1); box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2); margin-bottom: 20px; color: #fff; font-weight: bold; }
      .text-content { width: 100%; max-width: 400px; padding: 20px; background: rgba(255,255,255,0.2); border-radius: 15px; color: #fff; white-space: pre-wrap; overflow-y: auto; max-height: 80vh; }
    </style>
  </head>
  <body>
    <script>
      for(let i=0;i<20;i++){ const p=document.createElement("div");p.className="particle";p.style.left=Math.random()*100+"vw";p.style.top=Math.random()*100+"vh";p.style.animationDelay=Math.random()*5+"s";document.body.appendChild(p); }
    </script>
    <div class="card"><h3>${data.title}</h3></div><div class="text-content">${data.content}</div>
  </body>
  </html>`;
  const webView = new WebView();
  await webView.loadHTML(html);
  await webView.present();
};

// ✅ 处理时间选择
const setTimeRange = async (betData, selected, conf) => {
  const html = `
  <html lang="zh">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      * { margin:0; padding:0; box-sizing:border-box; font-family:"微软雅黑"; user-select:none; }
      body { min-height:100vh; display:flex; justify-content:center; align-items:center; overflow:hidden; background: linear-gradient(45deg, #ff6b6b, #f5c500, #48a935, #1d386f); animation: bg-animation 10s infinite alternate ease-in-out; }
      @keyframes bg-animation { 0%{filter:hue-rotate(0deg);}100%{filter:hue-rotate(360deg);} }
      .particle { position:absolute; width:5px; height:5px; background:rgba(255,255,255,0.8); border-radius:50%; opacity:0; animation:floatParticles 5s infinite ease-in-out;}
      @keyframes floatParticles {0%{opacity:0; transform:translateY(0) scale(0.5);}50%{opacity:1; transform:translateY(-50px) scale(1);}100%{opacity:0; transform:translateY(-100px) scale(0.5);}}
      .card { width:100%; max-width:400px; padding:50px; border-radius:25px; text-align:center; background:linear-gradient(130deg,#facf41,#f89e6d); box-shadow:0 10px 20px rgba(0,0,0,0.2); position:relative; }
      .card img { width:200px; border-radius:15px; border:2px solid rgba(255,255,255,0.5); padding:15px; animation:rotate 3s infinite alternate ease-in-out; margin-bottom:25px;}
      @keyframes rotate {0%{transform:rotate(-5deg) scale(1);}100%{transform:rotate(5deg) scale(1.1);}}
      .card h3, .card p { color:#fff; margin-top:10px;}
      .time-input { font-size:18px; padding:8px 15px; border-radius:50px; border:none; text-align:center; color:#f8a26a; font-weight:bold; background:#fff; box-shadow:0 0 10px rgba(255,165,0,0.5); transition:all 0.3s ease-in-out; width:130px;}
      .time-input:hover { transform:scale(1.05); box-shadow:0 0 15px rgba(255,255,255,0.7);}
      .time-row { display:flex; align-items:center; justify-content:center; gap:10px; margin-top:25px;}
      .time-row span { font-size:18px; color:#fff;}
    </style>
  </head>
  <body>
    <script>
      for(let i=0;i<20;i++){ const p=document.createElement("div");p.className="particle";p.style.left=Math.random()*100+"vw";p.style.top=Math.random()*100+"vh";p.style.animationDelay=Math.random()*5+"s";document.body.appendChild(p); }
    </script>
    <div class="card">
      <img src="https://image.fosunholiday.com/cl/image/comment/69063c947ceb992545528373_upload.mp4">
      <h3>设置时间区间</h3>
      <div class="time-row">
        <input class="time-input" type="time" id="startTime" value="${conf.custom.start || '08:00'}">
        <span>至</span>
        <input class="time-input" type="time" id="endTime" value="${conf.custom.end || '05:00'}">
      </div>
      <audio id="audio" src="https://www.bqxfiles.com/music/success.mp3"></audio>
    </div>
    <script>
      const start = document.getElementById('startTime');
      const end = document.getElementById('endTime');
      const audio = document.getElementById('audio');
      function playAudio() { audio.play().catch(()=>{}); }
      [start,end].forEach(el => el.addEventListener('change', playAudio));
    </script>
  </body>
  </html>`;

  const webView = new WebView();
  await webView.loadHTML(html);
  await webView.present();
  const result = await webView.evaluateJavaScript("document.getElementById('startTime').value+'|'+document.getElementById('endTime').value");

  if (result) {
    const [start, end] = result.split('|');
    if (start && end) {
      await updateConfig(betData, selected, c => {
        c.custom.start = start;
        c.custom.end = end;
      });
    }
  }
};

// ✅ 解析投注数据
const processDataText = (data, selected) => {
  const accounts = data.filter(acc => acc.member_account === selected.member_account);
  return (accounts || []).map(acc => {
    const bets = acc.settings?.custom?.fastPick;
    const title = `账号: ${acc.member_account} ( ${bets.length} )`;
    let text = '';
    bets.forEach((body, i) => {
      const p = parseBetBody(body);
      text += `规则: ${i + 1}\n注单数量: ${p.numCount}\n每注金额: ${p.bet_money}\n${p.bet_log}\n\n`;
    });
    return { title, content: text.trim() };
  });
};

// ✅ 解析 Body 参数
const parseBetBody = (body) => {
  let decoded = '';
  try { decoded = decodeURIComponent(body); } catch { decoded = body || '' }
  const bet_number = decoded.match(/bet_number=([^&]*)/)?.[1] || '';
  const bet_log = decoded.match(/bet_log=([^&]*)/)?.[1];
  const bet_money = decoded.match(/bet_money=([^&]*)/)?.[1];
  const number_type = decoded.match(/number_type=([^&]*)/)?.[1] || '';
  const numCount = bet_number.split(",").length || '';
  const guid = decoded.match(/guid=([^&]*)/)?.[1] || '';
  const guidPart = guid ? guid.split('-')[0] : '';
  return { 
    bet_number, 
    bet_log, 
    bet_money,
    number_type,
    numCount,
    guidPart
  }
};

// ✅ 更新配置
const updateConfig = async (betData, selected, updater) => {
  const acc = betData.find(a => a.member_account === selected.member_account);
  if (!acc) return;
  acc.settings ||= { ...defaultConfig };
  acc.settings.custom ||= { ...defaultConfig.custom };
  await updater(acc.settings);
  await saveBoxJsData(betData);
};

// ✅ 显示对应子配置信息
const buildMessage = (acc, conf) => {
  const section = conf.custom || {};
  const taskStatus = section?.runTask ? '已开启' : '已停止';
  const hasRule = section.hasRule ? '已设置' : '未设置';
  const isReversed = section.fastPick.some(b => parseBetBody(b).bet_money === '02') ? '已反转' : '未反转';
  const changeLog = section.changeLog ? '已修改' : '未修改';
  return `账号 ${acc.member_account}，可用 ${acc.Data.credit_balance}
投注状态 【 ${taskStatus} 】
投注规则 【 ${hasRule} 】
反转规则 【 ${isReversed} 】
日志内容 【 ${changeLog} 】
赔率  ${section.water}
盈利上限  ${section.profitLimit || 0}
亏损下限  ${section.lossLimit || 0}
强制投注  ${section.missLimit}   全局倍数  ${section.globalMultiplier}
时间区间  ${section.start ?? '08:00'} ~ ${section.end ?? '05:00'}`;
};

// ✅ 刷新配置并重开
const refreshReopen = async (betData, selected, conf, menuFunc) => {
  const ref = betData.find(a => a.member_account === selected.member_account);
  const newConf = ref?.settings || conf
  await menuFunc(betData, selected, newConf);
};

/** =======💜 统计盈亏 💜======= */

// ✅ 解析四定位号码
const parseBetNumbers = (body) => parseBetBody(body).bet_number.split(',').filter(n => /^\d{4}$/.test(n));

// ✅ 获取开奖号码
const drawNumber = r => `${r.thousand_no}${r.hundred_no}${r.ten_no}${r.one_no}`;

// ✅ 判断某一期是否命中任意规则
const isHit = (row, bodies) => {
  if (!row || !bodies?.length) {
    return false;
  }
  const num = drawNumber(row);
  return bodies.some(b => parseBetNumbers(b).includes(num));
};

const sliceByTime = (rows, targetTime, field = "draw_datetime") => {
  if (!rows?.length) return;
  const index = rows.findIndex(
    item => (item[field]?.split(" ")[1] || "").slice(0, 5) === targetTime
  );
  return index !== -1 ? rows.slice(0, index + 1) : [];
};

// ✅ 普通回放
const replayNormal = (rows, rule, water = 9800) => {
  const bodies = [rule.body];
  let totalProfit = 0;
  let win = 0, lose = 0, score = 0;

  const cost = parseBetNumbers(rule.body).length;
  const prize = water - cost;
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
    summary: {
      desc: '普通规则：每期都投 ( 默认 )',
      water,
      total: rule.normalTotal,
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
const replaySimulate = (rows, rule, lastRow, water = 9800, missLimit) => {
  const bodies = [rule.body];
  let canBet = lastRow ? isHit(lastRow, bodies) : false;
  let totalProfit = 0;
  let win = 0, lose = 0, score = 0;
  let missCount = 0;
  let forceBet = false;
  let unbet = 0;

  const cost = parseBetNumbers(rule.body).length;
  const prize = water - cost;
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
  
  const ruleText = missLimit === 0 ? '不中即停，中则继续' : missLimit === 1 ? '每期都投' : `连续 ${missLimit} 期未中强制投`;
  
  return {
    mode: 'simulate',
    title: rule.title,
    summary: {
      desc: `指定规则：${ruleText}`,
      water,
      total: rule.simulateTotal,
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
const getRuleList = async ({ fastPick, statTotal } = section) => {
  return fastPick.map((b, i) => {
    const info = parseBetBody(b);
    if (info.number_type !== '40') return null;
    const { bet_log, normalTotal, simulateTotal } = statTotal?.[info.guidPart] || {};
    return { 
      index: i, 
      body: b, 
      title: bet_log ?? info.bet_log, 
      normalTotal, 
      simulateTotal,
      label: `${i + 1}， ${info.numCount} 组`
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

// ✅ 计算回放数据
const getReplayData = async (date, ruleId, drawRows, section) => {
  const rules = await getRuleList(section);
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
    normal: replayNormal(rows, rule, section.water),
    simulate: replaySimulate(rows, rule, lastRow, section.water, section.missLimit)
  };
};

// ✅ 回放数据
const runReplay = async (selected, conf, date, ruleId) => {
  const section = conf.custom || {};
  const drawRows = sliceByTime(selected.drawRows, "08:05");
  if (!drawRows?.length) return;
  if (!section.fastPick?.length) {
    return await viewRule({
      title: `账号: ${selected.member_account}`,
      content: '暂无投注规则，请点击写入规则或已被暂停'
    })
  }
  return await getReplayData(date, ruleId, drawRows, section);
};

// ✅ 回放主函数
const statMenu = async (selected, conf) => {
  const kx = await getModule(selected);
  const today = new Date().toISOString().slice(0, 10);
  const statData = await runReplay(selected, conf, today, 0);
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
      const data = await runReplay(selected, conf, event.date, event.ruleId);
      await webView.evaluateJavaScript(
        `window.renderReplay(${JSON.stringify(data)})`
      );
    }
    injectListener();
  };
  injectListener();
  await webView.present();
};

/** ========💜 写入规则 💜======== */

const saveBody = (arr, event) => {
  const incoming = parseBetBody(event);
  const incomingLog = incoming.bet_log;
  const incomingLen = incoming.bet_number.split(',').filter(Boolean).length;

  const idx = arr.findIndex(item => {
    const info = parseBetBody(item);
    const len = info.bet_number.split(',').filter(Boolean).length;
    return info.bet_log === incomingLog && len === incomingLen;
  });

  if (idx >= 0) {
    const exists = parseBetBody(arr[idx]);
    if (exists.bet_money !== incoming.bet_money) arr[idx] = event;
    return arr;
  }
  arr.unshift(event);
  return arr;
};

const getModule = async (selected) => {
  const codeMaker = await getCacheData('codeMaker.js', `${github}/codeMaker.js`, 'js');
  await getCacheData('kuaixuan.js', `${github}/kuaixuan.js`, 'js');
  if (typeof require === 'undefined') require = importModule;
  const { CodeMaker } = require(isDev ? './kuaixuan' : `${basePath}/kuaixuan`);
  const module = await new CodeMaker(codeMaker, selected);
  return module;
};

const isNumberArr = str =>
  typeof str === 'string' &&
  /^(\d{4})(\s*,\s*\d{4})*$/.test(str.trim());

const buildHtml = async (selected, isLog = false, input = '', log = '', money) => {
  const kx = await getModule(selected);
  if (!isLog) return kx.html(selected);
  const text = isNumberArr(input) || input.includes('四定位') ? input : '';
  return kx.logHtml(text, log, money);
};

// ✅ 运行快选 HTML
const kuaixuan = async (betData, selected, conf, isLog = false, input, log = '', money) => {
  const html = await buildHtml(selected, isLog, input, log, money);
  if (!html) return;
  
  const webView = new WebView();
  await webView.loadHTML(html, selected.baseUrl);
  
  const injectListener = async () => {
    const event = await webView.evaluateJavaScript(`
      (() => {
        const controller = new AbortController();
        const listener = (e) => {
          completion(e.detail);
          controller.abort();
        };
        window.addEventListener(
          'JBridge', listener, { signal: controller.signal }
        );
      })()`, true
    ).catch(err => console.error(err));
    if (event) {
      const body = !isLog ? event : event.data;
      await updateConfig(betData, selected, c => {
        c.custom.hasRule = true;
        c.custom.fastPick = saveBody(c.custom.fastPick, body);
      });
      await saveBoxJsData(betData);
      await statMenu(selected, conf);
    }
    injectListener();
  };
  injectListener();
  await webView.present();
};

/** =======💙 三级菜单 💙======= */

// 过滤号码
const getRemainingBySet = (excludes = []) => {
  const excludeSet = new Set(
    excludes.map(n => String(n).padStart(4, '0'))
  );
  const all_numbers = Array.from({ length: 10000 }, (_, i) => String(i).padStart(4, '0'));
  return all_numbers.filter(n => !excludeSet.has(n));
};

// 替换请求体参数
const replaceParams = (bodyStr, replaceMap) => {
  let result = bodyStr;
  for (const key in replaceMap) {
    const reg = new RegExp(`(${key}=)[^&]*`, "g");
    result = result.replace(reg, `$1${encodeURIComponent(replaceMap[key])}`)
  }
  return result;
};

// 🆎 反转规则
const reverseRule = async (betData, selected, conf) => {
  const list = conf.custom?.fastPick;
  if (!list?.length) return;
  const alert = new Alert();
  alert.title = '【 请选择要反转的规则 】';
  alert.message = list
    .map((b, i) => `${i + 1}、${parseBetBody(b).bet_log}`)
    .join('\n');

  list.forEach((b, i) => {
    const parsed = parseBetBody(b);
    const action = `规则 ${i + 1} - ${parsed.numCount}组`;
    parsed.bet_money === '02' ? alert.addDestructiveAction(action) : alert.addAction(action);
  });
  alert.addCancelAction('返回');
  const idx = await alert.presentSheet();
  if (idx === -1) return;
  const rule = list[idx];
  const parsed = parseBetBody(rule);
  const excludes = parsed.bet_number.split(',');
  const remain = getRemainingBySet(excludes);
  const bet_number = remain.join(',');
  const money = parsed.bet_money !== '02' ? '02' : '01';
  
  if (!remain.length) {
    await generateAlert('反转后号码为空，操作已取消 ⚠️', null, ['完成']);
    return;
  }
  
  const confirm = await generateAlert(
    `‼️ 规则反转 ‼️\n原始号码数：${parsed.numCount}\n反转后号码数：${remain.length}`, 
    null, ['取消', '确定'], true
  );
  if (confirm !== 1) return;
  
  const tips = await generateAlert(
    `【 再次筛选 】\n是否对反转后的 ${remain.length} 组号码进行二次操作❓`, 
    null, ['取消', '确定'], true
  );
  if (tips === 1) {
    return await kuaixuan(betData, selected, conf, true, bet_number, parsed.bet_log, money);
  }
  
  // 以下是保存反转后的规则
  await updateConfig(betData, selected, c => {
    const newfastPick = replaceParams(rule, {
      bet_number,
      bet_money: money
    });
    c.custom.fastPick.splice(idx, 1, newfastPick);
  });
  await saveBoxJsData(betData);
};

// ✅ 切分一条规则 body 为 n 份
const splitBetBody = (body, n = 2) => {
  const info = parseBetBody(body);
  const numbers = info.bet_number.split(',').filter(Boolean);
  if (n <= 1 || numbers.length <= n) return [body];
  const size = Math.ceil(numbers.length / n);
  const groups = [];
  for (let i = 0; i < n; i++) {
    const part = numbers.slice(i * size, (i + 1) * size);
    if (!part.length) continue;
    const newBody = replaceParams(body, {
      bet_number: part.join(','),
      guid: `${Date.now()}-${Math.random().toString(16).slice(2)}`
    });
    groups.push(newBody);
  }
  return groups;
};

// ✅ 切分规则
const splitRuleHandle = async (betData, selected, conf, { idx, rule, info }) => {
  const res = await collectInputs(
    '切分规则',
    `当前 ${info.numCount} 组，请输入要切成几份`,
    [{ hint: '切分份数', value: 2 }]
  );
  if (!res.length) return;
  const number = Number(res[0]);
  if (!Number.isInteger(number) || number < 2) return;
  const newRules = splitBetBody(rule, number);

  await updateConfig(betData, selected, c => {
    c.custom.fastPick.splice(idx, 1, ...newRules);
  });
  await saveBoxJsData(betData);
  const data = processDataText(betData, selected);
  await viewRule(data[0]);
};

// ✅ 修改单条规则日志
const editRuleLogHandle = async (betData, selected, conf, { from, idx, rule }) => {
  const info = parseBetBody(rule);
  const res = await collectInputs(
    '修改规则日志',
    info.bet_log,
    [{ hint: '规则日志', value: decodeURIComponent(info.bet_log) }]
  );
  if (!res.length) return;
  const newLog = res[0].trim();
  if (!newLog) return;
  const newRule = replaceParams(rule, { bet_log: newLog });
  await updateConfig(betData, selected, c => {
    c.custom[from].splice(idx, 1, newRule);
    c.custom.changeLog = true;
  });
  await saveBoxJsData(betData);
};

// 🆎 规则操作（删除 / 暂停 / 恢复）
const handleRule = async (betData, selected, conf, { from, to, confirmText, mode }) => {
  const list = conf.custom?.[from];
  if (!list?.length) return;

  const idx = await presentSheetMenu(
    list.map((b, i) => `${i + 1}、${parseBetBody(b).bet_log}`).join('\n'),
    list.map((b, i) => `规则 ${i + 1} - ${parseBetBody(b).numCount}组`)
  );
  if (idx === -1) return;
  let rule = list[idx];
  const info = parseBetBody(rule);

  if (mode === 'editLog') {
    await editRuleLogHandle(betData, selected, conf, { from, idx, rule });
    return;
  }
  if (mode === 'splitRule') {
    await splitRuleHandle(betData, selected, conf, { idx, rule, info });
    return;
  }

  // 删除 / 暂停 / 恢复
  const confirm = await generateAlert(confirmText, info.bet_log, ['取消', '确定'], true);
  if (confirm !== 1) return;
  await updateConfig(betData, selected, c => {
    c.custom[from].splice(idx, 1);
    if (to) {
      c.custom[to] ||= [];
      c.custom[to].push(rule);
    }
    c.custom.hasRule = !!c.custom.fastPick?.length;
    if (!to && c.custom.statTotal && info.guidPart) {
      delete c.custom.statTotal[info.guidPart];
    }
  });
  await saveBoxJsData(betData);
};

// 🆎 管理规则
const editRuleLog = (betData, selected, conf) => handleRule(betData, selected, conf, {
  from: 'fastPick',
  to: null,
  mode: 'editLog'
});

const splitRule = (betData, selected, conf) => handleRule(betData, selected, conf, {
  from: 'fastPick',
  to: null,
  mode: 'splitRule'
});

const removeRule = (betData, selected, conf) => handleRule(betData, selected, conf, {
    from: 'fastPick',
    to: null,
    confirmText: '确定删除以下规则❓'
  });

const cutRuleAction = (betData, selected, conf) => handleRule(betData, selected, conf, {
    from: 'fastPick',
    to: 'cutRule',
    confirmText: '确定暂停以下规则❓'
  });

const restoreRule = (betData, selected, conf) => handleRule(betData, selected, conf, {
    from: 'cutRule',
    to: 'fastPick',
    confirmText: '确定恢复以下规则❓'
  });

/** =======🩷 二级菜单 🩷======= */

const setTaskType = async (betData, selected, conf) => {
  const { fastPick = [], cutRule = [] } = conf.custom || {};

  const opts = [
    { name: '写入规则', id: 'writeRule' },
    { name: '日志规则', id: 'logRule' }
  ];

  if (fastPick.length) {
    opts.push(
      { name: '查看规则', id: 'viewRule' },
      { name: '修改日志', action: editRuleLog },
      { name: '切分规则', action: splitRule },
      { name: '删除规则', action: removeRule },
      { name: '暂停规则', action: cutRuleAction },
      { name: '反转规则', action: reverseRule }
    );
  }
  if (cutRule.length) {
    opts.push({ name: '恢复规则', action: restoreRule });
  }
  const idx = await presentSheetMenu(
    buildMessage(selected, conf),
    opts.map(o => o.name)
  );
  if (idx === -1) return;
  const choice = opts[idx];
  if (!choice) return;

  if (typeof choice.action === 'function') {
    await choice.action(betData, selected, conf);
  } else {
    switch (choice.id) {
      case 'logRule': {
        const paste = Pasteboard.paste();
        const input = paste?.replace(/\[|\]/g, '').trim();
        await kuaixuan(betData, selected, conf, true, input);
        break;
      }
      case 'writeRule':
        await kuaixuan(betData, selected, conf);
        break;
      case 'viewRule': {
        const data = processDataText(betData, selected);
        await viewRule(data[0]);
        break;
      }
    }
  }
  await refreshReopen(betData, selected, conf, setTaskType);
};

/** =======🩷 二级菜单 🩷======= */

// ✅ 账号密码逻辑
const manageAccount = async (betData, selected) => {
  const acc = betData.find(a => a.member_account === selected.member_account);
  if (!acc) return;

  if (acc.account && acc.password) {
    const confirm = await generateAlert(
      `账号：${acc.account}\n密码：${acc.password}`,
      null, ['取消', '删除'], true
    );
    if (confirm === 1) {
      delete acc.account;
      delete acc.password;
      await saveBoxJsData(betData);
      await generateAlert(`已删除账号和密码 ✅`, null, ['完成']);
    }
    return;
  }

  const alert = new Alert();
  alert.title = '设置账号密码';
  alert.addTextField('账号');
  alert.addSecureTextField('密码');
  alert.addCancelAction('取消');
  alert.addAction('保存');
  const res = await alert.presentAlert();
  if (res !== 0) return;
  const account = alert.textFieldValue(0);
  const password = alert.textFieldValue(1);
  if (!account || !password) return;
  acc.account = account.trim();
  acc.password = password.trim();
  await saveBoxJsData(betData);
  await generateAlert(`保存成功 ✅\n账号：${acc.account}\n密码：${acc.password}`, null, ['完成']);
};

// ✅ 整单退码
const serialNo = async (selected) => {
  const data = await getMemberApi(selected, '/Member/GetMemberBetList');
  const rows = data?.Rows || [];
  if (!rows.length) return;
  
  const alert = new Alert();
  alert.message = '选择退码 ( 红色表示已退码 )';
  const target = rows.filter(item => item.lottery !== '-1');
  target.forEach((item, idx) => {
    const action = item.is_cancel === '0' ? 'addAction' : 'addDestructiveAction';
    alert[action](`${idx + 1}，共 ${item.BetCount} 组 - 金额 ${item.bet_money}`);
  });
  alert.addCancelAction('返回');
  const idx = await alert.presentSheet();
  if (idx === -1) return;
  const choice = target[idx];
  
  const raw = `{${choice.serial_no}}|${choice.BetCount || 1}`;
  const ids = encodeURIComponent(raw);
  const periodNo = data?.Extra?.Period?.period_number;
  const form = `ids=${ids}&period_no=${periodNo}`;

  const res = await getMemberApi(selected, '/Member/CancelMemberBet', {
    method: 'POST',
    body: form,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const msg = new Alert();
  msg.message = `退码结果 ✅\n${res}`;
  msg.addAction('完成');
  await msg.presentAlert();
};

// ✅ 账号管理菜单
const accountManage = async (betData, selected, conf) => {
  const alert = new Alert();
  alert.message = buildMessage(selected, conf);

  const opts = [
    { name: '删除账号', id: 'delAccount', specify: true },
    { name: '重置规则', id: 'reset', specify: true },
    { name: '账号密码', id: 'account' },
    { name: '设置赔率', id: 'water' },
    { name: '整单退码', id: 'serialNumber' },
  ];

  opts.forEach(item => {
    if (item.specify) alert.addDestructiveAction(item.name);
    else alert.addAction(item.name);
  });
  alert.addCancelAction('返回');
  const idx = await alert.presentSheet();
  if (idx === -1) return;
  const choice = opts[idx];
  if (!choice) return;

  switch (choice.id) {
    case 'delAccount': {
      const confirm = await generateAlert(`${choice.name} ${selected.member_account}❓`, null,  ['取消', '确定'], true);
      if (confirm === 1) {
        betData = betData.filter(acc => acc.member_account !== selected.member_account);
        await saveBoxJsData(betData);
        return true;
      }
      break;
    }
    case 'reset': {
      const confirm = await generateAlert(`是否${choice.name}配置❓`, null, ['取消', '确定'], true);
      if (confirm === 1) {
        fm.remove(basePath);
        await updateConfig(betData, selected, c => { 
          c.custom = defaultConfig.custom;
          selected.body = [];
        });
        await saveBoxJsData(betData);
        if (fm.fileExists(basePath)) fm.remove(basePath);
      }
      break;
    }
    case 'account':
      await manageAccount(betData, selected);
      break;
    case 'water': {
      const water = await collectInputs( '设置赔率', '盘口水位 ( 例如: 9800 )', [{ hint: '赔率', value: conf.custom.water ?? 9800 }] );
      const waterValue = getSafeInt(water, conf.custom.water);
      await updateConfig(betData, selected, c => { c.custom.water = waterValue });
      break;
    }
    case 'serialNumber':
      await serialNo(selected);
      break;
  }
  await refreshReopen(betData, selected, conf, accountManage);
};

// ✅ 风控设置菜单
const riskLimitMenu = async (betData, selected, conf) => {
  const alert = new Alert();
  alert.message = buildMessage(selected, conf);

  const menus = [
    { name: '盈利上限', key: 'profitLimit', hint: '输入盈利上限', desc: '达到设置的盈利值停止投注\n0 表示不限制' },
    { name: '亏损下限', key: 'lossLimit', hint: '输入亏损下限', desc: '达到设置的亏损值停止投注\n0 表示不限制' },
    { name: '强制投注', key: 'missLimit', hint: '未中期数', desc: '0：命中一直投，不中一直停\n1：不论中或不中，每期都投\n3：连续未中 3 期后自动投注' },
  ];

  menus.forEach(m => alert.addAction(m.name));
  alert.addCancelAction('返回');
  const idx = await alert.presentSheet();
  if (idx === -1) return;
  const menu = menus[idx];
  if (!menu) return;
  const currentVal = conf.custom[menu.key] ?? 0;
  const res = await collectInputs(menu.name, menu.desc, [{ hint: menu.hint, value: currentVal }]);
  const value = getSafeInt(res, currentVal, 0);
  await updateConfig(betData, selected, c => {
    c.custom[menu.key] = value;
    if (menu.key === 'missLimit') c.custom.needRecalc = true;
  });
  await refreshReopen(betData, selected, conf, riskLimitMenu);
};

/** ========🧡 一级菜单 🧡======== */

// ✅ 显示不同倍数设置表单
const multiplierMenu = async (betData, selected, conf) => {
  const section = conf.custom || {};
  const results = await collectInputs(
    '设置倍数', 
    '影响对应规则的投注金额', 
    [{ hint: '全局倍数', value: section.globalMultiplier ?? 1 }]
  );
  if (!results.length) return;
  await updateConfig(betData, selected, c => { 
    c.custom.globalMultiplier = Number(results[0]) || 1 
  });
};

// ✅ 主配置菜单
const configMenu = async (betData, selected, conf) => {
  const alert = new Alert();
  alert.message = buildMessage(selected, conf);

  const opts = [
    { name: '管理账号', id: 'accountManage' },
    { name: conf.custom.runTask ? '停止投注' : '开启投注', id: 'runTask', specify: true },
    { name: '时间区间', id: 'time' },
    { name: '设置倍数', id: 'multiplierMenu' },
    { name: '投注控制', id: 'betControl' },
    { name: '盈亏统计', id: 'stat' },
    { name: '投注规则', id: 'rule' },
  ];

  opts.forEach(item => {
    if (item.specify) alert.addDestructiveAction(item.name);
    else alert.addAction(item.name);
  });
  alert.addCancelAction('完成');
  const idx = await alert.presentSheet();
  if (idx === -1) return;
  const choice = opts[idx];
  if (!choice) return;

  switch (choice.id) {
    case 'accountManage': 
      const acc = await accountManage(betData, selected, conf)
      if (acc) return;
      break;
    case 'betControl': 
      await refreshReopen(betData, selected, conf, riskLimitMenu);
     break;
    case 'runTask': {
      await updateConfig(betData, selected, c => { c.custom.runTask = !c.custom.runTask });
      break;
    }
    case 'multiplierMenu':
      await multiplierMenu(betData, selected, conf);
      break;
    case 'time':
      await setTimeRange(betData, selected, conf);
      break;
    case 'stat':
      await statMenu(selected, conf);
      break;
    case 'rule':
      await refreshReopen(betData, selected, conf, setTaskType);
      break;
  }
  await refreshReopen(betData, selected, conf, configMenu);
};

// ✅ 主菜单入口
const presentMenu = async () => {
  let [betData, agent_data] = await Promise.all([
    getBoxjsData('bet_data'),
    getBoxjsData('agent_data')
  ]);
  if (!Array.isArray(betData)) {
    betData = [];
  }
  const hasTestAccount = betData.some(i => i.type === 'test');
  if (betData?.length && !hasTestAccount) {
    betData.push(defaultData);
    await saveBoxJsData(betData);
    await generateAlert(
      `‼️ 设置规则步骤 ‼️`, '写入规则、日志规则、反转规则等操作完成后，准备投注前，再修改日志', ['确定']
    );
  }
  const alert = new Alert();
  alert.message = '【 账号配置 】\n首次使用请先登录再设置投注规则';
  betData.forEach(a => alert.addAction(a.member_account));
  alert.addCancelAction('取消');
  const idx = await alert.presentSheet();
  if (idx === -1) return;
  const selected = betData[idx];
  if (typeof agent_data !== 'undefined') {
    selected.drawRows = agent_data.drawRows;
  }
  const conf = selected.settings || defaultConfig;
  if (conf) await configMenu(betData, selected, conf);
};

await presentMenu();