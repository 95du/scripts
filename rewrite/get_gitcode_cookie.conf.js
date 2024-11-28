// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: magic;
#!name=GitCode_Cookie
#!desc=自动抓取GitCode_Cookie
Quantumult-X（QX需要配合解析器）
#!使用方法：打开 https://gitcode.net登录，点击我的代码仓即可自动抓取Cookie。资源解析器：https://t.me/QuanXNews/110

[Script]
GitCode_Cookie = type=http-request,pattern=^(https:\/\/gitcode\.net\/dashboard\/projects\/home|https:\/\/gitcode\.com\/setting\/repo),requires-body=0,max-size=0,timeout=1000,script-path=https://raw.githubusercontent.com/95du/scripts/main/rewrite/get_gitcode_cookie.js,script-update-interval=0

[MITM]
hostname = %APPEND% (gitcode.net|gitcode.com)