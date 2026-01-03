// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: futbol;
const $ = new Env("Lucky");
$.recordRows_key = 'record_rows';

$.agent_data_key = 'agent_data';
const agent_data = $.getjson($.agent_data_key) || {};
$.bet_data_key = 'bet_data';
const bet_data = $.getjson($.bet_data_key) || [];

const groupLink = 'https://t.me/CpAbO_q_SGo2ZWE1';
const jsonHeaders = { "Content-Type": "application/json" };
const buildHeaders = (data) => ({
  "User-Agent": "Mozilla/5.0",
  "X-Requested-With": "XMLHttpRequest",
  "Cookie": data?.cookie
});

const agentApi = agent_data.baseUrl;
const agent_headers = buildHeaders(agent_data);
const chatIDs = agent_data?.enIDs;

const curAccount = bet_data
  .filter(a => a.baseUrl)
  .sort((a, b) => (b.updateTime || 0) - (a.updateTime || 0))[0] || null;
  
const memberApi = curAccount?.baseUrl;
const member_headers = buildHeaders(curAccount || {});

const tokenMap = {
  token_1: '7751097395:AAEgMM1xpLJgV03gXlsXHzOs27WqyaZk3k8',
  token_2: '7967816926:AAEe2Mue02NTGAuIuQHxsyorKXxEsRzK7L4',
  token_3: '8362380657:AAG_EiZminykKGiYNdF95fmGzCTD3UOuA2A',
  token_4: '7591808938:AAEcyt-N_SbMiylC36-x2OCxpn0cZxUIbf0',
  token_5: '8176949871:AAEpCWFscVoYlgu7DzRMlD8sriImaS3VGtM',
  token_6: '8276801700:AAG8gF9HDdPf_pwIyvxUePWHt8-6ZoGnwQY',
  token_7: '8097480798:AAEiI2D0hj_FGBEjntF1ZoSFuEBam1v6sB4',
};

const tokens = Object.values(tokenMap);
const [one_bot, two_bot, three_bot, four_bot, five_bot, six_bot, seven_bot] = tokens.map(t => `https://api.telegram.org/bot${t}/sendPhoto`);

const [ bot_1, bot_2, bot_3, bot_4, bot_5, bot_6, bot_7 ] = [
  'https://t.me/isLateGoal_bot',
  'https://t.me/sendFootballMessage_bot',
  'https://t.me/luckTickets_bot',
  'https://t.me/luckLottery_bot',
  'https://t.me/luck8041_bot',
  'https://t.me/luck8041a_bot',
  'https://t.me/lucky8041b_bot',
];

const github = 'https://raw.githubusercontent.com/95du/scripts/master/img/icon';
const [ logo_1, logo_2, logo_3, logo_4, logo_5, logo_6, logo_7, logo_8, logo_9 ] = [
  `${github}/logo_1.png`,
  `${github}/logo_2.png`,
  `${github}/logo_3.png`,
  `${github}/logo_4.png`,
  `${github}/logo_5.png`,
  `${github}/logo_6.png`,
  `${github}/logo_7.png`,
  `${github}/logo_8.png`,
  `${github}/logo_9.png`,
];

/** ========💜 开始 💜======== */

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

/**
 * 并发运行任务，保证所有任务都会执行
 * @param {Promise[]} tasks - 任务数组
 */
const runTasks = async (tasks) => {
  const results = await Promise.allSettled(tasks);
  results.forEach(res => {
    if (res.status === 'rejected') {
      console.log(`\n😡 请求并发任务执行失败，错误信息: ${res.reason}`);
    }
  });
  return results;
};

/**
 * 词霸每日一句
 */
const getChiBaData = async () => {
  try {
    const res = await httpRequest({ url: 'http://open.iciba.com/dsapi', method: 'GET', headers: jsonHeaders });
    if (res?.note) return res;
  } catch (err) {
    console.log(`\n💢 词霸请求异常: ${formatError(err)}`);
  }
  return null;
};

/** ======❤️ 重置配置 ❤️====== */

// 清空禁用项和指定反向
const clearExclude = async () => {
  let changed = false;
  const clearedAccounts = [];
  bet_data.forEach(acc => {
    const cfg = acc?.settings;
    if (!cfg) return;
  
    let accountChanged = false;
    if (cfg.runTask && cfg.followTrend) {
      cfg.runTask = false;
      accountChanged = true;
    }
  
    const resetKeys = [
      'reverseTypes', 
      'reversePositions',
      'excludeTypes', 
      'excludePositions', 
      'useOpposite', 
    ];
    const needReset = resetKeys.some(k => Array.isArray(cfg[k]) ? cfg[k].length : cfg[k]);
    if (needReset) {
      resetKeys.forEach(k => cfg[k] = Array.isArray(cfg[k]) ? [] : false);
      accountChanged = true;
    }
  
    if (accountChanged) {
      clearedAccounts.push(
        acc.member_account
      );
      changed = true;
    }
  });
  
  if (changed) {
    $.setjson(bet_data, $.bet_data_key);
    const accountList = clearedAccounts.join('、');
    $.msg('清空完成 ✅', `账号 ${accountList}`, '已解除数组与位置的禁用\n任务已关闭 ( 智能跟随脚本将自动开启 )');
  } else {
    console.log('\nℹ️ 无需更新，所有账户已解除禁用');
  }
  $.done();
};

/** =========💜 推送 💜========= */

// 构建 Telegram Bot 请求体
const buildBotBody = (chat_id, options) => {
  const { text, caption, photo, buttons, parse_mode = 'HTML' } = options;
  const body = { chat_id, parse_mode };
  if (photo) body.photo = photo;
  if (caption) body.caption = caption;
  if (text) body.text = text;
  if (buttons) body.reply_markup = { inline_keyboard: buttons };
  return body;
};

/**
 * 发送通知到电报机器人
 */
