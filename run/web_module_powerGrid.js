// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: phone-volume;
/**
 * 组件名称: 南网在线
 * 组件作者：95度茅台
 * 组件版本: Version 1.1.0
 * 更新日期: 2024-10-25 15:00
 * Telegram 交流群 https://t.me/+CpAbO_q_SGo2ZWE1
 * 
 * Quantumult X 自动获取 token 重写: https://raw.githubusercontent.com/95du/scripts/master/rewrite/get_95598_token.sgmodule
*/

const scriptName = '95du_powerGrid';
const scriptUrl = 'https://raw.githubusercontent.com/95du/scripts/master/main/web_main_powerGrid.js';

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