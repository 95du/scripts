// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: dove;

const getCacheData = async (name, url, cacheHours = 24) => {
  const fm = FileManager.local();
  const basePath = fm.joinPath(fm.documentsDirectory(), '95du_lottery');
  if (!fm.fileExists(basePath)) fm.createDirectory(basePath);
  const path = fm.joinPath(basePath, name);
  if (fm.fileExists(path)) {
    const createTime = fm.creationDate(path).getTime();
    const hoursPassed = (Date.now() - createTime) / (60 * 60 * 1000);
    if (hoursPassed <= cacheHours) {
      return fm.readString(path);
    } else {
      fm.remove(path);
    }
  }
  const res = await new Request(url).loadString();
  if (res) fm.writeString(path, res);
  return res;
};

// ✅ 获取 BoxJs 数据
const getBoxjsData = async (key = 'bet_data') => {
  try {
    const data = await new Request(`http://boxjs.com/query/data/${key}`).loadJSON();
    return JSON.parse(data.val);
  } catch {
    return [];
  }
};

const calcLastSeconds = (now = Date.now()) => {
  const PERIOD = 5 * 60 * 1000;
  const OFFSET = 25 * 1000;
  const nextBlock = Math.ceil(now / PERIOD) * PERIOD;
  const closeTime = nextBlock - OFFSET;
  return Math.max(0, Math.floor((closeTime - now) / 1000));
};

const [betData, agent_data] = await Promise.all([
  getBoxjsData('bet_data'),
  getBoxjsData('agent_data')
]);

const account = betData[0];
const { member_account, previous_draw_no, period_no, credit_balance } = account.Data;
const previous_no = previous_draw_no.replace(/,/g, " ");
const curStatus = {
  last_seconds: calcLastSeconds(),
  period_no,
  next_period_no: period_no,
  status : 0,
}

const style = await getCacheData('style.css', 'https://raw.githubusercontent.com/95du/scripts/refs/heads/master/module/FiveMinutes.css');
const codeMaker = await getCacheData('codeMaker.js', 'https://raw.githubusercontent.com/95du/scripts/master/module/codeMaker.js');

const drawRows = {
  Status: 1,
  Data: {
    Rows: agent_data?.drawRows?.map(row => ({
      ...row,
      period_datetime: row.period_datetime.split(' ')[1]
    })),
    PageIndex: 1,
    PageSize: 15,
    PageCount: 17,
    RecordCount: 252,
  }
};

const intercept = `
document.addEventListener('DOMContentLoaded', () => {
  const showTips = (msg, duration = 1500) => {
    const tip = document.getElementById("tip");
    const text = tip.querySelector("span");
    text.textContent = msg;
    tip.classList.remove("hide");
    tip.classList.add("show");
    clearTimeout(tip.timer);
    tip.timer = setTimeout(() => {
      tip.classList.remove("show");
      tip.classList.add("hide");
    }, duration);
  };

  if ($.validator) {
    $.validator.setDefaults({
      focusInvalid: false,
      onfocusout: false,
      onkeyup: false,
      showErrors: (_, list) => list.length && showTips(list[0].message)
    });
  }

  if ($.alert) {
    $.alert = (msg, cb) => { showTips(msg); cb && cb(); };
  }
  
  if ($.confirm) {
    $.confirm = function(msg, okCb, cancelCb) {
      showTips(msg);
      // if (typeof okCb === 'function') okCb(); // 直接执行
    };
  }

  window.G = window.G || {};
  G.modules = G.modules || {};
  G.instance = G.instance || {};
  const kx = window.__kx = new Kuaixuan({ json: { Param: {} } });
  kx.d = $('#kuaixuan');
  kx.bd_template = $('#bd_template');
  kx.init();
  
  // 倒计时结束不刷新页面
  if (typeof Header !== 'undefined') {
    const header = new Header($('#header'));
    G.instance.header = header;
    const mockData = ${JSON.stringify(curStatus)} || {};
    const originalDoCountDown = header.doCountDown;
    header.doCountDown = function(t, e, i, n) {
      const o = n && n === 'current_period' ? \`距离\${t.period_no}期封盘还有\` : \`距离\${t.next_period_no}期开盘还有\`;
      i(o, e);
      if (this.timer_status) clearInterval(this.timer_status);
      const self = this; this.timer_status = setInterval(() => (e--, i(o, e)), 1e3);
    };
    header.showSystemInfo(mockData);
  }
  
  // 生成按钮强制执行，无视验证
  document.addEventListener('click', function(ev) {
    const btn = ev.target.closest('#btn_create');
    if (!btn) return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    const instance = kx;
    try { instance.createNumber(); }
    catch (e) {}
  }, true);
  
  // 复位
  const resetAll = () => {
    const btn = document.getElementById('btn_reset');
    if (btn) btn.click(); 
    else kx.codeMaker.reset();
  };
  
  // 拦截下注，返回请求体
  kx.doSave = function () {
    const f = this.codeMaker;
    if (!f?.numberList?.length) return showTips("请至少选择一个号码");
  
    const body = Object.entries({
      bet_number: f.numberList.join(','),
      bet_money: $('#bet_money').val(),
      bet_way: 102,
      is_xian: f.options.isXian,
      number_type: f.options.numberType,
      bet_log: f.logs.join('，'),
      guid: this.guid,
      period_no: ${curStatus?.period_no},
      operation_condition: f.operation_condition
    }).map(([k, v]) => k + '=' + encodeURIComponent(typeof v === 'object' ? JSON.stringify(v) : v))
      .join('&');
    completion?.(body);
    window.dispatchEvent(new CustomEvent('JBridge', { detail: body }));
    
    // 显示动画
    const $n = $("#numberList")
    const $s = $(".betStatus")
    const $c = $("#multi_count");
    $n.hide(); $s.show(); 
    $c.html("0").removeClass("red");
    const total = f.numberList.length;
    $s.find('span').text(total); 
    const start = Date.now();
    const duration = Math.min(1000, 500 + total * 0.7);
  
    const step = () => {
      $c.addClass("red");
      const p = Math.min((Date.now() - start) / duration, 1);
      $c.html(Math.floor(total * p));
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        const audio = document.getElementById('audio');
        if (audio) audio.play();
        setTimeout(() => { $s.hide(); $n.show(); resetAll(); }, 600);
      }
    };
    requestAnimationFrame(step);
  };
  
  const drawResult = ${JSON.stringify(drawRows)};
  if (window.template && drawResult?.Data) {
    const html = template('tpl_refresh', {
      HideYiziWuer: '0',
      Data: drawResult.Data
    });
    document.getElementById('tbody')
    .innerHTML = html;
  };
  
  window.showModule = function (id) {
    const modules = document.querySelectorAll('[name="module"]');
    modules.forEach(el => el.classList.remove('active'));
  
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
  
    if (id === 'drawnumber') document.getElementById('pager')?.classList.add('active');
  
    const tabs = document.querySelectorAll('.header-tabs span');
    tabs.forEach(tab => {
      tab.classList.remove('active');
      tab.classList.add('inactive');
    });
  
    const activeTab =
      id === 'drawnumber' ? document.getElementById('tab_draw') : document.getElementById('tab_kuaixuan');
    activeTab.classList.add('active');
    activeTab.classList.remove('inactive')
  };
    document.getElementById('tab_draw')?.addEventListener('click', () => {
    showModule('drawnumber');
  });
  document.getElementById('tab_kuaixuan')?.addEventListener('click', () => {
    showModule('kuaixuan');
  });
  showModule('kuaixuan');
})`;

