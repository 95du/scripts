
const loadWebView = async (url, shouldCopy) => {
  const html = await new Request(url).loadString();
  if (shouldCopy) {
    Pasteboard.copy(html);
  }
  const webView = new WebView();
  await webView.loadHTML(html);
  await webView.present();
};

const createScript = () => {
  const html = Pasteboard.paste();
  return `const html = \`
${html}\`;
const webView = new WebView();
await webView.loadHTML(html);
await webView.present();`;
};

const promptForFileName = async (fm, baseName) => {
  let name = baseName;

  while (fm.fileExists(fm.documentsDirectory() + `/${name}.js`)) {
    const alert = new Alert();
    alert.message = `${name} 已存在，请重新命名`;
    alert.addTextField('输入新名称', name + ' 1');
    alert.addDestructiveAction('安装');
    alert.addCancelAction('取消');
    const input = await alert.present();
    if (input === 0) {
      name = alert.textFieldValue(0);
    } else {
      return null;
    }
  }
  return name;
};

const main = async () => {
  const url = Pasteboard.paste();
  const isUrl = /^https?:\/\//.test(url);

  if (isUrl) {
    await loadWebView(url, isUrl);
    await loadWebView('https://toolwa.com/html-formatter/', false);

    const fm = FileManager.iCloud();
    const newName = await promptForFileName(fm, 'new_Script');
    if (newName !== null) {
      const filePath = fm.documentsDirectory() + `/${newName}.js`;
      const script = createScript();
      fm.writeString(filePath, script);
    }
  }
};

