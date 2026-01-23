// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: futbol;
const $ = new Env("Lucky");
$.recordRows_key = 'record_rows';

$.agent_data_key = 'agent_data';
const agent_data = $.getjson($.agent_data_key) || {};
$.bet_data_key = 'bet_data';
const bet_data = $.getjson($.bet_data_key) || [];

const buildHeaders = (data) => ({
  "User-Agent": "Mozilla/5.0",
  "X-Requested-With": "XMLHttpRequest",
  "Cookie": data?.cookie
});

const agentApi = agent_data.baseUrl;
const agent_headers = buildHeaders(agent_data);

const curAccount = bet_data
  .filter(a => a.baseUrl)
  .sort((a, b) => (b.updateTime || 0) - (a.updateTime || 0))[0] || null;
  
const memberApi = curAccount?.baseUrl;
const member_headers = buildHeaders(curAccount || {});

// HTTP 请求封装
const httpRequest = o => new Promise((res, rej) => { if (o.body && typeof o.body === "object") o.body = $.toStr(o.body); $task.fetch(o).then(r => { try { res($.toObj(r.body || "{}")); } catch { res(r.body); } }, e => rej(e)); });

// 格式化错误信息
const formatError = (error) => error?.message || String(error);

/** =======💜 数据请求 💜======= */

const getMemberApi = async (account, path, fallback) => {
  try {
    const url = `${account.baseUrl}${path}`;
    const { Status, Data } = await httpRequest({
      url,
      method: "GET",
      headers: buildHeaders(account),
    });
    return Status === 1 ? Data : fallback;
  } catch (err) {
    console.log(`\n⭕️ ${account.member_account}，${path}，请求失败: ${formatError(err)}`);
    return fallback;
  }
};
// 会员信息
const getMemberPrint = (account) =>
  getMemberApi(account, "/Member/GetMemberPrint", null);
  
// 历史账单
const getHistoryBill = (account) =>
  getMemberApi(account, "/Member/GetHistoryBillList", []);

// 日志
const getQuickSelectLog = (account) =>
  getMemberApi(account, "/Member/GetQuickSelectLog", null);

/** 
 * 代理开奖结果 ( 共 11 页 / 25条 )
 * 会员开奖结果 ( 共 17 页 / 15条 )
 */
const getDrawNoTable = async (pageIndex, maxRetry = 3) => {
  const fetchPage = async (i) => {
    const url = agent_data.cookie
      ? `${agentApi}/DrawNo/GetDrawNoDataList?pageindex=${i + 1}`
      : `${memberApi}/DrawNo/GetDrawNoTable?pageindex=${i + 1}`;
      
    try {
      const { Status, Data } = await httpRequest({ 
        url, 
        method: "GET", 
        headers: agent_data.cookie ? agent_headers : member_headers
      });
      return (Status === 1 && Array.isArray(Data?.Rows) && Data.Rows.length) ? Data.Rows : null;
    } catch { 
      return null;
    }
  };

  let results = Array(pageIndex).fill(null);
  let retries = 0;

  while (results.some(r => !r) && retries < maxRetry) {
    const pending = results
      .map((r, i) => (!r ? i : null))
      .filter(i => i !== null);
    if (pending.length === 0) break;
    if (retries > 0) {
      console.log(`\n❌ 第 ${retries} 轮重试未成功的页: ${pending.map(p => p + 1).join(', ')}`);
    }
    const retryResults = await Promise.all(pending.map(fetchPage));
    pending.forEach((idx, i) => results[idx] = retryResults[i]);
    retries++;
  }

  const finalResults = results.map(r => r || []).flat();
  console.log(`\n✅ 共 ${pageIndex} 页，已成功获取 ${results.filter(Boolean).length} 页`);
  return finalResults;
};

/** =========💜 通知 💜========= */

/** 判断当前是否已投注 */
const checkBetStatus = (memberData = {}, bills = []) => {
  const { period_no } = memberData;
  const last = Math.max(...bills.map(b => Number(b.period_no)));
  return bills.some(b => b.period_no === period_no) || (Number(period_no) - last < 2);
};

const fetchMemberAndBill = async (account) => {
  try {
    const [memberData, bill, log] = await Promise.all([
      getMemberPrint(account),
      getHistoryBill(account),
      getQuickSelectLog(account)
    ]);
    return { memberData, bill, log };
  } catch (err) {
    console.log(`❗ 请求失败, 账号 ${account.member_account}: ${formatError(err)}`);
    return { 
      memberData: null, 
      bill: [] 
    };
  }
};

