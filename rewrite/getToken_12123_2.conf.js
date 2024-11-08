// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: brown; icon-glyph: magic;
#!name=交管12123_Token
#!desc=自动抓取 交管12123_Token，支持Surge和Quantumult-X（QX需要配合解析器）
#!使用方法：打开 交管12123支付宝小程序 登录即可自动抓取Token。资源解析器：https://t.me/QuanXNews/110

[Script]
12123_Token = type=http-request,pattern=^https:\/\/miniappcsfw\.122\.gov\.cn:8443\/openapi\/invokeApi\/business\/biz,requires-body=1,max-size=0,timeout=1000,script-path=https://raw.githubusercontent.com/95du/scripts/main/rewrite/getToken_12123_2.js,script-update-interval=0

[MITM]
hostname = %APPEND% miniappcsfw.122.gov.cn