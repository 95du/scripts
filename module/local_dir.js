// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: folder-open;
/**
 * 修改自 Honye 的脚本，直接进入本地文件目录，脚本发生错误时，供用户使用。
 * 仓库: https://github.com/Honye/scriptable-scripts
 * @param {string[]} fileURLs
 * @param {string} destPath
 */

async function main() {
  const fm = FileManager.local();
  const copyFiles = async (fileURLs, destPath) => {
    let isReplaceAll = false;
    const fm = FileManager.local();
    for (const fileURL of fileURLs) {
      const fileName = fm.fileName(fileURL, true);
      const filePath = fm.joinPath(destPath, fileName);
      if (fm.fileExists(filePath)) {
        if (isReplaceAll) {
          fm.remove(filePath);
        } else {
          const alert = new Alert();
          alert.message = `“${fileName}”已存在，是否替换？`;
          const actions = ['全是', '是', '否'];
          for (const action of actions) alert.addAction(action);
          alert.addCancelAction('取消');
          const value = await alert.present();
          switch (actions[value]) {
            case '全是':
              isReplaceAll = true;
              fm.remove(filePath);
              break
            case '是':
              fm.remove(filePath);
              break
            case '否':
              continue
            default: // 取消
              return
          }
        }
      }
      fm.copy(fileURL, filePath);
    }
    const alert = new Alert();
    alert.title = '导入成功';
    alert.message = '重新进入此目录可查看';
    alert.addCancelAction('好的');
    await alert.present();
  };
  
  /**
   * @param {string} destPath 输出目录
   */
  const importFiles = async (destPath) => {
    let fileURLs = args.fileURLs;
    if (!fileURLs.length) {
      try {
        fileURLs = await DocumentPicker.open();
      } catch (e) {
        // 用户取消
        return
      }
    }
    await copyFiles(fileURLs, destPath);
  };
  
  /**
   * @param {object} options
   * @param {string} options.title
   * @param {File[]} options.list
   * @param {string} [options.directory]
   */
  const presentList = async (options) => {
    const { title, list, directory } = options;
    const webView = new WebView();
    const css =
    `:root {
      --color-primary: #007aff;
      --divider-color: rgba(60,60,67,0.36);
      --card-background: #fff;
      --card-radius: 10px;
      --list-header-color: rgba(60,60,67,0.6);
    }
    
    * {
      -webkit-user-select: none;
      user-select: none;
    }
    
    body {
      margin: 0;
      -webkit-font-smoothing: antialiased;
      font-family: "SF Pro Display","SF Pro Icons","Helvetica Neue","Helvetica","Arial",sans-serif;
      min-height: 100vh;
      box-sizing: border-box;
      accent-color: var(--color-primary);
      padding-top: env(safe-area-inset-top);
    }
    
    .header {
      position: sticky;
      z-index: 99;
      top: env(safe-area-inset-top);
      left: 0;
      right: 0;
      height: 3.5rem;
      text-align: center;
      background: var(--card-background);
      display: flex;
      align-items: center;
      padding: 0 1rem;
    }
    
    .header__left,
    .header__right {
      flex: 1;
      /* min-width: 4rem; */
    }
    
    .header__left {
      text-align: left;
    }
    
    .header__right {
      text-align: right;
    }
    
    .header__btn,
    .select-all,
    .select {
      font-size: 0.875rem;
    }
    
    .title {
      font-size: 1.15rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .list {
      padding: 0;
      margin: 0;
      list-style: none;
    }
    
    .icon-yuan {
      color: #666;
    }
    
    .icon-gouxuan {
      color: var(--color-primary);
    }
    
    .item {
      padding-left: 1.125rem;
    }
    
    .item,
    .item__body {
      flex: 1;
      display: flex;
      align-items: center;
      overflow: hidden;
    }
    
    .item__selection {
      font-size: 0;
      transition: all .3s;
    }
    
    .item__icon {
      margin-right: 0.625rem;
      font-size: 2.5rem;
      color: var(--color-primary);
    }
    
    .item__name {
      font-size: 1.15em;
      color: #222;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .item[data-is-directory="1"] .item__name {
      color: var(--color-primary);
    }
    
    .item__content {
      flex: 1;
      padding: 0.75rem 0;
      border-bottom: 0.5px solid var(--divider-color);
    }
    
    .item__info {
      margin-top: 0.3rem;
      font-size: 0.75rem;
      color: #666;
    }
    
    .list-select .item__selection {
      margin-right: 0.5rem;
      font-size: 1.5rem;
    }
    
    .fixed-bottom {
      position: fixed;
      z-index: 10;
      bottom: 0;
      left: 0;
      right: 0;
      padding-bottom: env(safe-area-inset-bottom);
      /* background: indianred; */
      background: #d50000;
      transform: translateY(100%);
      transition: all 0.25s;
    }
    
    .btn-del {
      margin: 0;
      display: block;
      width: 100%;
      height: 2.75rem;
      border: none;
      font-size: 1.125rem;
      color: #fff;
      background: #d50000;
      padding: 0;
    }
    
    .fixed-bottom.show {
      transform: translateY(0);
    }
    
    .bottom-holder {
      margin-top: 2rem;
      box-sizing: content-box;
      height: 2.75rem;
      padding-bottom: env(safe-area-inset-bottom);
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --divider-color: rgba(84,84,88,0.65);
        --card-background: #1c1c1e;
        --list-header-color: rgba(235,235,245,0.6);
      }
      
      body {
        background: #000;
        color: #fff;
      }
      
      .item__name {
        color: white;
      }
      
      .item[data-is-directory="1"] .item__name {
        color: #8aefef;
      }
      
    }`;
  
    const js =
    `window.invoke = (code, data) => {
      window.dispatchEvent(
        new CustomEvent(
          'JBridge',
          { detail: { code, data } }
        )
      )
    }
  
    const isSelectMode = () => {
      return document.querySelector('.list').classList.contains('list-select')
    }
  
    const removeItems = (items) => {
      const list = document.querySelector('.list')
      for (const item of items) {
        const el = document.querySelector(\`.item[data-name="\${item.name}"]\`)
        el.parentNode.remove()
      }
    }
    
    document.querySelector('.select').addEventListener('click', (e) => {
      /** @type {HTMLButtonElement} */
      const target = e.currentTarget
      target.innerText = target.innerText === '选择' ? '完成' : '选择'
    
      document.querySelector('.select-all').toggleAttribute('hidden')
      document.querySelector('#import')?.toggleAttribute('hidden')
      document.querySelector('.list').classList.toggle('list-select')
      document.querySelector('.fixed-bottom').classList.toggle('show')
    })
    
    document.querySelectorAll('.item')
      .forEach((el) => {
        el.addEventListener('click', (e) => {
          const target = e.currentTarget
          if (isSelectMode()) {
            /** @type {HTMLElement} */
            const selection = target.querySelector('.item__selection')
            const isSelected = selection.classList.contains('icon-gouxuan')
            if (isSelected) {
              selection.classList.replace('icon-gouxuan', 'icon-yuan')
            } else {
              selection.classList.replace('icon-yuan', 'icon-gouxuan')
            }
          } else {
            const { name } = target.dataset
            invoke('view', target.dataset)
          }
        })
      })
  
    document.querySelector('.select-all').addEventListener('click', (e) => {
      /** @type {HTMLButtonElement} */
      const target = e.currentTarget
      const isSelected = target.innerText === '取消全选'
      target.innerText = isSelected ? '全选' : '取消全选'
      document.querySelectorAll('.item__selection').forEach((e) => {
        if (isSelected) {
          e.classList.replace('icon-gouxuan', 'icon-yuan')
        } else {
          e.classList.replace('icon-yuan', 'icon-gouxuan')
        }
      })
    })
  
    document.querySelector('.fixed-bottom').addEventListener('click', () => {
      const selectedItems = []
      for (const el of document.querySelectorAll('.icon-gouxuan')) {
        selectedItems.push({ ...el.parentNode.dataset })
      }
      invoke('remove', selectedItems)
    })
  
    window.addEventListener('JWeb', (e) => {
      const { code, data } = e.detail
      switch (code) {
        case 'remove-success':
          removeItems(JSON.parse(data))
          break;
      }
    })`;
  
    const html =
    `<!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
      <title>${title}</title>
      <link rel="stylesheet" href="https://at.alicdn.com/t/c/font_3772663_0lvf7sx0ati.css">
      <style>${css}</style>
    </head>
    <body>
      <div class="header">
        <div class="header__left">
          <button class="select-all" hidden>全选</button>
          ${directory
            ? '<button id="import" class="header__btn" onclick="invoke(\'import\')">导入</button>'
            : ''
          }
        </div>
        <h3 class="title">${title}</h3>
        <div class="header__right">
          <button class="select">选择</button>
        </div>
      </div>
      <ul class="list">
      ${list.map((file) => (
        `<li>
          <div class="item" data-name="${file.name}"
            data-is-directory="${Number(file.isDirectory)}"
            data-file-path="${file.filePath}"
          >
            <i class="iconfont icon-yuan item__selection"></i>
            <div class="item__body">
              <i class="iconfont ${file.isDirectory ? 'icon-folder-close' : 'icon-doc'} item__icon"></i>
              <div class="item__content">
                <div class="item__name">${file.name}</div>
                ${file.info ? `<div class="item__info">${file.info}</div>` : ''}
              </div>
            </div>
          </div>
        </li>`
      )).join('')}
      </ul>
      <div class="bottom-holder"></div>
      <div class="fixed-bottom">
        <button class="btn-del">删除</button>
      </div>
      <script>${js}</script>
    </body>
    </html>`;
    await webView.loadHTML(html);
  
    const view = async (data) => {
      const { isDirectory, filePath, name } = data;
      if (Number(isDirectory)) {
        const list = fm.listContents(filePath)  
          .map((name) => {
            const path = fm.joinPath(filePath, name);
            const isDirectory = fm.isDirectory(path);
            const date = fm.modificationDate(path).toLocaleString();
            const size = fm.fileSize(path);
            return {
              name,
              info: isDirectory
                ? `${date} - ${fm.listContents(path).length} 项`
                : `${date} - ${size > 1024 ? `${(size / 1024).toFixed(1)} MB` : `${size} KB`}`,
              filePath: path,
              isDirectory
            }
          });
        presentList({
          title: name,
          list,
          directory: filePath
        });
      } else {
        if (!fm.isFileDownloaded(filePath)) {
        await fm.downloadFileFromiCloud(filePath);
      }
      try {
        const image = fm.readImage(filePath);
        QuickLook.present(image, false);
        return
      } catch (e) {
        console.warn(e);
      }
      try {
        const text = filePath.endsWith('.json') 
          ? JSON.stringify(JSON.parse(fm.readString(filePath)), null, 4)
          : fm.readString(filePath)
        QuickLook.present(text);
        return
      } catch (e) {
        console.warn(e);
      }
      QuickLook.present(filePath);
    }
  };
  
    const remove = async (list) => {
      for (const file of list) {
        fm.remove(file.filePath);
      }
      webView.evaluateJavaScript(
        `window.dispatchEvent(new CustomEvent(
          'JWeb',
          { detail: {
            code: 'remove-success',
            data: '${JSON.stringify(list)}'
          } }
        ))`,
        false
      );
    };
  
    const injectListener = async () => {
      const event = await webView.evaluateJavaScript(
        `(() => {
          const controller = new AbortController()
          const listener = (e) => {
            completion(e.detail)
            controller.abort()
          }
          window.addEventListener(
            'JBridge',
            listener,
            { signal: controller.signal }
          )
        })()`,
        true
      ).catch((err) => {
        console.error(err);
        throw err
      });
      const { code, data } = event;
      switch (code) {
        case 'view':
          view(data);
          break
        case 'remove':
          remove(data).catch((e) => console.error(e));
          break
        case 'import':
          importFiles(directory).catch((err) => console.error(err));
          break
      }
      injectListener();
    };
  
    injectListener().catch((e) => {
      console.error(e);
      throw e
    });
    webView.present();
  };
  
  // 直接进入本地文件
  (async () => {
    const localDocumentsDir = fm.documentsDirectory();
    const list = fm.listContents(localDocumentsDir).map((name) => {
      const path = fm.joinPath(localDocumentsDir, name);
      const isDirectory = fm.isDirectory(path);
      const date = fm.modificationDate(path).toLocaleString();
      const size = fm.fileSize(path);
      return {
        name,
        info: isDirectory
          ? `${date} - ${fm.listContents(path).length} 项`
          : `${date} - ${size > 1024 ? `${(size / 1024).toFixed(1)} MB` : `${size} KB`}`,
        filePath: path,
        isDirectory
      };
    });
  
    presentList({
      title: 'Local documents directory',
      list,
      directory: localDocumentsDir
    });
  })();
};

module.exports = { main }