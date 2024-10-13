
/**
脚本名称：获取 GitCode_Cookie
更新时间：2023-02-02
Author: 95度茅台

==================================
一错添加 Quantumult-X | Surge 重写：
https://gitcode.net/4qiao/scriptable/raw/master/quanX/get_gitcode_cookie.sgmodule

使用方法：
运行此脚本，登录即可自动抓取/更新 Cookie

========== Quantumult-X ==========
[rewrite_local]
^https:\/\/gitcode\.net\/dashboard\/projects\/home,requires-body=0,max-size=0,timeout=1000,script-path=https://gitcode.net/4qiao/scriptable/raw/master/quanX/get_gitcode_cookie.js,script-update-interval=0

[MITM]
hostname = gitcode.net

============== Surge =============
[Script]
GitCode_Cookie = type=http-request,pattern=^https:\/\/gitcode\.net\/dashboard\/projects\/home,requires-body=0,max-size=0,timeout=1000,script-path=https://gitcode.net/4qiao/scriptable/raw/master/quanX/get_gitcode_cookie.js,script-update-interval=0

[MITM]
hostname = %APPEND% gitcode.net

==================================
一键添加 boxjs 重写到 Quantumult-X https://api.boxjs.app/quanx-install

95度茅台 Boxjs 订阅:
https://gitcode.net/4qiao/scriptable/raw/master/boxjs/sub.json

快捷指令版_GitCode:
https://www.icloud.com/shortcuts/4029b804485e40369e33eedec79286d7

*/

Safari.openInApp('https://gitcode.net/dashboard/projects/home', false); 

try {
  const boxjs_data = await new Request('http://boxjs.com/query/data/gitcode_cookie').loadJSON();
  const { val } = boxjs_data;
  if (val) {
    Pasteboard.copy(val);
    console.log('GitCode_Cookie获取成功，已拷贝至剪贴板:\n\n' + val);
  }
} catch(e) {
  Safari.open('quantumult-x://');
  console.log('获取 boxjs 数据失败 ⚠️', '需打开Quantumult-X获取Cookie');
}

return;

const webview = new WebView();
await webview.loadURL('https://gitcode.net/dashboard/projects/home');
await webview.present();



// 淘宝 Cookie
try {
  const boxjs_data = await new Request('http://boxjs.com/query/data/taobao_cookie').loadJSON();
  const { val } = boxjs_data;
  if (val) {
    Pasteboard.copy(val);
    console.log('taobao_Cookie获取成功，已拷贝至剪贴板:\n\n' + val);
  }
} catch(e) {
  Safari.open('quantumult-x://');
  console.log('获取 boxjs 数据失败 ⚠️', '需打开Quantumult-X获取Cookie');
}

Safari.open('taobao://m.taobao.com/tbopen/index.html?h5Url=https://main.m.taobao.com/mytaobao/index.html');
