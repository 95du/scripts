// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: magic;
let body = $response.body;
try {
  let obj = JSON.parse(body);
  if (obj && Array.isArray(obj.data)) {
    // 直接删掉广告配置项
    obj.data = obj.data.filter(item => {
      return item.code !== "TYPHOON_HOME_AD" && item.code !== "TYPHOON_HOME_DETAIL_AD";
    });
  }
  body = JSON.stringify(obj);
} catch (e) {}
$done({ body });