const sendToBots = async (chat_id, botApis, options) => {
  await Promise.all(botApis.map(botApi => {
    const body = buildBotBody(chat_id, options);
    return $.http.post({
      url: botApi,
      headers: jsonHeaders,
      body: $.toStr(body)
    }).then(response => {
      if (response?.body) {
        const result = $.toObj(response.body);
        if (result.ok) {
          console.log(`\n🆘 ${$.name} 推送成功，用户ID ${chat_id}, 收件人: ${result.result.chat.first_name}`);
        } else {
          console.log(`\n🆔 ${$.name} 推送失败，用户ID: ${chat_id}, 错误: ${result.description}`);
        }
      } else {
        console.log(`\n❗️ 未收到有效响应，用户ID: ${chat_id}`);
      }
    }).catch(error => {
      console.log(`\n❌ 请求异常: 用户ID: ${chat_id}, 错误信息: ${formatError(error)}`);
    });
  }));
};

/**
 * 通用 (分批推送) Telegram Bot
 */
const sendBotData = async (botApis, infoLines, makeCaption, logoUrl, buttons = []) => {
  if (!infoLines?.length) return;
  const batchSize = 20;
  const firstSize = infoLines.length % batchSize || batchSize;
  const batches = [];
  let i = 0;
  batches.push(infoLines.slice(i, i + firstSize));
  i += firstSize;
  while (i < infoLines.length) {
    batches.push(infoLines.slice(i, i + batchSize));
    i += batchSize;
  }
  
  // for (const batch of batches)
  for (let idx = 0; idx < batches.length; idx++) {
    const batch = batches[idx];
    const batchInfoText = batch.join('\n');
    const caption = makeCaption(batchInfoText, idx);
    const options = { 
      caption, 
      photo: logoUrl 
    };
    if (idx === 0 && buttons?.length) options.buttons = buttons;
    const tasks = chatIDs.map(chat_id => sendToBots(chat_id, botApis, options));
    await runTasks(tasks);
  }
};

/**
 * 结束时 (05:00) 推送按钮与交互
 * 用于分割每天的消息(词霸每日一句)
 */
const pushDailySplit = async () => {
  const { tts, note, content, picture2 } = await getChiBaData();
  const botApis = tokens.map(token => `https://api.telegram.org/bot${token}/sendPhoto`);
  
  const buttons = [
    [{ text: "全单双", url: bot_1 },
    { text: "全大小", url: bot_2 }],
    [{ text: "一字定", url: bot_3 },
    { text: "二字定", url: bot_4 }],
    [{ text: "盈亏统计", url: bot_5 }]
  ];
  
  const tasks = chatIDs.map(chat_id =>
    sendToBots(chat_id, botApis, {
      buttons,
      photo: picture2,
      caption: `${note}\n<a href="${tts}">${content}</a>`
    })
  );
  await runTasks(tasks);
};

/** =========💜 通知 💜========= */

/** 判断当前是否已投注 */
const checkBetStatus = (memberData, bills = []) => {
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
      if (!account || !account?.cookie) continue;
      const { memberData, bill, log } = await fetchMemberAndBill(account);
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
      const emoji = profit_loss_money > 0 ? '✅' :  (profit_loss_money == 0 && win_money == 0) ? '⭕️' : '🚫';
      
      const title = `可用分 ${memberData?.credit_balance || 0}  ${profit_Text}`;
      const medium = `${emoji} 投注 ${bet_money} - 中奖 ${win_money} - 盈亏 ${profit_loss_money}`;
      const summaryText = nextItems.map(item => `${item.profit_loss_money > 0 ? '✅' : '🚫'} 投注 ${item.bet_money} - 中奖 ${item.win_money} - 盈亏 ${item.profit_loss_money}`).join('\n');

      $.msg(title, medium, summaryText);

      // 更新每期真实投注盈亏记录
      //const now = new Date().toTimeString().slice(0, 5);
      const nowShort = new Date(Date.now() + 8 * 3600000).toISOString().slice(5, 16).replace('T', ' ');
      account.profitLog = account.profitLog || [];
      account.profitLog.unshift(`${nowShort} - ${profit_Text}`);
      account.profitLog = account.profitLog.slice(0, 100);
      $.setjson(bet_data, $.bet_data_key);
    }
  } catch (err) {
    console.log(`\n❌ shouldNotify 执行错误: ${formatError(err)}`);
  }
};

/** ======🧡 通用小函数 🧡====== */

// 根据指定时分截取 drawRows
const sliceByTime = (rows, targetTime, field = "period_datetime") => {
  const index = rows.findIndex(
    item => (item[field]?.split(" ")[1] || "").slice(0, 5) === targetTime
  );
  return index !== -1 ? rows.slice(0, index + 1) : [];
};

// 获取星期几
const getWeekday = (dateStr) => {
  const date = new Date(dateStr);
  const days = [
    '星期日','星期一','星期二', 
    '星期三','星期四','星期五','星期六'
  ];
  return days[date.getDay()];
};

// 生成通用标题 (当期信息)
const generateHeader = (header) => {
  const week = getWeekday(header.period_datetime);
  const current = `<b>${header.thousand_no} ${header.hundred_no} ${header.ten_no} ${header.one_no} ${header.ball5}</b>`;
  return `<a href="${groupLink}">${header.period_no}期    ${current}</a>
${header.period_datetime}  ${week}\n`;
};

// 第几页
const formatBatchSummary = (headerText, batchInfoText, pageIdxText) => {
  return `${headerText}
<a href="${bot_1}">${pageIdxText}</a>
<blockquote expandable>${batchInfoText}</blockquote>`;
};

// 解析前四位数字（通用函数）
const parseFirstFour = (input) => {
  if (!input) return null;
  const nums = [
    parseInt(input.thousand_no, 10),
    parseInt(input.hundred_no, 10),
    parseInt(input.ten_no, 10),
    parseInt(input.one_no, 10),
  ];
  return nums.some(isNaN) ? null : nums;
};

// 统计数组里四重的次数（前四位完全相同）
const countFourfold = (drawRange) => 
  drawRange.reduce((count, obj) => {
    const [a, b, c, d] = [obj.thousand_no, obj.hundred_no, obj.ten_no, obj.one_no];
    return count + (a === b && b === c && c === d ? 1 : 0);
  }, 0);