// 推送通知
const shouldNotify = async () => {
  try {
    for (const acc of bet_data) {
      const account = acc;
      if (account?.drawRows) delete account.drawRows;
      if (!account?.cookie) continue;
      const { memberData, bill, log } = await fetchMemberAndBill(account);
      if (!memberData) continue;
      if (memberData) {
        account.Data = memberData;
        account.bill = {};
        account.bill.Data = bill;
        account.log = {};
        account.log.Data = log;
        $.setjson(bet_data, $.bet_data_key);
      }
      
      const isBetting = checkBetStatus(memberData, bill);
      if (!isBetting) {
        console.log(`\n🈯️ 账号 ${memberData?.member_account}，可用 ${memberData?.credit_balance || 0}，已停止投注 ⛔️`);
        continue;
      }
      
      const { profit_loss_money, bet_money, win_money } = bill[0];
      const nextItems = bill.length > 1 ? bill.slice(1, 3) : [];
      const target = bill.find(item => item.draw_datetime === "-1");
      const profit = target?.profit_loss_money ?? 0;

      const profit_Text = profit > 0 ? `盈利 ${profit}` : profit < 0 ? `亏损 ${-profit}` : '持平 0';
      const emoji = profit_loss_money > 0 ? '✅' :  (profit_loss_money == 0 && win_money == 0) ? '✴️' : '🅾️';
      
      const title = `可用分 ${memberData?.credit_balance || 0}  ${profit_Text}`;
      const medium = `${emoji} 投注 ${bet_money} - 中奖 ${win_money} - 盈亏 ${profit_loss_money}`;
      const summaryText = nextItems.map(item => `${item.profit_loss_money > 0 ? '✅' : '🅾️'} 投注 ${item.bet_money} - 中奖 ${item.win_money} - 盈亏 ${item.profit_loss_money}`).join('\n');

      $.msg(title, medium, summaryText);
    }
  } catch (err) {
    console.log(`\n❌ shouldNotify 执行错误: ${formatError(err)}`);
  }
};

/** ======🧡 记录盈亏汇总 🧡====== */

const parseBetCore = (body) => {
  let decoded = '';
  try { decoded = decodeURIComponent(body) } catch { decoded = body || '' }
  const bet_number = decoded.match(/bet_number=([^&]*)/)?.[1] || '';
  const bet_log = decoded.match(/bet_log=([^&]*)/)?.[1];
  const guid = decoded.match(/guid=([^&]*)/)?.[1] || '';
  const guidPart = guid ? guid.split('-')[0] : '';
  const numbers = bet_number.split(',').filter(n => /^\d{4}$/.test(n));
  return {
    numbers,
    len: numbers.length,
    guid: guidPart,
    bet_log
  };
};

const drawNumber = r => `${r.thousand_no}${r.hundred_no}${r.ten_no}${r.one_no}`;

const isHit = (row, bodies) => {
  const num = drawNumber(row);
  return bodies.some(b => parseBetCore(b).numbers.includes(num));
};

const replayNormalFast = (rows, body, water = 9700) => {
  const { numbers, len } = parseBetCore(body);
  if (!len) return 0;
  const prize = water - len;
  let totalProfit = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    const hit = numbers.includes(drawNumber(rows[i]));
    totalProfit += hit ? prize : -len;
  }
  return totalProfit;
};

const replaySimulateFast = (rows, body, lastRow, water, missLimit = 1) => {
  const { numbers, len } = parseBetCore(body);
  if (!len) return 0;

  let totalProfit = 0;
  let canBet = lastRow ? numbers.includes(drawNumber(lastRow)) : false;
  let missCount = 0;
  let forceBet = false;
  const prize = water - len;

  for (let i = rows.length - 1; i >= 0; i--) {
    const hit = numbers.includes(drawNumber(rows[i]));

    if (!canBet && !forceBet && missLimit !== 1) {
      if (hit) {
        canBet = true;
        missCount = 0;
      } else {
        missCount++;
        if (missLimit > 0 && missCount >= missLimit) forceBet = true;
      }
      continue;
    }

    if (hit) {
      totalProfit += prize;
      missCount = 0;
      canBet = true;
      forceBet = false;
    } else {
      totalProfit -= len;
      missCount++;
      if (!forceBet) canBet = false;
    }
  }
  return totalProfit;
};

const calcHistoryTotal = (records, body, bet_log, water, missLimit) => {
  let normalTotal = 0;
  let simulateTotal = 0;

  for (let i = 0; i < records.length; i++) {
    const rows = records[i]?.data || []
    const lastRow = records[i + 1]?.data?.[0] || null;
    normalTotal += replayNormalFast(rows, body, water);
    simulateTotal += replaySimulateFast(rows, body, lastRow, water, missLimit);
  }
  return { bet_log, normalTotal, simulateTotal };
};

