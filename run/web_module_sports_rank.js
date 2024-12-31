// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: trophy;
/**
 * 组件作者: 95du茅台
 * 组件名称: 体育赛事排名
 * 组件版本: Version 1.0.0
 * 发布时间: 2025-01-01
 * Telegram 交流群 https://t.me/+CpAbO_q_SGo2ZWE1
 * 
 * 增加赛事 ( 百度体育官网 )
 * https://tiyu.baidu.com/al/matchlist
 * 
 * 2，如需多个组件，在桌面组件参数输入对应的赛事名称，例如: 西甲、英超、CBA、常规东部、常规西部, 季前东部, 季前西部
 */

const scriptName = '95du_sports_rank';
const scriptUrl = 'https://raw.githubusercontent.com/95du/scripts/master/main/web_main_sports_rank.js';

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