// 统计二连、三连、四连的次数 (5分钟中一次)
const countFiveMinuteChains = (drawRows) => {
  const counts = { two: 0, three: 0, four: 0 };
  if (!drawRows?.length) return counts;
  const sorted = [...drawRows].sort(
    (a, b) => new Date(a.period_datetime) - new Date(b.period_datetime)
  );
  const commitChain = (len) => {
    if (len === 2) counts.two++;
    else if (len === 3) counts.three++;
    else if (len === 4) counts.four++;
  };

  let chainLength = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].period_datetime);
    const curr = new Date(sorted[i].period_datetime);
    const diffMinutes = Math.round((curr - prev) / 60000);
    if (diffMinutes === 5) chainLength++;
    else {
      commitChain(chainLength);
      chainLength = 1;
    }
  }
  commitChain(chainLength);
  return counts;
};

// 通用计算时间二/三/四连字符 (通用函数)
const chainsFormat = (chains) => {
  return `二连 <b>${chains.two}</b> 次，三连 <b>${chains.three}</b> 次，四连 <b>${chains.four}</b> 次\n`;
};

// 格式化开奖数据
const formatDraw = (draw) => {
  if (!draw) return { num: '', win: false, emoji: '🚫', time: '00:00' };
  const num = `${draw.thousand_no} ${draw.hundred_no} ${draw.ten_no} ${draw.one_no} ${draw.ball5}` || '0000';
  const win = isOdd(draw) || isEven(draw);
  const emoji = win ? '✅' : '🚫';
  const time = draw.draw_datetime?.split(" ")[1]?.slice(0, 5) || '00:00';
  return { num, win, emoji, time };
};

/** =====❤️ 单双大小四码 ❤️===== */

// 通用 Bot HTML 生成
const formatDetails = (headerText, totalText, chainsText, multipleText, batchInfoText) => {
  return `${headerText}
<a href="${bot_1}">${totalText}</a>
<blockquote>${chainsText}${multipleText}</blockquote>
<blockquote expandable>${batchInfoText}</blockquote>`;
};

/**
 * 通用处理函数
 * @param {Array} drawRows - 原始开奖数据
 * @param {Object} config - 配置对象
 */
const handlePatterns = async (drawRows, config) => {
  const drawRange = sliceByTime(drawRows, "08:05");
  if (!drawRange.length) return;

  // 获取所有符合条件的记录
  const list = drawRange.filter(obj => config.filters.some(fn => fn(obj)));
  list.sort((a, b) => new Date(b.period_datetime) - new Date(a.period_datetime));

  // 统计数量
  const counts = config.filters.map(fn => list.filter(fn).length);
  const fourfold = countFourfold(list);
  const chains = countFiveMinuteChains(list);
  const chainsText = chainsFormat(chains);

  // 生成 infoLines
  const infoLines = list.map((item, index) => {
    const type = config.typeResolver(item);
    const time = item.period_datetime.split(' ')[1].slice(0, 5);
    const reverseIndex = (list.length - index).toString().padStart(2, '0');
    return `${reverseIndex}，  ${time}    ( ${type} )    <a href="${bot_1}"><b>${item.thousand_no} ${item.hundred_no} ${item.ten_no} ${item.one_no} ${item.ball5}</b></a> `;
  });

  const totalText = `${Number((drawRange.length / 12).toFixed(1))} 小时已开出 ${list.length} 次`;
  const multipleText = config.countLabels
    .map((label, i) => `${label} <b>${counts[i]}</b> 次`)
    .join("， ") + `，四重 <b>${fourfold}</b> 次  `;

  const getTotalPages = (i, size = 20) => Math.ceil(i / size);
  const header = generateHeader(drawRange[0] || {});
  const botApis = drawRange.length > 0 ? [config.bot] : [];

  const makeCaption = (batchInfoText, batchIndex) => {
    if (batchIndex === 0) {
      return formatDetails(
        header,
        totalText,
        chainsText,
        multipleText,
        batchInfoText
      );
    }
    return formatBatchSummary(
      header,
      batchInfoText,
      `第 ${batchIndex + 1} 页 - 共 ${getTotalPages(list.length)} 页 ${list.length} 条`
    );
  };

  if (config.filters.some(fn => fn(drawRange[0]))) {
    await sendBotData(botApis, infoLines, makeCaption, config.logo);
  } else {
    console.log(`\n🈳 没有开出${config.name}号码，跳过推送`);
  }
};

/** ====== 专用筛选函数 ====== */

// 全单
const isOdd = (obj) => {
  const nums = parseFirstFour(obj);
  return nums && nums.every(n => n % 2 === 1);
};
// 全双
const isEven = (obj) => {
  const nums = parseFirstFour(obj);
  return nums && nums.every(n => n % 2 === 0);
};

// 全小数 01234
const is01234 = (obj) => {
  const nums = parseFirstFour(obj);
  return nums && nums.every(n => [0,1,2,3,4].includes(n));
};
// 全大数 56789
const is56789 = (obj) => {
  const nums = parseFirstFour(obj);
  return nums && nums.every(n => [5,6,7,8,9].includes(n));
};

/** ====== 两个四字调用入口 ====== */

const handleOddEven = async (drawRows) => {
  await handlePatterns(drawRows, {
    name: "全单双",
    filters: [isOdd, isEven],
    countLabels: ["全单", "全双"],
    typeResolver: (row) => isOdd(row) ? "单" : isEven(row) ? "双" : "",
    bot: one_bot,
    logo: logo_1
  });
};

const handleBigSmall = async (drawRows) => {
  await handlePatterns(drawRows, {
    name: "全大小",
    filters: [is01234, is56789],
    countLabels: ["全小", "全大"],
    typeResolver: (row) => is01234(row) ? "小" : is56789(row) ? "大" : "",
    bot: two_bot,
    logo: logo_2
  });
};

/** =======❤️ 定位合分 ❤️======= */

// 生成 Bot HTML (5个位8连)
const formatSecondDetails = (headerText, totalText, countText, batchInfoText) => {
  return `${headerText}
<a href="${bot_2}">${totalText}</a>
<blockquote>${countText}  </blockquote>
<blockquote expandable>${batchInfoText}</blockquote>`;
};

/**
 * 如果当前时间 ≤ 今天 05:00 → 截取 昨天 04:50 到当前的数据
 * 如果当前时间 > 今天 05:00 → 截取 今天 04:50 到当前的数据
 */
