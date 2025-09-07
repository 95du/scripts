// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
#!自动抓取高德地图_Cookie

[Script]
amap_Cookie = type=http-request,pattern=^https:\/\/ai\.amap\.com\/v1\/ai_rec,requires-body=0,max-size=0,timeout=1000,script-path=https://raw.githubusercontent.com/95du/scripts/master/rewrite/get_amap_cookie.js,script-update-interval=0

[MITM]
hostname = ai.amap.com