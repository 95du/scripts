// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;
// ============================================
// 台风路径 - 广告屏蔽脚本
// 适用于 Quantumult X
// ============================================

const version = '1.0.0';

// 广告关键词列表
const AD_KEYWORDS = [
  'baner@tfdt.gif',
  'baner.png', 
  'notification-red.png',
  'notification.png',
  'share.png',
  'gerenyubao.png',
  'mp.weixin.qq.com',
  'typhoonPopupConfig',
  'adConfig',
  'operationSales'
];

// 判断是否为广告请求
function isAdRequest(url) {
  return AD_KEYWORDS.some(keyword => url.includes(keyword));
}

// 处理响应体，修改广告配置
function modifyConfig(body) {
  try {
    const data = JSON.parse(body);
    
    // 递归查找并关闭所有广告配置
    function disableAds(obj) {
      if (!obj || typeof obj !== 'object') return;
      
      const keys = ['adConfig', 'adConfigV2', 'operationSales', 'typhoonPopupConfig', 'guidePoup'];
      keys.forEach(key => {
        if (obj[key] !== undefined) {
          obj[key].isShow = false;
          // 如果是广告列表，清空
          if (obj[key].list) obj[key].list = [];
          console.log(`[广告屏蔽] 已关闭: ${key}`);
        }
      });
      
      // 递归处理所有子对象
      Object.keys(obj).forEach(k => {
        if (obj[k] && typeof obj[k] === 'object') {
          disableAds(obj[k]);
        }
      });
    }
    
    disableAds(data);
    return JSON.stringify(data);
  } catch (e) {
    return body;
  }
}

// 主逻辑
if ($request) {
  const url = $request.url;
  
  // 拦截广告资源请求
  if (isAdRequest(url)) {
    console.log(`[广告屏蔽] 🚫 拦截: ${url}`);
    $done({ status: 404 });
    return;
  }
  
  // 修改配置请求
  if (url.includes('config.json') || url.includes('theme/')) {
    $done({});
    return;
  }
}

// 处理响应
if ($response) {
  const url = $response.url;
  
  // 处理配置响应
  if (url.includes('config.json') || url.includes('theme/')) {
    if ($response.body) {
      const modifiedBody = modifyConfig($response.body);
      console.log(`[广告屏蔽] ✅ 已修改配置: ${url}`);
      $done({ body: modifiedBody });
      return;
    }
  }
}

$done({});