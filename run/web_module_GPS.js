// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: car;
/**
 * 脚本名称: 车辆GPS定位
 * 小组件作者：95du茅台
 * 组件功能: 显示车辆实时位置、车速、最高时速、行车里程和停车时间等。推送实时静态地图及信息到微信。
 * 需申请高德地图key，微信推送需要另外填入企业微信应用的链接。
 * 版本: Version 1.0.0
 * 2023-08-12 15:00
 * Telegram 交流群 https://t.me/+CpAbO_q_SGo2ZWE1
*/

const scriptName = '95du_GPS';
const scriptUrl = 'https://raw.githubusercontent.com/95du/scripts/master/main/web_main_GPS';

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

const modulePath = await downloadModule();
if (modulePath) {
  const importedModule = await importModule(modulePath);
  await importedModule.main();
};