const getTargetDraws = (drawRows, now = new Date()) => {
  const year = now.getFullYear(), month = now.getMonth(), date = now.getDate();
  const todayTarget = new Date(year, month, date, 4, 50, 0);
  const fiveAM = new Date(year, month, date, 5, 0, 0);
  const startDate = now <= fiveAM
    ? new Date(year, month, date - 1, 4, 50, 0)
    : todayTarget;
  return drawRows.filter(
    item => new Date(item.period_datetime.replace(" ", "T")) >= startDate
  );
};

// 五种类型定义
const typeMap = {
  单: new Set([1, 3, 5, 7, 9]),
  双: new Set([2, 4, 6, 8, 0]),
  小: new Set([1, 2, 3, 4, 0]),
  大: new Set([5, 6, 7, 8, 9]),
  '12890': new Set([1, 2, 8, 9, 0]),
  '34567': new Set([3, 4, 5, 6, 7])
};

const positionPairs = [
  [0, 1], [0, 2], [0, 3],
  [1, 2], [1, 3], [2, 3],
];
const positionTriples = [
  [0,1,2], [0,2,3],
  [0,1,3], [1,2,3]
];
const positions = [
  'thousand_no', 'hundred_no',
  'ten_no', 'one_no', 'ball5'
];
const positionNames = ['仟','佰','拾','个','五'];

/**
 * 通用统计函数：统计指定位置/位置对的数字类型出现次数（含通知）
 */
const countTypesGeneric = (drawRows, getMatchValue, posConfigs, threshold = 6, customTypeMap = typeMap, title = '次数统计') => {
  const drawRange = sliceByTime(drawRows, "08:05");
  const patternsList = [];
  const rows = [...drawRange].reverse();
  const countSummary = { 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0 };

  posConfigs.forEach(config => {
    const posName = config.length === 1 ? positionNames[config[0]] : config.map(i => positionNames[i]).join('');
    for (const [typeName, typeSet] of Object.entries(customTypeMap)) {
      let count = 0, period_no = null, period_datetime = null;
      for (let i = 0; i < rows.length; i++) {
        const matchValue = getMatchValue(rows[i], config);
        if (typeSet.has(matchValue)) {
          count++;
          period_no = rows[i].period_no;
          period_datetime = rows[i].period_datetime;
        } else {
          if (count >= 2 && count < 8) countSummary[count]++;
          else if (count >= 8) countSummary[8]++;
          if (count >= threshold) patternsList.push({ position: posName, type: typeName, count, period_no, period_datetime });
          count = 0;
          period_no = null;
          period_datetime = null;
        }
      }
      if (count >= 2 && count < 8) countSummary[count]++;
      else if (count >= 8) countSummary[8]++;
      if (count >= threshold) patternsList.push({ position: posName, type: typeName, count, period_no, period_datetime });
    }
  });

  patternsList.sort((a,b) => new Date(b.period_datetime) - new Date(a.period_datetime));

  return {
    drawRange,
    patternsList,
    count2: countSummary[2],
    count3: countSummary[3],
    count4: countSummary[4],
    count5: countSummary[5],
    count6: countSummary[6],
    count7: countSummary[7],
    count8: countSummary[8]
  };
};

// 检查结果是否满足推送条件
const shouldPush = (patternsList, drawRows, typeDesc, streak = 6) => {
  if (!patternsList?.length) {
    console.log(`\n⛔️ 未找到${typeDesc}列表数据`);
    return false;
  }

  const latest = patternsList[0];
  const hasThreshold =
    drawRows[0]?.period_no === latest?.period_no &&
    latest?.count === streak;

  if (new Date().getHours() === 5 && latest?.count >= streak) {
    console.log(`\n⏰ 05点，${typeDesc}达到 ${latest.count} 连，强制推送`);
    return true;
  }

  if (!hasThreshold) {
    console.log(`\n🈳 最近 ${streak} 期中没有任何${typeDesc}，跳过推送`);
    return false;
  }
  return true;
};

/**
 * 通用处理函数：处理类型数据推送
 * @param {Function} countFunc - 计数函数，如 countPositionTypes 或 countPairSums
 */
const handleTypeData = async (drawRows, countFunc, threshold, botApis, logoUrl, typeDesc) => {
  const { drawRange, patternsList, count2, count3, count4, count5, count6, count7, count8 } = countFunc(drawRows, threshold);
  if (!shouldPush(patternsList, drawRows, typeDesc, 6)) return;
  
  // 统计并生成 infoLines 数组
  const infoLines = patternsList.map((item, index) => {
    const time = item.period_datetime.split(' ')[1].slice(0, 5);
    const reverseIndex = (patternsList.length - index).toString().padStart(2, '0');
    return `${reverseIndex}， ${time}     <a href="${bot_2}"><b>${item.position}   ${item.count}</b></a>   -   ${item.type}  `;
  });
  
  const totalText = `${Number((drawRange.length / 12).toFixed(1))} 小时已开出 ${patternsList.length} 次`;
  const countText = `<b>2</b> 连 ${count2}， <b>3</b> 连 ${count3}， <b>4</b> 连 ${count4}\n<b>5</b> 连 ${count5}，<b>6</b> 连 ${count6}，<b>7</b> 连 ${count7}，<b>8</b> 连 ${count8}`
  const getTotalPages = (i, size = 20) => Math.ceil(i / size);
  const header = generateHeader(drawRange[0]);
  
  const makeCaption = (batchInfoText, batchIndex) => {
    if (batchIndex === 0) {
      return formatSecondDetails(
        header,
        totalText,
        countText,
        batchInfoText
      );
    }
    return formatBatchSummary(
      header,
      batchInfoText,
      `第 ${batchIndex + 1} 页  -  共 ${getTotalPages(patternsList.length)} 页 ${patternsList.length} 条`
    );
  };
  
  await sendBotData(botApis, infoLines, makeCaption, logoUrl);
};

// 单定位统计
const countPosition = (drawRows, threshold = 6) => {
  const getMatchValue = (row, [posIndex]) => Number(row[positions[posIndex]]);
  const singlePosConfigs = positions.map((_, idx) => [idx]);
  return countTypesGeneric(drawRows, getMatchValue, singlePosConfigs, threshold, typeMap, '单字定位');
};

