// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;
// ============================================
// 台风路径 - 全广告屏蔽
// Quantumult X
// ============================================

const HOSTS = [
  'tf02.istrongcloud.com',
  'tf03.istrongcloud.com',
  'upy.istrongcloud.com'
];

// 明确属于广告/推广的资源
const AD_RESOURCE = [
  'baner@tfdt.gif',
  'baner.png',
  'banner.png',
  'notification-red.png',
  'notification.png',
  'gerenyubao.png'
];

// 广告跳转
const AD_LINKS = [
  'mp.weixin.qq.com/s/pDYiFJnyRAdNzkt5o3pDKg',
  'mp.weixin.qq.com/s/1QETOoCSITcpJCCPchrA_g'
];

// 广告配置字段
const AD_KEYS = [
  'adConfig',
  'adConfigV2',
  'typhoonPopupConfig',
  'guidePoup',
  'guidePopup',
  'advertisement',
  'advertising',
  'ad'
];

// 判断域名
function isTargetHost(url) {
  try {
    const host = new URL(url).hostname;
    return HOSTS.some(x => host === x || host.endsWith('.' + x));
  } catch {
    return false;
  }
}

// 判断广告资源
function isAdResource(url) {
  const lower = url.toLowerCase();
  return AD_RESOURCE.some(x => lower.includes(x.toLowerCase()));
}

// 判断广告跳转
function isAdLink(url) {
  return AD_LINKS.some(x => url.includes(x));
}

// 关闭广告配置
function disableAds(obj) {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    obj.forEach(disableAds);
    return;
  }

  Object.keys(obj).forEach(key => {
    const value = obj[key];

    // 精确关闭广告配置
    if (AD_KEYS.includes(key)) {
      if (value && typeof value === 'object') {
        if ('isShow' in value) value.isShow = false;
        if ('show' in value) value.show = false;
        if (Array.isArray(value.list)) value.list = [];
      } else if (typeof value === 'boolean') {
        obj[key] = false;
      }
    }

    // 处理广告列表
    if (
      key === 'operationSales' ||
      key === 'advertisementList' ||
      key === 'adList'
    ) {
      if (Array.isArray(value)) {
        obj[key] = value.filter(item => {
          if (!item || typeof item !== 'object') return true;

          const text = JSON.stringify(item).toLowerCase();

          return !(
            text.includes('baner') ||
            text.includes('banner') ||
            text.includes('adconfig') ||
            text.includes('advert') ||
            text.includes('推广') ||
            text.includes('广告')
          );
        });
      }
    }

    // 继续递归
    if (value && typeof value === 'object') {
      disableAds(value);
    }
  });
}

// ============================================
// 请求阶段
// ============================================

if ($request) {
  const url = $request.url;

  // 非目标域名不处理
  if (!isTargetHost(url)) {
    $done({});
    return;
  }

  // 拦截明确广告资源
  if (isAdResource(url)) {
    console.log('[台风广告] 🚫 ' + url);
    $done({
      status: 404,
      headers: {
        'Content-Type': 'image/png'
      },
      body: ''
    });
    return;
  }

  // 拦截明确广告跳转
  if (isAdLink(url)) {
    console.log('[台风广告] 🚫 广告跳转');
    $done({
      status: 404,
      body: ''
    });
    return;
  }

  $done({});
  return;
}

// ============================================
// 响应阶段
// ============================================

if ($response) {
  const url = $response.url;

  // 只处理 JSON 配置
  if (
    isTargetHost(url) &&
    (
      url.includes('/theme/light.json') ||
      url.includes('/theme/dark.json') ||
      url.includes('/config.json') ||
      url.includes('moduleConfig/')
    )
  ) {
    try {
      const data = JSON.parse($response.body);

      disableAds(data);

      console.log('[台风广告] ✅ 配置已清理: ' + url);

      $done({
        body: JSON.stringify(data)
      });

      return;
    } catch (e) {
      console.log('[台风广告] 配置解析失败: ' + e);
    }
  }

  $done({});
  return;
}

$done({});