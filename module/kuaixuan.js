// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: superscript;
class CodeMaker {
  constructor(codeMaker, account, curStatus) {
    this.account = account.member_account;
    this.curStatus = curStatus;
    this.codeMaker = codeMaker;
  }
  
  // 注入拦截 js
  intercept = () => {
    return `
      document.addEventListener('DOMContentLoaded', () => {
      const showTip = (msg, duration = 1500) => {
        const tip = document.getElementById("tip");
        const text = tip.querySelector("span");
        text.textContent = msg;
        tip.classList.remove("hide");
        tip.classList.add("show");
        clearTimeout(tip.timer);
        tip.timer = setTimeout(() => {
          tip.classList.remove("show")
          tip.classList.add("hide");
        }, duration);
      };
    
      if ($.validator) {
        $.validator.setDefaults({
          focusInvalid: false,
          onfocusout: false,
          onkeyup: false,
          showErrors: (_, list) => list.length && showTip(list[0].message)
        });
      }
    
      if ($.alert) {
        $.alert = (msg, cb) => { showTip(msg || ''); cb && cb(); };
      }
      window.alert = msg => showTip(msg);
    
      window.G = window.G || {};
      G.modules = G.modules || {};
      G.instance = G.instance || {};
      const kx = window.__kx = new Kuaixuan({ json: { Param: {} } });
      kx.d = $('#kuaixuan');
      kx.bd_template = $('#bd_template');
      kx.init();
      
      // 启动原站倒计时
      if (typeof Header !== 'undefined') {
        const header = new Header($('#header'));
        G.instance.header = header;
        const mockData = ${JSON.stringify(this.curStatus)} || {};
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
        const instance = window.__kx;
        try {instance.createNumber(); }
        catch (e) {}
      }, true);
      
      // 拦截下注，返回请求体
      kx.doSave = function () {
        const f = this.codeMaker;
        if (!f?.numberList?.length) return showTip("请至少选择一个号码");
      
        const body = Object.entries({
          bet_number: f.numberList.join(','),
          bet_money: $('#bet_money').val(),
          bet_way: 102,
          is_xian: f.options.isXian,
          number_type: f.options.numberType,
          bet_log: f.logs ? f.logs.join('，') : '',
          guid: this.guid,
          period_no: ${this.curStatus?.period_no} || '2025',
          operation_condition: f.operation_condition || f.options
        }).map(([k, v]) => k + '=' + encodeURIComponent(typeof v === 'object' ? JSON.stringify(v) : v))
          .join('&');
        completion?.(body);
        window.dispatchEvent(new CustomEvent('JBridge', { detail: body }));
        
        // 显示动画
        const $n = $("#numberList"), $s = $(".betStatus"), $c = $("#multi_count");
        $n.hide(); $s.show(); $s.find('span').text(f.numberList.length); $c.html("0").removeClass("red");
        
        const total = f.numberList.length;
        const start = Date.now();
        const duration = total <= 100 ? 300 : total <= 500 ? 500 : total <= 800 ? 600 : 1000;
      
        const step = () => {
          const progress = Math.min((Date.now() - start) / duration, 1);
          const current = Math.floor(total * progress);
          $c.html(current);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            const audio = document.getElementById('audio');
            if (audio) audio.play();
            $c.addClass("red");
            setTimeout(() => {
              $s.hide(); $n.show();
            }, 500);
          }
        };
        requestAnimationFrame(step);
      }
    })`;
  };
  
  // 返回完整 HTML
  html = async () => {
    return `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link href="/Styles/style-FiveMinutes.css?v=20250912115700000'" type="text/css" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
      <style>
        body{font-family: -apple-system,Arial;margin:0;padding:2px;min-height: 130vh;overflow-y: auto;}
        .t-1 .bg3 td {background:#e3f5fd;}
        .time {text-align:center;margin-top: -30px; color:#111}
        .systime {left: 0;right: 0;}
        .header {
          left: 0; right: 0;
          background:#fb5924;
          font-weight:bold;
          height:4rem;
          text-align:center;
          font-size:1.4rem;
          padding-top:0.8rem;
          color: #fff;
          line-height: 4rem;
          padding-top: 0;
        }
        #tip {
          position: fixed;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.6);
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
      </style>
    </head>
    <body>
      <div id="header" class="header hide">账号 ${this.account} 自定义规则 ( 离线 )</div>
      <div class="tc systime time" id="systime">${this.curStatus ?? '下注后规则保存在账号配置中使用 ( 模拟投注 )'}
      </div>
      <div id="tip"><span></span></div>
      <div style="margin-top: 100px;" class="module">
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
            </div>
            <div class="mt10">
              <div class="bd m5">
                <table class="t-1" cellpadding="0" cellspacing="0">
                  <thead>
                    <tr class="bg3">
                      <td>生成号码框</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="no-padding">
                        <div style="overflow-y:auto;min-height:100px; max-height:300px;">
                          <table class="t-2 tc" id="numberList" cellpadding="0" cellspacing="0"></table>
                          <div class="betStatus"><img src="/Images/loading.gif" /><br /><br /><span>0</span>个注单正在投注，已完成<i id="multi_count"></i>个
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
        <script>
          ${this.codeMaker}
          ${this.intercept()}
        </script>
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
      <audio id="audio" src="https://www.bqxfiles.com/music/success.mp3">
      </audio>
    </body>
    </html>`;
  }
}

module.exports = CodeMaker;