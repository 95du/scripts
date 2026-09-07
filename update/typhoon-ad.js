// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: magic;
let body = $response.body;
try {
  let obj = JSON.parse(body);
  if (obj && obj.data && Array.isArray(obj.data)) {
    obj.data.forEach(item => {
      if (item.code === "TYPHOON_HOME_AD" || item.code === "TYPHOON_HOME_DETAIL_AD") {
        item.appShow = false;
        if (item.data && item.data.common) {
          item.data.common.list = [];
          item.data.common.delay = 0;
        }
      }
    });
  }
  body = JSON.stringify(obj);
} catch (e) {}
$done({ body });