// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: car;
/**
 * 组件名称: 交管12123 (支付宝小程序)
 * 组件作者: 95度茅台
 * 组件版本: Version 1.2.0
 * 更新星期: 2024-10-23
 * Telegram 交流群 https://t.me/+CpAbO_q_SGo2ZWE1

============使用方法============
1，配置重写规则，手动运行小组件，点击【 GetToken 】跳转到支付宝12123小程序 登录即可自动抓取/更新Token。
2，使用前，请确保您的代理APP已配置好BoxJs重写，BoxJs配置方法：https://chavyleung.gitbook.io/boxjs/

=========Quantumult-X=========
[rewrite_local]
^https:\/\/miniappcsfw\.122\.gov\.cn:8443\/openapi\/invokeApi\/business\/biz url script-request-body https://raw.githubusercontent.com/95du/scripts/master/rewrite/getToken_12123.js

[MITM]
hostname = miniappcsfw.122.gov.cn

============Surge=============
[Script]
12123_Token = type=http-request,pattern=^https:\/\/miniappcsfw\.122\.gov\.cn:8443\/openapi\/invokeApi\/business\/biz,requires-body=1,max-size=0,timeout=1000,script-path=https://raw.githubusercontent.com/95du/scripts/master/rewrite/getToken_12123.js,script-update-interval=0

[MITM]
hostname = %APPEND% miniappcsfw.122.gov.cn:8443 surge
*/

const scriptName = '95du_12123';
const scriptUrl = 'https://raw.githubusercontent.com/95du/scripts/master/main/web_main_12123.js';

const fm = FileManager.local();
const runPath = fm.joinPath(fm.documentsDirectory(), scriptName);
const moduleDir = fm.joinPath(runPath, 'Running');

if (!fm.fileExists(runPath)) fm.createDirectory(runPath);
if (!fm.fileExists(moduleDir)) fm.createDirectory(moduleDir);

const downloadModule = async () => {
  const date = new Date();
  const df = new DateFormatter();
  df.dateFormat = 'yyyyMMddHH';
  
  const moduleFilename = df.string(date).toString() + '.js';
  const modulePath = fm.joinPath(moduleDir, moduleFilename);

  if (fm.fileExists(modulePath)) return modulePath;

  const [moduleFiles, moduleLatestFile] = getModuleVersions();

  try {
    const moduleJs = await new Request(scriptUrl).load();
    if (moduleJs) {
      fm.write(modulePath, moduleJs);
      if (moduleFiles) moduleFiles.forEach(file => fm.remove(fm.joinPath(moduleDir, file)));
      return modulePath;
    } else {
      return moduleLatestFile ? fm.joinPath(moduleDir, moduleLatestFile) : null;
    }
  } catch (e) {
    return moduleLatestFile ? fm.joinPath(moduleDir, moduleLatestFile) : null;
  }
};

const getModuleVersions = () => {
  const dirContents = fm.listContents(moduleDir);
  if (dirContents.length > 0) {
    const versions = dirContents.map(x => parseInt(x.replace('.js', '')));
    versions.sort((a, b) => b - a);

    if (versions.length > 0) {
      const moduleFiles = versions.map(x => `${x}.js`);
      const moduleLatestFile = `${versions[0]}.js`;
      return [moduleFiles, moduleLatestFile];
    }
  }
  return [null, null];
};

await (async () => {
  const modulePath = await downloadModule();
  if (modulePath) {
    const importedModule = await importModule(modulePath);
    await importedModule.main();
  }
})().catch((e) => {
  console.log(e);
  fm.remove(moduleDir);
});