// 二字定统计
const countPairSums = (drawRows, threshold = 6) => {
  const getMatchValue = (row, [i, j]) => {
    const num1 = Number(row[positions[i]]);
    const num2 = Number(row[positions[j]]);
    return (num1 + num2) % 10;
  };
  return countTypesGeneric(drawRows, getMatchValue, positionPairs, threshold, typeMap, '两字定位');
};

// 三字定统计
const countTripleSums = (drawRows, threshold = 6) => {
  const getMatchValue = (row, [i,j,k]) => (Number(row[positions[i]]) + Number(row[positions[j]]) + Number(row[positions[k]])) % 10;
  return countTypesGeneric(drawRows, getMatchValue, positionTriples, threshold, typeMap, '三字定位');
};

// 处理单定位
const handelOnePositioning = async (drawRows) => {
  const botApis = [three_bot];
  await handleTypeData(drawRows, countPosition, 6, botApis, logo_3, '单字定位统计');
};

// 处理二字定位
const handelTwoPositioning = async (drawRows) => {
  const botApis = [four_bot];
  await handleTypeData(drawRows, countPairSums, 6, botApis, logo_4, '合分定位统计');
};

// 处理三字定 
const handelThreePositioning = async (drawRows) => {
  const botApis = [two_bot];
  await handleTypeData(drawRows, countTripleSums, 6, botApis, logo_5, '三字定位统计');
};

/** ====🧡 定位盈亏统计通用 🧡==== */

const formaFifthDetails = (headerText, totalText, betsLinesText, batchInfoText) => {
  return `${headerText}
${totalText}
<blockquote expandable>${betsLinesText}</blockquote>
<blockquote expandable>${batchInfoText}</blockquote>`;
};

// 推送统计结果
const handleCyclicType = async (drawRows, botApis, logoUrl, typeKey = '56789', groupMode = 'a', mode = '', baseCycle = [1, 3, 2, 4]) => {
  const drawRange = sliceByTime(drawRows, "08:05");
  if (!drawRange.length) return;

  const fn = groupMode === 'a' 
    ? handleProfitMultiType 
    : handleProfitMultiPair;
    
  const { positions, betLogs } = fn(drawRange, typeKey, baseCycle);
  if (!positions.length || !betLogs) {
    console.log(`\n⛔️ 未找到类型 ${typeKey} 的有效数据`);
    return { 
      positions: [], 
      betLogs: {} 
    }
  };

  const patternsList = positions.filter(item => item.position !== 'total');
  const infoLines = patternsList.map(item => {
    return `<a href="${bot_7}"><b>【 ${item.position} 】</b></a>  盈 ${item.win}，亏 ${item.loss}，盈亏 ${item.finalProfit}`;
  });

  const betList = betLogs?.bets || [];
  const betsLines = betList.map(item => `<a href="${bot_7}"><b>【 ${item.position} 】</b></a>  投分 <b>${item.bet_money}</b>`).join('\n');

  const header = generateHeader(drawRange[0] || {});
  const total = positions.find(item => item.position === 'total');
  const totalText = `<b>数组: </b> ${typeKey} ( ${mode} )\n<b>总盈: </b> ${total.win}\n<b>总亏: </b> ${total.loss}\n<b>总计: </b> ${total.finalProfit}`;

  const makeCaption = (batchInfoText, batchIndex) => formaFifthDetails(
    header,
    totalText,
    betsLines,
    batchInfoText
  );
  
  const minutes = new Date().getMinutes();
  if (minutes % 30 === 0 && !agent_data.disabledTasks.includes('profitPush')) {
    await sendBotData(botApis, infoLines, makeCaption, logoUrl);
  }
  return { positions };
};

// 定义多类型
const typeConditions = {
  '56789': val => [5, 6, 7, 8, 9].includes(val),
  '01234': val => [0, 1, 2, 3, 4].includes(val),
  '13579': val => [1, 3, 5, 7, 9].includes(val),
  '02468': val => [0, 2, 4, 6, 8].includes(val),
  '12890': val => [1, 2, 8, 9, 0].includes(val),
  '34567': val => [3, 4, 5, 6, 7].includes(val),
};

/** =====💜 单定位盈亏统计 💜===== */

const handleProfitMultiType = (drawRange, typeKey = '56789', baseCycle = [1, 3, 2, 4]) => {
  const isType = typeConditions[typeKey];
  const drawRows = [...drawRange].reverse();
  const positions = ['thousand_no',  'hundred_no', 'ten_no', 'one_no', 'ball5'];
  const positionNames = ['千','百','十','个','五'];
  const betCycle = baseCycle;
  const results = [];
  let grandWin = 0, grandLoss = 0;

  // 初始化每个位置的状态
  const states = positions.map(() => ({
    inBet: false,
    cycleIndex: 0,
    runningProfit: 0,
    totalProfit: 0,
    lastBet: 0,
    win: 0,
    loss: 0,
    logs: []
  }));

  for (let r = 0; r < drawRows.length; r++) {
    const row = drawRows[r];
    const period = row.period_no.slice(-3);
    const time = (row.period_datetime).split(' ')[1]?.slice(0, 5) || '';
    for (let idx = 0; idx < positions.length; idx++) {
      const pos = positions[idx];
      const posName = positionNames[idx];
      const num = Number(row[pos]);
      const st = states[idx];
      if (isType(num)) {
        if (!st.inBet) {
          st.inBet = true;
          st.cycleIndex = 0;
          st.runningProfit = 0;
          st.logs.push(`💥【${posName}位】进入投注阶段`);
          st.logs.push(`${time} ${period}期 → ${num} 开始投 ${betCycle[st.cycleIndex]}`);
          st.lastBet = betCycle[st.cycleIndex];
          st.cycleIndex = (st.cycleIndex + 1) % betCycle.length;
        } else {
          const win = st.lastBet;
          st.runningProfit += win;
          st.win += win;
          grandWin += win;
          st.logs.push(`${time} ${period}期 → ${num} ✅ 赢 +${win}，本轮盈亏 ${st.runningProfit}，投 ${betCycle[st.cycleIndex]}`);
          st.lastBet = betCycle[st.cycleIndex];
          st.cycleIndex = (st.cycleIndex + 1) % betCycle.length;
        }
      } else if (st.inBet) {
        const loss = st.lastBet;
        st.runningProfit -= loss;
        st.loss += loss;
        grandLoss += loss;
        st.logs.push(`${time} ${period}期 → ${num} ❌ 亏 -${loss}，停止投注，总盈亏 ${st.runningProfit}`);
        st.inBet = false;
        st.cycleIndex = 0;
        st.runningProfit = 0;
        st.lastBet = 0;
      }
    }
  }

  // 汇总结果
  for (let i = 0; i < positions.length; i++) {
    const st = states[i];
    st.totalProfit = st.win - st.loss;
    results.push({
      position: positionNames[i],
      win: st.win,
      loss: st.loss,
      finalProfit: st.totalProfit,
      log: st.logs.reverse().join('\n')
    });
  }

  const grandTotal = grandWin - grandLoss;
  // 生成投注信息
  const bets = [];
  for (let i = 0; i < positions.length; i++) {
    const st = states[i];
    if (st.inBet) {
      const isFivePosition = positionNames[i] === '五';
      bets.push({
        position: positionNames[i],
        bet_money: st.lastBet,
        number_type: isFivePosition ? "50" : "20",
        type: typeKey,
        continue: true
      });
    }
  }

  results.push({
    position: 'total',
    win: grandWin,
    loss: grandLoss,
    finalProfit: grandTotal,
    log: `全部位置总盈亏：${grandTotal}`
  });

  return {
    positions: results,
    betLogs: { bets }
  };
};