const updateHistoryStat = async (records, force = false) => {
  let updated = false;

  for (const acc of bet_data) {
    const custom = acc?.settings?.custom;
    if (!custom) continue;
    const fastPick = custom.fastPick;
    if (!fastPick.length) continue;
    custom.statTotal = custom.statTotal || {};
    const needRecalc = custom.needRecalc === true;

    for (const body of fastPick) {
      const { len, guid, bet_log } = parseBetCore(body);
      if (!len || !guid) continue;
      const old = custom.statTotal[guid];
      if (old && !needRecalc && !force) continue;
      custom.statTotal[guid] = calcHistoryTotal(
        records,
        body,
        bet_log,
        custom.water,
        custom.missLimit
      );

      $.msg(`账号 ${acc.member_account}，历史记录汇总 ✅`, '', bet_log);
      updated = true;
    }

    if (needRecalc) {
      custom.needRecalc = false;
    }
  }

  if (updated) {
    $.setjson(bet_data, $.bet_data_key);
  } else {
    console.log('\n🟡 无新增规则，跳过统计');
  }
};

/** ======💜 保存记录 💜====== */

const saveRecordRows = (drawRows) => {
  const now = new Date();
  const min = now.getHours() * 60 + now.getMinutes();
  if (min < 300 || min > 305) return;
  
  const today = new Date().toISOString().slice(0, 10);
  let records = $.getjson($.recordRows_key) || [];
  const idx = records.findIndex(r => r.date === today);
  const exists = idx !== -1;
  if (exists) {
    records[idx] = { date: today, data: drawRows };
  } else {
    records.unshift({ date: today, data: drawRows });
  }
  if (records.length > 20) {
    records = records.slice(0, 20);
  }
  $.setjson(records, $.recordRows_key);
  $.msg(`${exists ? '覆盖' : '新增'}保存 ${today} 成功 ✅`, '', `当前共 ${records.length} 天记录，最多保留 20 天`);
  return records;
};

/** ======🧡 辅助函数 🧡====== */

// 缓存数据断层逻辑
const mergeDrawData = async (oldData, newData, pages) => {
  if (!oldData?.length) {
    agent_data.drawRows = newData;
    $.setjson(agent_data, $.agent_data_key);
    console.log('\n💚 首次缓存数据保存成功');
    return newData;
  }
  if (!newData?.length) {
    console.log('未请求到新数据');
    return oldData;
  }
  
  // 合并去重 + 排序
  const result = [...new Map([...oldData, ...newData].map(o => [o.period_no, o])).values()]
    .sort((a, b) => +b.period_no - +a.period_no).slice(0, 252);

  // 找出 oldData 中缺失的时间点
  const oldTimes = oldData.map(d => new Date(d.draw_datetime).getTime());
  const newTimes = newData.map(d => new Date(d.draw_datetime).getTime());
  const autoFilled = newTimes.filter(t => !oldTimes.includes(t)).length >= 2;

  agent_data.drawRows = result;
  agent_data.isReplay = autoFilled;
  $.setjson(agent_data, $.agent_data_key);
  console.log(`\n💚 缓存数据更新成功`);

  // 停开区间判断函数
  const isNormalJump = (a, b) => {
    const no1 = a.period_no.slice(-3);
    const no2 = b.period_no.slice(-3);
    if (no1 === "097" && no2 === "060") return true;
    if (no1 === "001" && no2 === "288") return true;
    return false;
  }
  // 断层判断函数（只有两个条件）
  const isGap = (a, b) => {
    if (isNormalJump(a, b)) return false;
    const date1 = new Date(a.draw_datetime);
    const date2 = new Date(b.draw_datetime);
    return Math.abs(date1 - date2) / 60000 > 5;
  };
  
  const hasTimeGap = result.some((row, i) => result[i + 1] && isGap(row, result[i + 1]));
  
  if (hasTimeGap) {
    console.log(`\n⚠️ 检测到断层 → 拉满 ${pages} 页`);
    const fallback = await getDrawNoTable(pages);
    if (fallback?.length) {
      agent_data.drawRows = fallback;
      agent_data.isReplay = true;
      $.setjson(agent_data, $.agent_data_key);
      console.log(`\n✅ 全量补齐完成`);
      return fallback;
    }
  }
  return result;
};

/** =======💜 主程序 💜======= */

// 初始化记录
const initRecords = async () => {
  const records = await httpRequest({
    url: 'https://raw.githubusercontent.com/95du/scripts/master/module/records.json',
    method: 'GET',
    headers: { "Content-Type": "application/json;charset=UTF-8" }
  });
  if (records?.length) {
    $.setjson(records, $.recordRows_key);
    return records;
  }
};

// 限制时间段不执行
const isBetweenLimit = (now = new Date()) => {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= 300 && minutes <= 310; // 05:00 - 05:10
};