const html = `
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link href="/Styles/style-FiveMinutes.css?v=20250912115700000" type="text/css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
  <style>
    ${style}
    body { font-family: -apple-system,Arial; }
    .t-1 .bg3 td {
      background:#e3f5fd;
    }
    .header {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 4.8rem;
      background: #fb5924;
      font-weight: bold;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      font-size: 1.5rem;
      color: yellow;
    }
    .header-1 {
      line-height: 2rem;
    }
    .header-tabs {
      display: flex;
      gap: 1.2rem;
    }
    .header-tabs span {
      cursor: pointer;
      transition: color .2s;
    }
    /* 当前显示 */
    .header-tabs span.active {
      color: #fff;
      opacity: 0.7;
    }
    .header-2 {
      margin-top: 0.3rem;
      font-size: 1.2rem;
      line-height: 1.4rem;
      color: #fff;
    }
    .systime { 
      margin-top: -2rem; 
    }
    .module {
      position: absolute;
      top: calc(5rem + 2.6rem);
      bottom: 0;
      left: 0; 
      right: 0;
      overflow-y: auto;
    }
    [name="module"] {
      display: none;
    }
    [name="module"].active {
      display: block;
    }
    #tip {
      position: fixed;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.7);
      color: #fff;
      padding: 15px 20px;
      border-radius: 15px;
      z-index: 9999;
      max-width: 80%;
      width: auto;
      opacity: 0;
      pointer-events: none;
      transition: opacity .25s ease-in-out;
    }
    #tip.show { opacity: 1; }
    #tip.hide { opacity: 0; }
    /* 开奖结果 */
    .bg-ball {
      display: inline-block;
      width: 2rem;
      height: 2rem;
      line-height: 2rem;
      text-align: center;
      border-radius: 50%;
      margin: 0.8rem 0.4rem;
    }
  </style>
</head>
<body>
  <div id="header" class="header">
    <div class="header-1">
      <div class="header-tabs">
        <span id="tab_kuaixuan">快选规则</span><span id="tab_draw">开奖结果</span>
      </div>
    </div>
    <div class="header-2">开奖结果 ${previous_no} &nbsp;&nbsp;账号 ${member_account}&nbsp;&nbsp;可用 ${credit_balance}
    </div>
  </div>
  <div class="tc systime" id="systime"></div>
  <div id="tip"><span></span></div>
  <div class="module">
    <div name="module" id="drawnumber" class="m5 mt5">
      <form id="form1" autocomplete="off">
        <div class="mt10" id="bd_serverinfo">
          <table class="t-1">
            <thead>
              <tr class="bg3 tc">
                <td colspan="11">
                  开奖号码
                </td>
              </tr>
            </thead>
          </table>
        </div>
      </form>
      <div class="mt10">
        <form>
          <table class="t-1">
            <thead>
              <tr class="bg3" style="text-align:center">
                <td width="15%">期号</td>
                <td width="15%">开奖时间</td>
                <td width="10%">仟</td>
                <td width="10%">佰</td>
                <td width="10%">拾</td>
                <td width="10%">个</td>
                <td width="10%">五</td>
              </tr>
            </thead>
            <tbody id="tbody" class="fn-hover"> <script type="text/html" id="tpl_refresh">
              {{if !Data.Rows.length}}
              <tr>
                <td colspan="8">暂无数据！</td>
              </tr>
              {{else}}
                {{each Data.Rows as item i }}
                {{var is_show1 = item.period_status == 3;}}
                {{var is_show2 = (item.thousand_no != "0" || item.hundred_no != "0" || item.ten_no != "0" || item.one_no != "0" || item.ball5 != "0");}}
                {{var is_show = (is_show1 || is_show2);}}
                {{if i==0 && Data.PageIndex == 1 }}
                <tr>
                  <td>
                    {{item.period_no}}
                    <span class="red">
                      {{if item.is_deleted == 1}}(已删){{/if}}
                      {{if item.enable_status == 2}}(已废置){{/if}}
                      {{if item.enable_status == 3}}(休市){{/if}}
                    </span>
                  </td>
                  <td>{{if item.period_status != 3}}--
                    {{else}}{{item.period_datetime}}{{/if}}
                  </td>
                  <td>
                    <span class="bg-ball ball2">{{if is_show}}{{item.thousand_no}}{{/if}}</span>
                  </td>
                  <td>
                    <span class="bg-ball ball2">{{if is_show}}{{item.hundred_no}}{{/if}}</span>
                  </td>
                  <td>
                    <span class="bg-ball ball2">{{if is_show}}{{item.ten_no}}{{/if}}</span>
                  </td>
                  <td>
                    <span class="bg-ball ball2">{{if is_show}}{{item.one_no}}{{/if}}</span>
                  </td>
                  {{if HideYiziWuer == '0'}}
                  <td>
                    <span class="bg-ball ball2">{{if is_show}}{{item.ball5}}{{/if}}</span>
                  </td>
                  {{/if}}
                </tr>
                {{else}}
                  <tr>
                    <td>
                      {{item.period_no}}
                      <span class="red">
                        {{if item.is_deleted == 1}}(已删){{/if}}
                        {{if item.enable_status == 2}}(已废置){{/if}}
                        {{if item.enable_status == 3}}(休市){{/if}}
                      </span>
                    </td>
                    <td>{{if item.period_status != 3}}--
                      {{else}}{{item.period_datetime}}{{/if}}
                    </td>
                    <td>
                      <span class="bg-ball ball1">{{if is_show}}{{item.thousand_no}}{{/if}}</span>
                    </td>
                    <td>
                      <span class="bg-ball ball1">{{if is_show}}{{item.hundred_no}}{{/if}}</span>
                    </td>
                    <td>
                      <span class="bg-ball ball1">{{if is_show}}{{item.ten_no}}{{/if}}</span>
                    </td>
                    <td>
                      <span class="bg-ball ball1">{{if is_show}}{{item.one_no}}{{/if}}</span>
                    </td>
                    {{if HideYiziWuer == '0'}}
                    <td>
                      <span class="bg-ball ball1">{{if is_show}}{{item.ball5}}{{/if}}</span>
                    </td>
                    {{/if}}
                  </tr>
                  {{/if}}
                  {{/each}}
                  {{/if}}
              </script>
            </tbody>
          </table>
        </form>
      </div>
    </div>
    <div name="module" id="pager" class="pager" >第 <span class="pageindex red">1</span> 页 共 <span class="pagecount red">17</span> 页 共 <span class="recordcount red">252</span> 条 <br />
    </div>
    <!-- 快选模块 -->
    <div name="module" id="kuaixuan" class="kuaixuan">
      <div class="right mt10">
        <div class="bd m5">
          <table width="100%" class="tb-kuaixuan tc" id="tab_kuaixuan">
            <tr>
              <td width="33.3%" class="on">
                <input type="button" value="二字定" class="fn-module btn-large kx-btn" module="erd">
              </td>
              <td width="33.3%">
                <input type="button" value="三字定" class="fn-module btn-large kx-btn" module="sand">
              </td>
              <td width="33.3%">
                <input type="button" value="四字定" class="fn-module btn-large kx-btn" module="sid">
              </td>
            </tr>
            <tr>
              <td width="16.7%">
                <input type="button" value="二字现" class="fn-module btn-large kx-btn" module="erx">
              </td>
              <td width="16.7%">
                <input type="button" value="三字现" class="fn-module btn-large kx-btn" module="sanx">
              </td>
              <td width="16.7%">
                <input type="button" value="四字现" class="fn-module btn-large kx-btn" module="six">
              </td>
            </tr>
            <tr>
              <td width="16%">
                <input type="button" value="五位二定" class="fn-module btn-large kx-btn" module="fifteen">
              </td>
              <td></td>
              <td></td>
            </tr>
          </table>
          <form id="createForm">
            <div id="bd_template">
            </div>
          </form>
        </div>
        <div class="tc mt10">
          <input id="btn_create" type="button" value="生成" class="btn btn-large">
          <input id="btn_reset" type="button" value="复位" class="btn btn-large">
          <input type="button" value="登录" class="btn btn-large" onclick="window.location.href = 'https://m1.w5887na2.xyz/'" >
        </div>
        <div class="mt10">
          <div class="bd m5">
            <table class="t-1" cellpadding="0" cellspacing="0">
              <thead>
                <tr class="bg3">
                  <td>号码框</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="no-padding">
                    <div style="overflow-y:auto;min-height:100px; max-height:300px;">
                      <table class="t-2 tc" id="numberList" cellpadding="0" cellspacing="0"></table>
                      <div class="betStatus"><img src="https://raw.githubusercontent.com/95du/scripts/master/img/ticket/loading.gif" /><br /><br /><span>0</span>个注单正在投注，已完成<i id="multi_count"></i>个
                    </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <form id="sendForm" autocomplete="off">
              <div class="mt10">
                <table class="t-1">
                  <thead>
                    <tr class="bg3">
                      <td colspan="2">发送框</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td rowspan="2" width="55%">
                        <span class="f2r vm">金额</span> <input id="bet_money" type="text" maxlength="8" required="true" positive="true" class="text-large w60"> <input id="btn_bet" type="submit" value="下注" class="btn btn-large"> <input type="hidden" name="operation_condition" id="operation_condition">
                      </td>
                      <td>笔数：<span id="numberCount"></span></td>
                    </tr>
                    <tr>
                      <td>金额：<span id="numberAmount"></span>元</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <script type="text/html" id="tpl_erd">
      <table style="margin:23px 0" class="t-1">
        <tr class="bg2">
          <td colspan="2" class="tc">
            <strong class="red2">定位置</strong>
            <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="1">除</label>
            <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="0" checked="checked">取</label>
          </td>
          <td colspan="2" class="tc">
            <strong class="red2">配数全转</strong>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0">取</label>
          </td>
        </tr>
        <tr class="fixed-input tc">
          <td colspan="4">
            <div> 仟<input type="text" class="w90" boxNumber="1" name="qian" digits="true" maxlength="10" value="{{Param.qian}}"> 佰<input type="text" class="w90" boxNumber="2" name="bai" digits="true" maxlength="10" value="{{Param.bai}}">
            </div>
            <div class="mt5"> 拾<input type="text" class="w90" boxNumber="3" name="shi" digits="true" maxlength="10" value="{{Param.shi}}"> 个<input type="text" class="w90" boxNumber="4" name="ge" digits="true" maxlength="10" value="{{Param.ge}}">
            </div>
          </td>
        </tr>
        <tr class="match-input hide">
          <td colspan="4" class="tc">
            <input type="text" class="w90" boxNumber="1" name="pei1" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="2" name="pei2" digits="true" maxlength="10">
          </td>
        </tr>
        <tr class="bg2">
          <td colspan="4" class="tc">
            <strong class="red2">合</strong>&nbsp;&nbsp; <strong class="red2">分</strong>
            <label><input type="checkbox" class="remain-fixed-filter checkbox" remainFixedFilter="1">除</label>
            <label><input type="checkbox" class="remain-fixed-filter checkbox" remainFixedFilter="0" checked="checked">取</label>
          </td>
        </tr>
        <tr class="tc">
          <td colspan="4">
            <div class="remain-fixed-filter-item"> 1. <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="text" class="w90" name="he1" digits="true" maxlength="10">
            </div>
            <div class="remain-fixed-filter-item mt5"> 2. <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="text" class="w90" name="he2" digits="true" maxlength="10">
            </div>
            <div class="remain-fixed-filter-item mt5"> 3. <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="text" class="w90" name="he3" digits="true" maxlength="10">
            </div>
            <div class="remain-fixed-filter-item mt5"> 4. <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="text" class="w90" name="he4" digits="true" maxlength="10">
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="4" class="remain-match-filter-item">
            <strong class="red2">不定位合分</strong>
            <label><input type="checkbox" remainMatchFilter="2" class="remain-match-filter checkbox">两数合</label>&nbsp;&nbsp;&nbsp;&nbsp; <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <strong class="red2">全转</strong> <input type="text" class="transform-filter-item w80" name="quanzhuan" digits="true" maxlength="10">
            <strong class="red2">上奖</strong> <input type="text" class="upper-filter-item w80" name="shangjiang" digits="true" maxlength="10">
            <span class="inlineblock">
              <span class="inlineblock">
                <strong class="red2">排除</strong> <input type="text" class="except-filter-item w80" name="paichu" digits="true" maxlength="10">
              </span>
              <strong class="red2">乘号位置</strong>
              <input type="checkbox" class="symbol-filter-item">
              <input type="checkbox" class="symbol-filter-item">
              <input type="checkbox" class="symbol-filter-item">
              <input type="checkbox" class="symbol-filter-item">
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked">取</label> 二字定含 <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10">
            <span class="inlineblock"> 二字定复式 <input type="text" class="multiple-filter-item w80" name="fushi" digits="true" maxlength="10">
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>)
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
          </td>
        </tr>
        <tr>
          <td colspan="4" class="logarithm-number-item">
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
            <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
          </td>
        </tr>
      </table>
    </script>
    <script type="text/html" id="tpl_sand">
      <table style="margin:23px 0" class="t-1">
        <tr class="bg2">
          <td colspan="2" class="tc">
            <strong class="red2">定位置</strong>
            <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="1">除</label>
            <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="0" checked="checked">取</label>
          </td>
          <td colspan="2" class="tc">
            <strong class="red2">配数全转</strong>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0">取</label>
          </td>
        </tr>
        <tr class="fixed-input tc">
          <td colspan="4">
            <div> 仟<input type="text" class="w90" boxNumber="1" name="qian" digits="true" maxlength="10" value="{{Param.qian}}"> 佰<input type="text" class="w90" boxNumber="2" name="bai" digits="true" maxlength="10" value="{{Param.bai}}">
            </div>
            <div class="mt5"> 拾<input type="text" class="w90" boxNumber="3" name="shi" digits="true" maxlength="10" value="{{Param.shi}}"> 个<input type="text" class="w90" boxNumber="4" name="ge" digits="true" maxlength="10" value="{{Param.ge}}">
            </div>
          </td>
        </tr>
        <tr class="match-input hide">
          <td colspan="4" class="tc">
            <input type="text" class="w90" boxNumber="1" name="pei1" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="2" name="pei2" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="3" name="pei3" digits="true" maxlength="10">
          </td>
        </tr>
        <tr class="bg2">
          <td colspan="4" class="tc">
            <strong class="red2">合</strong>&nbsp;&nbsp; <strong class="red2">分</strong>
            <label><input type="checkbox" class="remain-fixed-filter checkbox" remainFixedFilter="1">除</label>
            <label><input type="checkbox" class="remain-fixed-filter checkbox" remainFixedFilter="0" checked="checked">取</label>
          </td>
        </tr>
        <tr class="tc">
          <td colspan="4">
            <div class="remain-fixed-filter-item"> 1. <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="text" class="w90" name="he1" digits="true" maxlength="10">
            </div>
            <div class="remain-fixed-filter-item mt5"> 2. <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="text" class="w90" name="he2" digits="true" maxlength="10">
            </div>
            <div class="remain-fixed-filter-item mt5"> 3. <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="text" class="w90" name="he3" digits="true" maxlength="10">
            </div>
            <div class="remain-fixed-filter-item mt5"> 4. <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="text" class="w90" name="he4" digits="true" maxlength="10">
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="4" class="remain-match-filter-item">
            <strong class="red2">不定位合分</strong><br>
            <label><input type="checkbox" class="remain-match-filter checkbox" remainMatchFilter="2">两数合</label>
            <input type="text" class="w90" name="budinghe" digits="true" maxlength="10"> &nbsp;&nbsp; <label><input type="checkbox" class="remain-match-filter-three checkbox" remainMatchFilterThree="3">三数合</label>
            <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <strong class="red2">全转</strong> <input type="text" class="transform-filter-item w80" name="quanzhuan" digits="true" maxlength="10">
            <strong class="red2">上奖</strong> <input type="text" class="upper-filter-item w80" name="shangjiang" digits="true" maxlength="10">
            <span class="inlineblock">
              <strong class="red2">排除</strong> <input type="text" class="except-filter-item w80" name="paichu" digits="true" maxlength="10">
              <span class="inlineblock">
                <strong class="red2">乘号位置</strong>
                <input type="checkbox" class="symbol-filter-item">
                <input type="checkbox" class="symbol-filter-item">
                <input type="checkbox" class="symbol-filter-item">
                <input type="checkbox" class="symbol-filter-item">
              </span>
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked">取</label> 三字定含 <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10">
            <span class="inlineblock"> 三字定复式 <input type="text" class="multiple-filter-item w90" name="fushi" digits="true" maxlength="10">
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>) 
            <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="1">除</label>
            <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">三重</strong>) 
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
            <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="1">除</label>
            <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">三兄弟</strong>)
          </td>
        </tr>
        <tr>
          <td colspan="4" class="logarithm-number-item">
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
            <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
          </td>
        </tr>
      </table>
    </script>
    <script type="text/html" id="tpl_sid">
      <table style="margin:23px 0" class="t-1">
        <tr class="bg2">
          <td colspan="2" class="tc">
            <strong class="red2">定位置</strong>
            <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="1">除</label>
            <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="0" checked="checked">取</label>
          </td>
          <td colspan="2" class="tc">
            <strong class="red2">配数全转</strong>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0">取</label>
          </td>
        </tr>
        <tr class="fixed-input tc">
          <td colspan="4">
            <div> 仟<input type="text" class="w90" boxNumber="1" name="qian" digits="true" maxlength="10" value="{{Param.qian}}"> 佰<input type="text" class="w90" boxNumber="2" name="bai" digits="true" maxlength="10" value="{{Param.bai}}">
            </div>
            <div class="mt5"> 拾<input type="text" class="w90" boxNumber="3" name="shi" digits="true" maxlength="10" value="{{Param.shi}}"> 个<input type="text" class="w90" boxNumber="4" name="ge" digits="true" maxlength="10" value="{{Param.ge}}">
            </div>
          </td>
        </tr>
        <tr class="match-input hide">
          <td colspan="4" class="tc">
            <input type="text" class="w90" boxNumber="1" name="pei1" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="2" name="pei2" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="3" name="pei3" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="4" name="pei4" digits="true" maxlength="10">
          </td>
        </tr>
        <tr class="bg2">
          <td colspan="4" class="tc">
            <strong class="red2">合</strong>&nbsp;&nbsp; <strong class="red2">分</strong>
            <label><input type="checkbox" class="remain-fixed-filter checkbox" remainFixedFilter="1">除</label>
            <label><input type="checkbox" class="remain-fixed-filter checkbox" remainFixedFilter="0" checked="checked">取</label>
          </td>
        </tr>
        <tr class="tc">
          <td colspan="4">
            <div class="remain-fixed-filter-item"> 1. <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="text" class="w90" name="he1" digits="true" maxlength="10">
            </div>
            <div class="remain-fixed-filter-item mt5"> 2. <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="text" class="w90" name="he2" digits="true" maxlength="10">
            </div>
            <div class="remain-fixed-filter-item mt5"> 3. <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="text" class="w90" name="he3" digits="true" maxlength="10">
            </div>
            <div class="remain-fixed-filter-item mt5"> 4. <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="checkbox">
              <input type="text" class="w90" name="he4" digits="true" maxlength="10">
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="4" class="remain-match-filter-item">
            <strong class="red2">不定位合分</strong><br>
            <label><input type="checkbox" class="remain-match-filter checkbox" remainMatchFilter="2">两数合</label>
            <input type="text" class="w90" name="budinghe" digits="true" maxlength="10"> &nbsp;&nbsp; <label><input type="checkbox" class="remain-match-filter-three checkbox" remainMatchFilterThree="3">三数合</label>
            <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td colspan="4" class="remain-match-filter-range">
            <strong class="red2">值 范 围</strong> 从 <input type="text" class="w30" name="zhifanwei1" digits="true" maxlength="10">值 至 <input type="text" class="w30" name="zhifanwei2" digits="true" maxlength="10">值
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <strong class="red2">全转</strong> <input type="text" class="transform-filter-item w80" name="quanzhuan" digits="true" maxlength="10">
            <strong class="red2">上奖</strong> <input type="text" class="upper-filter-item w80" name="shangjiang" digits="true" maxlength="10">
            <span class="inlineblock">
              <strong class="red2">排除</strong> <input type="text" class="except-filter-item w80" name="paichu" digits="true" maxlength="10">
            </span>
            <span class="gu-ding-wei-zhi hide">
              <strong class="red2">固定位置</strong>
              <input type="checkbox" class="fixed-position-item">
              <input type="checkbox" class="fixed-position-item">
              <input type="checkbox" class="fixed-position-item">
              <input type="checkbox" class="fixed-position-item">
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked">取</label>
            <span class="inlineblock"> 四字定<strong class="red2">含</strong> <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10"> 四字定<strong class="red2">复式</strong> <input type="text" class="multiple-filter-item w90" name="fushi" digits="true" maxlength="10">
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>)
            <label><input type="checkbox" class="repeat-double-words-filter checkbox" repeatWordsFilter="1">除</label>
            <label><input type="checkbox" class="repeat-double-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双双重</strong>) 
            <span class="inlineblock">
              <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="1">除</label>
              <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">三重</strong>)
              <label><input type="checkbox" class="repeat-four-words-filter checkbox" repeatWordsFilter="1">除</label>
              <label><input type="checkbox" class="repeat-four-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">四重</strong>)
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
            <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="1">除</label>
            <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">三兄弟</strong>)
            <span class="inlineblock">
              <label><input type="checkbox" class="four-brother-filter checkbox" brotherFilter="1">除</label>
              <label><input type="checkbox" class="four-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">四兄弟</strong>)
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="4" class="logarithm-number-item">
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
            <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
          </td>
        </tr>
      </table>
    </script>
    <script type="text/html" id="tpl_erx">
      <table style="margin:23px 0" class="t-1">
        <tr class="bg2">
          <td class="tc">
            <strong class="red2">配数</strong>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0" checked="checked">取</label>
          </td>
        </tr>
        <tr class="match-input">
          <td colspan="4" class="tc">
            <input type="text" class="w90" boxNumber="1" name="pei1" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="2" name="pei2" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td colspan="4" class="remain-match-filter-item">
            <strong class="red2">不定位合分</strong>
            <label><input type="checkbox" class="remain-match-filter checkbox" remainMatchFilter="2">两数合</label> &nbsp;&nbsp; <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td>
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked">取</label> 二字现<strong class="red2">含</strong> <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10">
            <span class="inlineblock"> 二字现<strong class="red2">复式</strong> <input type="text" class="multiple-filter-item w90" name="fushi" digits="true" maxlength="10">
            </span>
          </td>
        </tr>
        <tr>
          <td>
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>)
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
          </td>
        </tr>
        <tr>
          <td colspan="4" class="logarithm-number-item">
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
            <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
          </td>
        </tr>
      </table>
    </script>
    <script type="text/html" id="tpl_sanx">
      <table style="margin:23px 0" class="t-1">
        <tr class="bg2">
          <td class="tc">
            <strong class="red2">配数</strong>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0" checked="checked">取</label>
          </td>
        </tr>
        <tr class="match-input">
          <td colspan="4" class="tc">
            <input type="text" class="w90" boxNumber="1" name="pei1" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="2" name="pei2" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="3" name="pei3" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td colspan="4" class="remain-match-filter-item">
            <strong class="red2">不定位合分</strong><br>
            <label><input type="checkbox" class="remain-match-filter checkbox" remainMatchFilter="2">两数合</label>
            <input type="text" class="w90" name="budinghe" digits="true" maxlength="10"> &nbsp;&nbsp; <label><input type="checkbox" class="remain-match-filter-three checkbox" remainMatchFilterThree="3">三数合</label>
            <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td>
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked">取</label> 三字现<strong class="red2">含</strong> <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10">
            <span class="inlineblock"> 三字现<strong class="red2">复式</strong> <input type="text" class="multiple-filter-item w90" name="fushi" digits="true" maxlength="10">
            </span>
          </td>
        </tr>
        <tr>
          <td>
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>)
            <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="1">除</label>
            <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">三重</strong>)
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
            <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="1">除</label>
            <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">三兄弟</strong>)
          </td>
        </tr>
        <tr>
          <td colspan="4" class="logarithm-number-item">
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
            <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
          </td>
        </tr>
      </table>
    </script>
    <script type="text/html" id="tpl_six">
      <table style="margin:23px 0" class="t-1">
        <tr class="bg2">
          <td class="tc">
            <strong class="red2">配数</strong>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0" checked="checked">取</label>
          </td>
        </tr>
        <tr class="match-input">
          <td colspan="4" class="tc">
            <input type="text" class="w90" boxNumber="1" name="pei1" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="2" name="pei2" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="3" name="pei3" digits="true" maxlength="10">
            <span class="inlineblock"> 配,<input type="text" class="w90" boxNumber="4" name="pei4" digits="true" maxlength="10">
            </span>
          </td>
        </tr>
        <tr>
          <td colspan="4" class="remain-match-filter-item">
            <strong class="red2">不定位合分</strong><br>
            <label><input type="checkbox" class="remain-match-filter checkbox" remainMatchFilter="2">两数合</label>
            <input type="text" class="w90" name="budinghe" digits="true" maxlength="10"> &nbsp;&nbsp; <label><input type="checkbox" class="remain-match-filter-three checkbox" remainMatchFilterThree="3">三数合</label>
            <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td>
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked">取</label> 四字现<strong class="red2">含</strong> <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10">
            <span class="inlineblock"> 四字现<strong class="red2">复式</strong> <input type="text" class="multiple-filter-item w90" name="fushi" digits="true" maxlength="10">
            </span>
          </td>
        </tr>
        <tr>
          <td>
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>)
            <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="1">除</label>
            <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">三重</strong>)
            <label><input type="checkbox" class="repeat-four-words-filter checkbox" repeatWordsFilter="1">除</label>
            <label><input type="checkbox" class="repeat-four-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">四重</strong>)
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
            <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="1">除</label>
            <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">三兄弟</strong>)
            <label><input type="checkbox" class="four-brother-filter checkbox" brotherFilter="1">除</label>
            <label><input type="checkbox" class="four-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">四兄弟</strong>)
          </td>
        </tr>
        <tr>
          <td colspan="4" class="logarithm-number-item">
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
            <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
          </td>
        </tr>
      </table>
    </script>
    <script type="text/html" id="tpl_fifteen">
      <table style="margin:23px 0" class="t-1">
        <tr class="bg2">
          <td class="tc" colspan="2">
            <strong class="red2">定位置</strong>
            <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="1">除</label>
            <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="0" checked="checked">取</label>
          </td>
          <td class="tc" colspan="2">
            <strong class="red2">配数全转</strong>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
            <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0">取</label>
          </td>
        </tr>
        <tr class="fixed-input">
          <td class="tc" colspan="2"> 仟<input type="text" boxNumber="1" class="w90" digits="true" maxlength="10">
          </td>
          <td class="tc" colspan="2"> 佰<input type="text" boxNumber="2" class="w90" digits="true" maxlength="10">
          </td>
        </tr>
        <tr class="fixed-input">
          <td class="tc" colspan="2"> 拾<input type="text" boxNumber="3" class="w90" digits="true" maxlength="10">
          </td>
          <td class="tc" colspan="2"> 个<input type="text" boxNumber="4" class="w90" digits="true" maxlength="10">
          </td>
        </tr>
        <tr class="fixed-input">
          <td class="tc" colspan="2"> 五<input type="text" boxNumber="5" class="w90" digits="true" maxlength="10">
          </td>
        </tr>
        <tr class="match-input hide">
          <td class="tc" colspan="4">
            <input type="text" class="w90" boxNumber="4" digits="true" maxlength="10">&nbsp;配&nbsp;<input type="text" class="w90" boxNumber="5" digits="true" maxlength="10">
          </td>
        </tr>
        <tr class="bg2">
          <td class="tc" colspan="4">
            <strong class="red2">合</strong>&nbsp;&nbsp; <strong class="red2">分</strong>&nbsp;&nbsp; <label><input type="checkbox" class="checkbox remain-fixed-filter" remainfixedfilter="1">除</label>
            <label><input type="checkbox" class="checkbox remain-fixed-filter" remainfixedfilter="0" checked="checked">取</label>
          </td>
        </tr>
        <tr>
          <td class="tc remain-fixed-filter-item" colspan="4"> 1. <input type="checkbox" class="checkbox" />
            <input type="checkbox" class="checkbox hide" />
            <input type="checkbox" class="checkbox hide" />
            <input type="checkbox" class="checkbox hide" /> XXX <input type="checkbox" class="checkbox" />
            <input type="text" name="he3" class="w90" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td class="tc remain-fixed-filter-item" colspan="4"> 2. <input type="checkbox" class="checkbox hide" /> X <input type="checkbox" class="checkbox" />
            <input type="checkbox" class="checkbox hide" />
            <input type="checkbox" class="checkbox hide" /> XX <input type="checkbox" class="checkbox" />
            <input type="text" name="he4" class="w90" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td class="tc remain-fixed-filter-item" colspan="4"> 3. <input type="checkbox" class="checkbox hide" />
            <input type="checkbox" class="checkbox hide" /> XX <input type="checkbox" class="checkbox" />
            <input type="checkbox" class="checkbox hide" /> X <input type="checkbox" class="checkbox" />
            <input type="text" name="he4" class="w90" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td class="tc remain-fixed-filter-item" colspan="4"> 4. XXX <input type="checkbox" class="checkbox hide" />
            <input type="checkbox" class="checkbox hide" />
            <input type="checkbox" class="checkbox hide" />
            <input type="checkbox" class="checkbox" />
            <input type="checkbox" class="checkbox" />
            <input type="text" name="he4" class="w90" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td colspan="5" class="remain-match-filter-item">
            <strong class="red2">不定位合分</strong>
            <label><input type="checkbox" remainMatchFilter="2" class="remain-match-filter checkbox">两数合</label>&nbsp;&nbsp;&nbsp;&nbsp; <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td colspan="5">
            <strong class="red2">全转</strong> <input type="text" class="transform-filter-item w80" name="quanzhuan" digits="true" maxlength="10">
            <strong class="red2">上奖</strong> <input type="text" class="upper-filter-item w80" name="shangjiang" digits="true" maxlength="10">
            <strong class="red2">排除</strong> <input type="text" class="except-filter-item w80" name="paichu" digits="true" maxlength="10"><br>
            <strong class="red2">乘号位置</strong>
            <input type="checkbox" class="symbol-filter-item">
            <input type="checkbox" class="symbol-filter-item">
            <input type="checkbox" class="symbol-filter-item">
            <input type="checkbox" class="symbol-filter-item">
            <input type="checkbox" class="symbol-filter-item">
          </td>
        </tr>
        <tr>
          <td colspan="5">
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
            <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked>取</label> 五位二定含 <input type="text" class="contain-filter-item  w80" name="han" digits="true" maxlength="10"><br>五位二定复式 <input type="text" class="multiple-filter-item  w80" name="fushi" digits="true" maxlength="10">
          </td>
        </tr>
        <tr>
          <td colspan="5">
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
            <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>)
          </td>
        </tr>
        <tr>
          <td colspan="5">
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
            <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
          </td>
        </tr>
        <tr>
          <td colspan="5" class="logarithm-number-item">
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
            <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
            <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
            <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
            <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <input type="checkbox" class="odd-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
            <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
            <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <input type="checkbox" class="big-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
            <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <input type="checkbox" class="small-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
          </td>
        </tr>
      </table>
    </script>
  </div>
  <script type="text/html" id="tpl_number">
  {{if Data && Data.length >0}}
  {{each Data as item i}}
  {{if i % 7 == 0}}
  <tr>
    {{/if}}
    <td width="14.28%">{{item}}</td>
    {{/each}}
    {{else}}
  <tr><td>没有这样的号码</td></tr>
  {{/if}}
  </script>
  <script>
    ${codeMaker}
    ${intercept}
  </script>
  <audio id="audio" src="https://www.bqxfiles.com/music/success.mp3">
  </audio>
</body>
</html>`;

const webView = new WebView();
await webView.loadHTML(html, account.baseUrl);
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
  if (event) {
    console.log(event);
    return event
  }
  injectListener();
};

injectListener();
await webView.present();