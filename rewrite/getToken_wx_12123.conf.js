// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: magic;
#!name=微信小程序/交管12123

[[Script]
12123_Token = type=https:\/\/miniappwx\.122\.gov\.cn:8553\/openapi\/invokeApi\/business\/biz,requires-body=1,max-size=0,timeout=1000,script-path=https://raw.githubusercontent.com/95du/scripts/main/rewrite/getToken_wx_12123.js,script-update-interval=0

[MITM]
hostname = %APPEND% miniappwx.122.gov.cn:8553