/** ======🩷 两字盈亏统计 🩷===== */

const handleProfitMultiPair = (drawRange, typeKey = '56789', baseCycle = [1, 3, 2, 4]) => {
  const isType = typeConditions[typeKey];
  const drawRows = [...drawRange].reverse();
  const positions = ['thousand_no', 'hundred_no', 'ten_no', 'one_no'];
  const positionNames = ['千', '百', '十', '个'];
  const betCycle = baseCycle;
  const results = [];
  let grandWin = 0, grandLoss = 0;

  const states = positionPairs.map(() => ({
    inBet: false,
    cycleIndex: 0,
    runningProfit: 0,
    win: 0,
    loss: 0,
    lastBet: 0,
    logs: []
  }));

  for (let r = 0; r < drawRows.length; r++) {
    const row = drawRows[r];
    const period = row.period_no.slice(-3);
    const time = row.period_datetime?.split(' ')[1]?.slice(0, 5) || '';
    for (let i = 0; i < positionPairs.length; i++) {
      const [p1, p2] = positionPairs[i];
      const n1 = Number(row[positions[p1]]);
      const n2 = Number(row[positions[p2]]);
      const name = positionNames[p1] + positionNames[p2];
      const st = states[i];
      const sumMod = (n1 + n2) % 10;
      const isMatch = isType(sumMod);
      if (isMatch) {
        if (!st.inBet) {
          st.inBet = true;
          st.cycleIndex = 0;
          st.runningProfit = 0;
          st.lastBet = betCycle[st.cycleIndex];
          st.logs.push(`💥【${name}】，开始进入投注`);
          st.logs.push(`${time} - ${period}期 ↗️ ${n1}${n2} 开始投 ${st.lastBet}`);
          st.cycleIndex++;
        } else {
          const win = st.lastBet;
          st.runningProfit += win;
          st.win += win;
          grandWin += win;
          const nextBet = betCycle[st.cycleIndex % betCycle.length];
          st.logs.push(`${time} - ${period}期 ⬆️ ${n1}${n2} ✅ 赢 +${win}，本轮盈亏 ${st.runningProfit}，投 ${nextBet}`);
          st.lastBet = nextBet;
          st.cycleIndex++;
        }
      } else {
        if (st.inBet) {
          const loss = st.lastBet;
          st.runningProfit -= loss;
          st.loss += loss;
          grandLoss += loss;
          st.logs.push(`${time} - ${period}期 ↔️ ${n1}${n2} ❌ 亏 -${loss}，停止投注，总盈亏 ${st.runningProfit}`);
          st.inBet = false;
          st.cycleIndex = 0;
          st.runningProfit = 0;
          st.lastBet = 0;
        }
      }
    }
  }

  const grandTotal = grandWin - grandLoss;
  results.push({
    position: 'total',
    type: typeKey,
    win: grandWin,
    loss: grandLoss,
    finalProfit: grandTotal,
    log: `全部位置总盈亏：${grandTotal}`
  });

  for (let i = 0; i < positionPairs.length; i++) {
    const st = states[i];
    results.push({
      position: positionNames[positionPairs[i][0]] + positionNames[positionPairs[i][1]],
      type: typeKey,
      win: st.win,
      loss: st.loss,
      finalProfit: st.win - st.loss,
      log: st.logs.reverse().join('\n')
    });
  }

  const bets = [];
  for (let i = 0; i < positionPairs.length; i++) {
    const st = states[i];
    if (st.inBet && st.lastBet > 0) {
      bets.push({
        position: positionNames[positionPairs[i][0]] + positionNames[positionPairs[i][1]],
        bet_money: st.lastBet,
        type: typeKey,
        continue: true
      });
    }
  }

  return {
    positions: results,
    betLogs: { bets }
  };
};

/** ======🧡 回放函数 🧡===== */ 

// 获取格式化时间
const getTime = (row) =>
  formatDraw(row)?.time ?? row.draw_datetime?.split(' ')[1]?.slice(0,5);

// 计算所有位置类型的 posStats
const calcPosStats = (rows, typeConfigs, groupMode, baseCycle) => {
  const posStats = {};
  typeConfigs.forEach(([typeKey]) => {
    const data = groupMode === 'a'
      ? handleProfitMultiType(rows, typeKey, baseCycle)
      : handleProfitMultiPair(rows, typeKey, baseCycle);
    data.positions.forEach(pos => {
      if (pos.position === 'total') {
        return;
      }
      posStats[pos.position] = posStats[pos.position] || { win: 0, loss: 0 };
      posStats[pos.position].win += pos.win || 0;
      posStats[pos.position].loss += pos.loss || 0;
    });
  });
  return posStats;
};

// 数字类型日志
const writeDigitLog = (digitLogsRef, typeKey, time, data, maxLogs) => {
  const total = data.positions.find(p => p.position === 'total') || { win: 0, loss: 0, finalProfit: 0 };
  const winTotal = data.positions.filter(p => p.position !== 'total').reduce((s,p)=>s+(p.win||0),0);
  const lossTotal = data.positions.filter(p => p.position !== 'total').reduce((s,p)=>s+(p.loss||0),0);
  const profit = total.finalProfit;
  digitLogsRef[typeKey] = digitLogsRef[typeKey] || [];
  const newLine = { time, win: winTotal, loss: lossTotal, profit };
  digitLogsRef[typeKey] = digitLogsRef[typeKey].filter(l => l.time !== time);
  digitLogsRef[typeKey]
    .unshift(newLine);
  digitLogsRef[typeKey] = digitLogsRef[typeKey].slice(0, maxLogs);
};

// 位置类型日志
const writePosLog = (positionLogsRef, posStats, posName, time, maxLogs) => {
  const pos = posStats[posName] || { win: 0, loss: 0 };
  const profit = pos.win - pos.loss;
  positionLogsRef[posName] = positionLogsRef[posName] || [];
  const newLine = { time, win: pos.win, loss: pos.loss, profit };
  positionLogsRef[posName] = positionLogsRef[posName].filter(l => l.time !== time);
  positionLogsRef[posName]
    .unshift(newLine);
  positionLogsRef[posName] = positionLogsRef[posName].slice(0, maxLogs);
};

// 更新日志
const updateLogsForRows = (rows, digitLogsRef, positionLogsRef, typeConfigs, posKeys, groupMode, baseCycle, time, maxLogs) => {
  const posStats = calcPosStats(rows, typeConfigs, groupMode, baseCycle);
  typeConfigs.forEach(([typeKey]) => {
    const data = groupMode === 'a'
      ? handleProfitMultiType(rows, typeKey, baseCycle)
      : handleProfitMultiPair(rows, typeKey, baseCycle);
    writeDigitLog(digitLogsRef, typeKey, time, data, maxLogs);
  });
  posKeys.forEach(pk => writePosLog(positionLogsRef, posStats, pk, time, maxLogs));
};

// 统计数字和位置绝对值
const calcProfitSum = (logRef) => {
  let posSum = 0;
  let negSum = 0;
  let absSum = 0;
  Object.values(logRef).forEach(logs => {
    if (!logs?.length) return;
    const p = logs[0].profit || 0;
    if (p > 0) posSum += p;
    else if (p < 0) negSum += Math.abs(p);
    absSum += Math.abs(p);
  });
  return { posSum, negSum, absSum };
};

/**
 * 数字位置类型日志
 */
const updateDigitPositionLogs = (
  drawRows,
  modeLabel,
  summaryData,
  groupMode,
  remarkLabel,
  typeConfigs,
  baseCycle
) => {
  const isReplay = agent_data?.isReplay ?? true;
  const maxLogs = 252;
  const groupKey = groupMode === 'a' ? 'a' : 'b';
  
  agent_data.posDigLogs = agent_data.posDigLogs || { a: {}, b: {} };
  agent_data.posDigLogs[groupKey][remarkLabel] =
    agent_data.posDigLogs[groupKey][remarkLabel] || { digit: {}, position: {} };

  const digitLogsRef = agent_data.posDigLogs[groupKey][remarkLabel].digit;
  const positionLogsRef = agent_data.posDigLogs[groupKey][remarkLabel].position;

  const posKeys = groupMode === 'a'
    ? ['千', '百', '十', '个', '五']
    : ['千百', '千十', '千个', '百十', '百个', '十个'];

  const drawRange = sliceByTime(drawRows, '08:05');
  if (!drawRange?.length) return;

  if (isReplay) {
    const orderedOld = [...drawRange].reverse();
    orderedOld.forEach((_, i) => {
      const partialOld = orderedOld.slice(0, i + 1);
      const sliceRows = [...partialOld].reverse();
      const time = getTime(sliceRows[0]);
      updateLogsForRows(sliceRows, digitLogsRef, positionLogsRef, typeConfigs, posKeys, groupMode, baseCycle, time, maxLogs);
    });
  } else {
    const time = summaryData.time;
    updateLogsForRows(drawRange, digitLogsRef, positionLogsRef, typeConfigs, posKeys, groupMode, baseCycle, time, maxLogs);
  }
  
  const digitSummary = calcProfitSum(digitLogsRef);
  const posSummary = calcProfitSum(positionLogsRef);
  const datetime = drawRange[0].period_datetime?.split(' ')[1]?.slice(0, 5);
  const previous = formatDraw(drawRange[0]);
  
  const notifyConfig = agent_data.notifyConfig;
  if (!notifyConfig || notifyConfig[modeLabel]) {
    $.msg(modeLabel.replace('盈亏汇总', '绝对值'), `${datetime} - 开奖结果  ${previous.num}  ${previous.emoji}`, `数字:  正值和 ${digitSummary.posSum}，负值和 -${digitSummary.negSum}，总和 ${digitSummary.absSum}\n位置:  正值和 ${posSummary.posSum}，负值和 -${posSummary.negSum}，总和 ${posSummary.absSum}`);
  }
  
  $.setjson(agent_data, $.agent_data_key);
};

/**
 * 通用多类型循环任务处理函数
 */
const processLoopTasks = async (drawRows, groupMode, typeConfigs, remarkLabel, baseCycle) => {
  const results = await runTasks(typeConfigs.map(([key, logo, botApis]) =>
    handleCyclicType(drawRows, botApis, logo, key, groupMode, remarkLabel, baseCycle)
  ));
  const { win, loss, profit } = results.reduce((acc, res) => {
    if (res.status === 'fulfilled' && res.value?.positions?.length) {
      const total = res.value.positions.find(p => p.position === 'total');
      if (total) { acc.win += total.win||0; acc.loss += total.loss||0; acc.profit += total.finalProfit||0; }
    }
    return acc;
  }, { win: 0, loss: 0, profit: 0 });
  return { win, loss, profit, time: formatDraw(drawRows[0]).time };
};

// 更新缓存与推送循环任务结果
const updateLoopSummary = async (
  drawRows,
  modeLabel,
  summaryData,
  remarkLabel,
  groupMode,
  typeConfigs,
  baseCycle
) => {
  const fmt = (data) => `${data.time} - 总盈 ${data.win}，总亏 ${data.loss}，总计 ${data.profit}`;

  // summaryLog 写入函数
  const writeSummary = (s) => {
    agent_data.summaryLog = agent_data.summaryLog || {};
    agent_data.summaryLog[modeLabel] = agent_data.summaryLog[modeLabel] || []
    const log = agent_data.summaryLog[modeLabel];
    const newLine = fmt(s);
    const filtered = log.filter(l => !l.startsWith(s.time));
    filtered.unshift(newLine);
    agent_data.summaryLog[modeLabel] = filtered.slice(0, 504);
  };

  // 回放模式：重新补齐并写 summaryLog
  const isReplay = agent_data?.isReplay ?? true;
  if (isReplay) {
    const drawRange = sliceByTime(drawRows, "08:05");
    if (!drawRange?.length) return;
    const oldestToLatest = [...drawRange].reverse();
    for (let i = 0; i < oldestToLatest.length; i++) {
      const partialOld = oldestToLatest.slice(0, i + 1);
      const partialLatest = [...partialOld].reverse();
      const s = await processLoopTasks(
        partialLatest,
        groupMode,
        typeConfigs,
        remarkLabel,
        baseCycle
      );
      const lastRow = partialOld[partialOld.length - 1];
      s.time = formatDraw(lastRow)?.time;
      writeSummary(s);
    }
  } else {
    writeSummary(summaryData);
  }
  
  // 发送通知
  const notifyConfig = agent_data.notifyConfig;
  if (!notifyConfig || notifyConfig[modeLabel]) {
    const summaryLogs = agent_data.summaryLog[modeLabel];
    const [newEntry, ...historyList] = summaryLogs || [];
    const history = historyList.slice(0, 2).join("\n");
    $.msg(modeLabel, newEntry, history);
  }
  
  $.setjson(agent_data, $.agent_data_key);
};

// 主逻辑：判断执行周期
const handleLoopPositioning = async (
  drawRows, 
  modeLabel, 
  remarkLabel, 
  groupMode, 
  typeConfigs, 
  baseCycle
) => {
  const summaryData = await processLoopTasks(drawRows, groupMode, typeConfigs, remarkLabel, baseCycle);
  await updateLoopSummary(drawRows, modeLabel, summaryData, remarkLabel, groupMode, typeConfigs, baseCycle);
  updateDigitPositionLogs(drawRows, modeLabel, summaryData, groupMode, remarkLabel, typeConfigs, baseCycle);
};

// 🧩 全系统统一配置
const unifiedBotConfig = [
  ['56789', logo_9, [five_bot]],
  ['01234', logo_8, [five_bot]],
  ['13579', logo_7, [six_bot]],
  ['02468', logo_6, [six_bot]],
  ['12890', logo_5, [seven_bot]],
  ['34567', logo_4, [seven_bot]],
];

// 🟠 单字定位
const handleOnePositioning_1 = (drawRows) => handleLoopPositioning(drawRows, '单字定位盈亏汇总 1324', '1324', 'a', unifiedBotConfig, [1, 3, 2, 4]);
  
const handleOnePositioning_2 = (drawRows) =>
  handleLoopPositioning(drawRows, '单字定位盈亏汇总 4231', '4231', 'a', unifiedBotConfig, [4, 2, 3, 1]);

// 🟢 两字定位
const handleTwoPositioning_1 = (drawRows) =>
  handleLoopPositioning(drawRows, '两字定位盈亏汇总 1324', '1324', 'b', unifiedBotConfig, [1, 3, 2, 4]);
  
const handleTwoPositioning_2 = (drawRows) =>
  handleLoopPositioning(drawRows, '两字定位盈亏汇总 4231', '4231', 'b', unifiedBotConfig, [4, 2, 3, 1]);
  
/** ======💜 保存记录 💜====== */

// 保存 drawRows，最多保留 7 天
const saveRecordRows = (drawRows) => {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < 300 || minutes > 305) return;
  const today = new Date().toISOString().slice(0, 10);
  let records = $.getjson($.recordRows_key) || [];
  // 查找当天是否已有记录
  const idx = records.findIndex(r => r.date === today);
  const exists = idx !== -1;
  if (exists) {
    records[idx] = { date: today, data: drawRows };
  } else {
    records.unshift({ date: today, data: drawRows });
  }
  // 保留最近 15 天
  if (records.length > 15) {
    records = records.slice(0, 15);
  }
  $.setjson(records, $.recordRows_key);
  $.msg(`${exists ? '覆盖' : '新增'}保存 ${today} 成功 ✅`, '', `当前共 ${records.length} 天记录，最多保留 15 天`);
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

// 限制时间段不执行
const isBetweenLimit = (now = new Date()) => {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= 310 && minutes <= 480; // 05:10 - 08:00
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
    const pages = agent_data && agent_data.cookie ? 11 : 17;
    const page = !agent_drawRows.length ? pages : 1;
    let drawRows = await fetchDrawRows(page, 2, 1000);
    if (!drawRows?.length) {
      $.msg('登录可能已失效 ⚠️', ``, "重新登录页面更新 Cookie");
      return;
    }
    
    if (isBetweenLimit()) {
      console.log(`\n🆘❎ 当前时间不在开奖区间，脚本停止执行 ❎🆘`);
      await clearExclude();
      return;
    }
    
    drawRows = await mergeDrawData(agent_drawRows, drawRows, pages);
    const status = drawRows[0]?.period_status || '1';
    if (status === '3') {
      const skipTasks = agent_data.disabledTasks || [];
      const tasks = [
        handleOddEven,
        handleBigSmall,
        handelOnePositioning,
        handelTwoPositioning,
        handleOnePositioning_1,
        handleOnePositioning_2,
        handleTwoPositioning_1,
        handleTwoPositioning_2,
      ].filter(fn => !skipTasks.includes(fn.name));
      await runTasks(tasks.map(fn => fn(drawRows)));
      await shouldNotify();
    }

    // 05:00 推送每日分割内容
    if (status === '3' && new Date().getHours() === 5) {
      // 储存记录
      saveRecordRows(drawRows);
      if (!agent_data.disabledTasks.includes('dailyPush')) await pushDailySplit();
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