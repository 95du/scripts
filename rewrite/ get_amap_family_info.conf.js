// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: magic;
# 获取高德家人地图 url cookie body

^https:\/\/ts\.amap\.com\/ws\/tservice\/team\/family\/(info|member\/update) url script-request-body https://raw.githubusercontent.com/95du/scripts/main/rewrite/get_amap_family_info.js

hostname = ts.amap.com