const fetchDrawRows = async (page, retries = 2, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    const rows = await getDrawNoTable(page);
    if (rows?.length) return rows;
    if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
  }
  return null;
};

(async () => {
  try {
    const agent_drawRows = agent_data?.drawRows || [];
    const maxPages = agent_data && agent_data?.cookie ? 11 : 17;
    const page = !agent_drawRows.length ? maxPages : 1;
    let drawRows = await fetchDrawRows(page, 2, 1000);
    if (!drawRows?.length) {
      $.msg('登录可能已失效 ⚠️', ``, "重新登录页面更新 Cookie");
      return;
    }

    drawRows = await mergeDrawData(
      agent_drawRows, 
      drawRows, 
      maxPages
    );
    
    if (drawRows.length) {
      await shouldNotify();
      const records = $.getjson($.recordRows_key) || [];
      if (!records?.length) records = await initRecords();
      if (records?.length) await updateHistoryStat(records);
    }
    
    if (isBetweenLimit()) {
      const records = saveRecordRows(drawRows);
      await syncDrawRows(records);
      if (records?.length) await updateHistoryStat(records, true);
    }
  } catch (error) {
    $.msg(`${$.name}脚本运行错误 🚫`, ``, error?.message || String(error));
  } finally {
    $.done();
  }
})();

/** =========💜 环境 💜========= */

/**
 * 环境类，用于处理不同环境下的HTTP请求、数据存储、日志记录等功能。
 * @param {string} t - 环境名称。
 * @param {object} e - 环境配置。
 */
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, r) => { s.call(this, t, (t, s, a) => { t ? r(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null, ...s) { try { return JSON.stringify(t, ...s) } catch { return e } } getjson(t, e) { let s = e; const r = this.getdata(t); if (r) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, r) => e(r)) }) } runScript(t, e) { return new Promise(s => { let r = this.getdata("@chavy_boxjs_userCfgs.httpapi"); r = r ? r.replace(/\n/g, "").trim() : r; let a = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); a = a ? 1 * a : 20, a = e && e.timeout ? e.timeout : a; const [i, o] = r.split("@"), n = { url: `http://${o}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: a }, headers: { "X-Key": i, Accept: "*/*" }, timeout: a }; this.post(n, (t, e, r) => s(r)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e); if (!s && !r) return {}; { const r = s ? t : e; try { return JSON.parse(this.fs.readFileSync(r)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), r = !s && this.fs.existsSync(e), a = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, a) : r ? this.fs.writeFileSync(e, a) : this.fs.writeFileSync(t, a) } } lodash_get(t, e, s) { const r = e.replace(/\[(\d+)\]/g, ".$1").split("."); let a = t; for (const t of r) if (a = Object(a)[t], void 0 === a) return s; return a } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, r) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[r + 1]) >> 0 == +e[r + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, r] = /^@(.*?)\.(.*?)$/.exec(t), a = s ? this.getval(s) : ""; if (a) try { const t = JSON.parse(a); e = t ? this.lodash_get(t, r, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, r, a] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(r), o = r ? "null" === i ? null : i || "{}" : "{}"; try { const e = JSON.parse(o); this.lodash_set(e, a, t), s = this.setval(JSON.stringify(e), r) } catch (e) { const i = {}; this.lodash_set(i, a, t), s = this.setval(JSON.stringify(i), r) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) }); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: r, statusCode: a, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding); e(null, { status: r, statusCode: a, headers: i, rawBody: o, body: n }, n) }, t => { const { message: r, response: a } = t; e(r, a, a && s.decode(a.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, r) => { !t && s && (s.body = r, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, r) }); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: r, headers: a, body: i, bodyBytes: o } = t; e(null, { status: s, statusCode: r, headers: a, body: i, bodyBytes: o }, i, o) }, t => e(t && t.error || "UndefinedError")); break; case "Node.js": let r = require("iconv-lite"); this.initGotEnv(t); const { url: a, ...i } = t; this.got[s](a, i).then(t => { const { statusCode: s, statusCode: a, headers: i, rawBody: o } = t, n = r.decode(o, this.encoding); e(null, { status: s, statusCode: a, headers: i, rawBody: o, body: n }, n) }, t => { const { message: s, response: a } = t; e(s, a, a && r.decode(a.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let r = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in r) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? r[e] : ("00" + r[e]).substr(("" + r[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let r = t[s]; null != r && "" !== r && ("object" == typeof r && (r = JSON.stringify(r)), e += `${s}=${r}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", r = "", a) { const i = t => { switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } case "Loon": { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } case "Quantumult X": { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, r = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": r } } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, r, i(a)); break; case "Quantumult X": $notify(e, s, r, i(a)); break; case "Node.js": }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), r && t.push(r), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, e, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, e, void 0 !== t.message ? t.message : t, t.stack) } } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }