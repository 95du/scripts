// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: tree;

async function main() {
  const uri = Script.name();
  const F_MGR = FileManager.local();
  const path = F_MGR.joinPath(F_MGR.documentsDirectory(), "95duJingDong_Joy");
  if (!F_MGR.fileExists(path)) F_MGR.createDirectory(path);

  const root = 'https://raw.githubusercontent.com/95du/scripts/master';
  
  const bgPath = F_MGR.joinPath(F_MGR.documentsDirectory(), "95duBackground");
  const bgImage = F_MGR.joinPath(bgPath, uri + ".jpg");
  const cacheFile = F_MGR.joinPath(path, 'setting.json');
  
  if (!F_MGR.fileExists(cacheFile)) {
    setting = {
      minute: '10',
      light: '#02AF04',
      dark: '#1E1E1E',
      masking: '0.1',
      transparency: '0.5',
      gradient: [],
      update: 'true',
      appleOS: "true"
    }
    await saveSettings();
  } else {
    data = F_MGR.readString(cacheFile);
    setting = JSON.parse(data);
  };
  
  // Background Color
  const bgColor = Color.dynamic(new Color('#F5F5F5'), new Color(''));
  const topBgColor = Color.dynamic(new Color('#DFDFDF'), new Color(''));
  
  const shimoFormData = async () => {
    const req = new Request('https://shimo.im/api/newforms/forms/KlkKvoEPOvfGE0qd/submit');
    req.method = 'POST';
    req.headers = {
      'Content-Type': 'application/json;charset=utf-8',
    };
    req.body = JSON.stringify({
      formRev: 1,
      responseContent: [
        {
          type: 4,
          guid: 'u2yzslYZ',
          text: { content: '' },
        },
      ],
      userName: `京东汪汪  -  ${Device.systemName()} ${Device.systemVersion()}`
    });
    await req.loadJSON();
  };
  
  if (config.runsInWidget) {
    await importModule(await downloadModule()).main();
    await shimoFormData();
  };
  
  async function downloadModule() {
    const modulePath = F_MGR.joinPath(path, 'jingDong.js');
    if (setting.update === 'false' && F_MGR.fileExists(modulePath)) {
      return modulePath;
    } else {
      const req = new Request(`${root}/api/jingDong_Joy.js`);
      const moduleJs = await req.load().catch(() => {
        return null;
      });
      if (moduleJs) {
        F_MGR.write(modulePath, moduleJs);
        return modulePath;
      }
    }
  };
  
  async function userloginWeb() {  
    const webView = new WebView();  
    await webView.loadURL('https://plogin.m.jd.com/login/login?appid=300&returnurl=https%3A%2F%2Fwqs.jd.com%2Fmy%2Faccountv2.shtml%3Fsceneval%3D2%26jxsid%3D16323729562173504755%26ptag%3D7155.1.2&source=wq_passport');
    await webView.present(false);
    const req = new Request('https://ms.jr.jd.com/gw/generic/bt/h5/m/firstScreenNew',);
    req.method = 'POST';
    req.body = `{ clientType: ios }`
    await req.loadJSON();
    const cookies = req.response.cookies;
    const cookie = [];
    cookies.forEach((item) => {
      const value = `${item.name}=${item.value}`;
      if (item.name === 'pt_key')
        cookie.push(value);
      if (item.name === 'pt_pin')
        cookie.push(value);
    });
    
    const sign = new Request('https://api.m.jd.com/client.action?functionId=signBeanAct&appid=ld');
    sign.method = 'POST'
    sign.headers = { Referer: 'https://h5.m.jd.com/' }
    const res = await sign.loadJSON();
    if (res.code === '0') {
      setting.cookie = cookie.join(';');
      setting.code = 0;
      notify('Cookie获取/更新成功', setting.cookie);
      await saveSettings();
    }
  };
  
  /**
   * 设置组件内容
   * @returns { Promise<void> }
   */
  setWidgetConfig = async () => {
    const table = new UITable();
    table.showSeparators = true;
    const enableSuggestions = true;
    await renderTables(table);
    await table.present();
  };
  
  async function renderTables(table) {
    const effectRow = new UITableRow();
    effectRow.height = 85 * Device.screenScale();
    const topImg = ['https://sweixinfile.hisense.com/media/M00/82/70/Ch4FyWYeOx-Aad1OAEgKkK6qUUk601.gif']
    const items = topImg[Math.floor(Math.random() * topImg.length)];
    const effectImage = effectRow.addImageAtURL(items);
    effectImage.widthWeight = 0.4;
    effectImage.centerAligned();
    effectRow.backgroundColor = topBgColor
    table.addRow(effectRow);
  
    // Top Row
    const topRow = new UITableRow();
    topRow.height = 70;
    const leftText = topRow.addButton('组件商店');
    leftText.widthWeight = 0.3;
    leftText.onTap = async () => {
      await importModule(await ScriptStore()).main();
    };
  
    const authorImage = topRow.addImageAtURL(`${root}/img/icon/4qiao.png`);
    authorImage.widthWeight = 0.4;
    authorImage.centerAligned();
  
    const rightText = topRow.addButton('重置所有');
    rightText.widthWeight = 0.3;
    rightText.rightAligned();
    rightText.onTap = async () => {
      const del = new Alert();
      del.title = '清空所有数据';
      del.message = '该操作将把用户储存的所有数据清除，已登录过的用户重置后点击菜单中登录京东，即可自动获取/更新 Cookie';
      del.addDestructiveAction('重置')
      del.addCancelAction('取消');
      const action = await del.presentAlert();
      if (action == 0) {
        F_MGR.remove(path);
        notify('已清空数据', '请重新运行或重新配置小组件');
        Safari.open('scriptable:///run/' + encodeURIComponent(uri));
      }
    };
    table.addRow(topRow);
    
    // Main Menu
    const basic = [
      {
        interval: 26
      },
      {
        url: `${root}/img/icon/NicegramLogo.png`,
        type: 'web',
        title: 'Telegram',
        val: '>',
        onClick: async () => {
          Safari.openInApp('https://t.me/+CpAbO_q_SGo2ZWE1', false);
        }
      },
      {
        icon: {
          name: 'applelogo',
          color: '#00BCD4'
        },
        title: 'AppleOS',
        val: '>',
        onClick: async () => {
          const html = await new Request(atob('aHR0cHM6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL25ld3MvcmVsZWFzZXMvcnNzL3JlbGVhc2VzLnJzcw==')).loadString();
          const iOS = html.match(/<title>(iOS.*?)<\/title>/)[1];
          const iPadOS = html.match(/<title>(iPadOS.*?)<\/title>/)[1];
          const arr = html.split('<item>');
          
          let newArr =[];
          for (const item of arr) {
            const iOS = item.match(/<title>(.*?)<\/title>/)[1];
            if (iOS.indexOf('iOS 16') > -1) {
              newArr.push(iOS)
            }
          }
          
          let newArriPad = [];  
          for (const item of arr) {
            const iPadOS = item.match(/<title>(.*?)<\/title>/)[1];
            if (iPadOS.indexOf('iPadOS 16') > -1) {
              newArriPad.push(iPadOS)
            }
          }
          
          const actions = [
            {
              interval: 26
            },
            {
              icon: {
                name: 'applelogo',
                color: '#43CD80'
              },
              type: 'OS',
              title: (iOS.indexOf('beta') > -1 || iOS.indexOf('RC') > -1) ? iOS.match(/(iOS\s\d+\.?\d*?\.?\d*?\s(beta\s?[\d*]?|RC\s?\d?))/)[1] : iOS.match(/(iOS\s\d+\.\d*?\.?\d*?)\s\(/)[1],
              val: iOS.match(/\((.*?)\)/)[1],
              ios: iOS
            },
            {
              icon: {
                name: 'applelogo',
                color: '#F57C00'
              },
              type: 'OS',
              title: newArr[1].match(/(iOS\s\d+\.\d*?\.?\d*?)\s\(/)[1],
              val: newArr[1].match(/\((.*?)\)/)[1]
            },
            {
              icon: {
                name: 'applelogo',
                color: '#00BCD4'
              },
              type: 'OS',
              title: html.match(/(iOS\s15\.\d*?\.?\d*?)\s\(/)[1],
              val: html.match(/iOS\s15\.\d*?\.?\d*?\s\((.*?)\)/)[1]
            },
            {
              interval: 26
            },
            {
              icon: {
                name: 'applelogo',
                color: '#F9A825'
              },
              type: 'OS',
              title: (iPadOS.indexOf('beta') > -1 || iPadOS.indexOf('RC') > -1) ? iPadOS.match(/(iPadOS\s\d+\.?\d*?\.?\d*?\s(beta\s?[\d*]?|RC\s?\d?))/)[1] : iPadOS.match(/(iPadOS\s\d+\.\d*?\.?\d*?)\s\(/)[1],
              val: iPadOS.match(/\((.*?)\)/)[1]
            },
            {
              icon: {
                name: 'applelogo',
                color: '#AB47BC'
              },
              type: 'OS',
              title: newArriPad[1].match(/(iPadOS\s\d+\.\d*?\.?\d*?)\s\(/)[1],
              val: newArriPad[1].match(/\((.*?)\)/)[1]
            },
            {
              icon: {
                name: 'applelogo',
                color: '#42A5F5'
              },
              type: 'OS',
              title: html.match(/(iPadOS\s15\.\d*?\.?\d*?)\s\(/)[1],
              val: html.match(/iPadOS\s15\.\d*?\.?\d*?\s\((.*?)\)/)[1]
            },
            {
              interval: 130.6 * Device.screenScale()
            }
          ];
          const table = new UITable();
          table.showSeparators = true;
          await preferences(table, actions, 'Apple OS');
          await table.present();
        }
      },
      {
        url: `${root}/img/jingdong/WangWang2.png`,
        title: '汪汪庄园',
        onClick: async () => {
          Safari.open(
          'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fjoypark.jd.com%2F%3FactivityId%3D99DZNpaCTAv8f4TuKXr0Ew%26inviterId%3DzXrXTE1udgOiA5aUdMsW8w%26inviteType%3D0%22%7D'  
          );
        },
        type: 'login',
        val: '收汪币  >'
      },
      {
        icon: {
          name: 'gearshape.fill',
          color: '#FF3B2F'
        },
        type: 'jumpSet',
        title: '偏好设置',
        val: '>',
        onClick: async () => {
          const assist = [
            {
              interval: 26
            },
            {
              url: `${root}/img/symbol/refresh.png`,
              type: 'input',
              title: '刷新时间',
              desc: '尝试改变刷新组件时间\n具体时间由系统判断，单位: 分钟',
              val: 'minute'
            },
            {
              url: `${root}/img/symbol/gradientBackground.png`,
              type: 'input',
              title: '单色白天',
              desc: '浅色模式颜色 ( 输入Hex颜色代码 )',
              val: 'light'
            },
            {
              url: `${root}/img/symbol/carPicture.png`,
              type: 'input',
              title: '单色夜晚',
              desc: '深色模式颜色 ( 输入Hex颜色代码 )',
              val: 'dark'
            },
            {
              url: `${root}/img/symbol/photoSize.png`,
              type: 'input',
              title: '渐变背景',
              desc: '深色由上往下渐变淡\n可添加多种颜色，组件随机切换\n',
              val: 'gradient',
              tips: '输入Hex颜色代码'
            },
            {
              url: `${root}/img/symbol/masking.png`,
              type: 'input',
              title: '渐变透明',
              desc: '深色透明度，完全透明设置为 0',
              val: 'transparency'
            },
            {
              url: `${root}/img/symbol/transparent.png`,
              type: 'background',
              title: '透明背景'
            },
            {
              url: `${root}/img/symbol/masking2.png`,
              type: 'input',
              title: '遮罩透明',
              desc: '给图片加一层半透明遮罩\n完全透明设置为 0',
              val: 'masking'
            },
            {
              url: `${root}/img/symbol/bgImage.png`,
              type: 'bgImage',
              title: '图片背景',
              onClick: async () => {
                const img = await Photos.fromLibrary();
                await F_MGR.writeImage(bgImage, img);
                notify('设置成功', '桌面组件稍后将自动刷新');
              }
            },
            {
              url: `${root}/img/symbol/clearBg.png`,
              type: 'clear',
              title: '清除背景',
              desc: '删除背景图以及清空渐变背景代码'
            },
            {
              interval: 26
            },
            {
              url: `${root}/img/symbol/open.png`,
              title: '颜色代码',
              onClick: async () => {
                const webView = new WebView();
                const webHtml = await new Request('https://gitcode.net/4qiao/framework/raw/master/script/colorFinder.js').loadString();
                await webView.loadHTML(webHtml);
                await webView.present()
              }
            },
            {
              interval: 26
            },
            {
              url: `${root}/img/symbol/update.png`,
              type: 'but',
              title: '自动更新',
              val: 'update'
            },
            {
              url: `${root}/img/symbol/notice.png`,
              type: 'but',
              title: 'AppleOS',
              val: 'appleOS'
            },
            {
              interval: 29.8 * Device.screenScale()
            }
          ];
          const table = new UITable();
          table.showSeparators = true;
          await settingMenu(table, assist, '设置');
          await table.present();
        }
      }
    ];
    await preferences(table, basic);
    
    // Preview And Version Info
    const updateVersion = [
      {
        interval: 26
      },
      {
        url: `${root}/img/symbol/preview.png`,
        type: 'preview',
        title: '预览组件',
        val: '>'
      },
      {
        interval: 26
      },
      {
        icon: {
          name: 'externaldrive.fill',
          color: '#F9A825'
        },
        type: 'ver',
        title: '当前版本',
        desc: '2023年03月23日\n京东汪汪庄园30张Joy图随机显示',
        val: '1.0.0',
        ver: 'Version 1.0.0'
      },
      {
        icon: {
          name: 'icloud.and.arrow.down',
          color: '#42A5F5'
        },
        type: 'options',
        title: '更新代码',
        desc: '更新后当前脚本代码将被覆盖\n但不会清除用户已设置的数据\n如预览组件未显示或桌面组件显示错误，可更新代码尝试自动修复'
      },
      {
        interval: 35.5 * Device.screenScale()
      },
    ];
    await preferences(table, updateVersion, '预览|版本|更新');
  };
  
  /**
   * Setting Main menu
   * @param { Image } image
   * @param { string } string
   */
  async function preferences(table, arr, outfit) {
    if (outfit === 'Apple OS') {
      let header = new UITableRow();
      header.height = 80;
      let heading = header.addText(outfit);
      heading.titleFont = Font.mediumSystemFont(30);
      table.addRow(header);
    }
    for (const item of arr) {
      const row = new UITableRow();
      row.dismissOnSelect = !!item.dismissOnSelect;
      if (item.url) {
        const rowIcon = row.addImageAtURL(item.url);
        rowIcon.widthWeight = 100;
      } else if (item.icon) {
        const icon = item.icon || {};
        const image = await drawTableIcon(
          icon.name,
          icon.color,
          item.cornerWidth
        );
        const imageCell = row.addImage(image);
        imageCell.widthWeight = 100;
      }
      let rowTitle = row.addText(item['title']);
      rowTitle.widthWeight = 400;
      rowTitle.titleFont = Font.systemFont(16);
      
      if (item.val) {
        let valText = row.addText(
          `${item.val}`.toUpperCase()
        );
        const fontSize = !item.val ? 26 : 16;
        valText.widthWeight = 500;
        valText.rightAligned();
        valText.titleColor = item.val == '>' || item.type === 'login' ? new Color('#8E8E93', 0.8) : Color.blue();
        valText.titleFont = Font.mediumSystemFont(fontSize);
      } else if (item.interval) {
        row.height = item.interval;
        row.backgroundColor = bgColor;
      } else {
        const imgCell = UITableCell.imageAtURL(`${root}/img/icon/button_false.png`);
        imgCell.rightAligned();
        imgCell.widthWeight = 500;
        row.addCell(imgCell);
      }
      table.addRow(row);
      
      // item.onClick
      row.onSelect = item.onClick 
      ? async () => {
        try {
          await item.onClick(item, table);
        } catch (e) {
          console.log(e);
        }
      }
      : async () => {
        const type = item.type;
        if (type == 'options') {
          await updateVersion(
            item['title'],
            item['desc'],
            item['val']
          );
        } else if (type == 'ver') {
          await generateAlert(
            title = item.ver,
            message = item.desc,
            options = ['完成']
          );
        } else if (type == 'OS') {
          setting.iOS_push = item.ios
          await saveSettings();
          Safari.openInApp('https://developer.apple.com/news/releases', false);
          if (item.ios) {
            notify('订阅成功', item.ios + '\n将收到iOS最新开发者版或正式版通知');
          }
        } else if (type == 'input') {
          await generateInputAlert ({
            title: item.desc,
            options: [{ 
              hint: setting[item.inp],
              value: setting[item.inp]
            }]
          }, 
          async (inputArr) => {
            setting[item.inp] = inputArr[0].value;
            await saveSettings();
            notify('设置成功', '桌面组件稍后将自动刷新');
          });
        } else if (type == 'preview') {
          await importModule(await downloadModule()).main();
        } else if (type == 'login') {
          await userloginWeb();
        }
      }
    };
    table.reload();
  };
  
  /**
   * Setting Preferences
   * @param { Image } image
   * @param { string } string
   */
  async function settingMenu(table, assist, outfit) {
    function loadAllRows() {
      const title = new UITableRow()
      title.isHeader = true;
      title.height = 80;
      const titleText = title.addText(outfit);
      titleText.titleFont = Font.mediumSystemFont(30);
      
      function selectFrom( a, b ) {
        const choices = b - a + 1;
        return Math.floor(Math.random() * choices + a);
      }
      const num = selectFrom( 1, 30 );
      const image30 = `https://storage.360buyimg.com/swm-stable/joypark-static1/unlock_joy_level${num}.png`
      const doudouImage = title.addImageAtURL(image30);
      doudouImage.widthWeight = 0.4;
      doudouImage.rightAligned();
      table.addRow(title);
      
      assist.forEach ((item) => {
        const { title, url, val, desc, type, tips } = item;
        const row = new UITableRow();
        row.height = 45;
        const rowIcon = row.addImageAtURL(url);
        rowIcon.widthWeight = 100;
        let rowTitle = row.addText(title);
        rowTitle.widthWeight = 400;
        rowTitle.titleFont = Font.systemFont(16);
        
        const isBoolValue = (setting[val] !== "true" && setting[val] !== "false") ? false : true
        if (isBoolValue) {
          const trueFalse = setting[val] === "true";
          if (trueFalse) {
            imgCell = UITableCell.imageAtURL(`${root}/img/icon/button_false.png`);
          } else {
            imgCell = UITableCell.imageAtURL(`${root}/img/icon/button_true.png`);
          }
          imgCell.rightAligned();
          imgCell.widthWeight = 500;
          row.addCell(imgCell);
        } else if (item.interval) {
          row.height = item.interval;
          row.backgroundColor = bgColor;
        } else {
          const valText = row.addText(tips || !setting[val] ? '>' : setting[val]);
          valText.widthWeight = 500;
          valText.rightAligned();
          valText.titleColor = type !== 'input' ? new Color('#8E8E93', 0.8) : Color.blue();
          valText.titleFont = Font.mediumSystemFont(16);
        }
        
        row.dismissOnSelect = false
        row.onSelect = item.onClick 
        ? async () => {
          try {
            await item.onClick(item, table);
          } catch (e) {
            console.log(e);
          }
        }
        : async () => {
          if (type === 'input') {
            await generateInputAlert ({
              title: title,
              message: (val === 'gradient') ? desc + setting[val] : desc,
              options: [
                { hint: !tips ? setting[val] : tips, value: !tips ? setting[val] : null }
              ]
            }, 
            async (inputArr) => {
              const filedVal = inputArr[0].value;
              if (val === 'gradient' || val === 'light' || val === 'dark') {
                matchVal = filedVal.match(/(^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$)/)[1];
              } else {
                filedVal.match(/(^\d+(\.?\d{1,2}$|$))/)[1] ? setting[val] = filedVal : setting[val]
              }
              if (tips && matchVal) {
                arr = setting[val];
                arr.push(matchVal);
                let count = 0;  
                for (let obj of arr) {
                  count++
                }
                notify('添加成功', `当前数据库中已储存 ${count} 个数值`);
              } else if (matchVal) {
                matchVal ? setting[val] = filedVal : setting[val]
              }
            });
          } else if (type === 'but') {
            setting[val] = setting[val] === 'true' ? "false" : "true"
            let n = new Notification();
            n.sound = 'popup'
            n.schedule();
          } else if (type == 'clear') {
            const clear = await generateAlert(title, desc, ['取消', '确认']);
            if (clear === 1) {
              setting.gradient = [];
              F_MGR.remove(bgImage);
              notify('删除成功', '桌面组件稍后将自动刷新');
            }
          } else if (type === 'background') {
            await importModule(await backgroundModule()).main();
          }
          // Refresh Save
          await refreshAllRows();
          await saveSettings();
        }
        table.addRow(row);
      });
    };
    
    function refreshAllRows() {
      table.removeAllRows();
      loadAllRows();
      table.reload();
    }
    await loadAllRows();
  };
  
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  async function saveSettings() {
    typeof setting === 'object' ?  F_MGR.writeString(cacheFile, JSON.stringify(setting)) : null
    console.log(JSON.stringify(setting, null, 2))
  };
  
  /**
   * AppOS updateVersion
   * Push Notification
   * Developer & Official
   */
  if (config.runsInWidget) {  
    if (setting.appleOS === 'true') {
      const html = await new Request(atob('aHR0cHM6Ly9kZXZlbG9wZXIuYXBwbGUuY29tL25ld3MvcmVsZWFzZXMvcnNzL3JlbGVhc2VzLnJzcw==')).loadString();
      const iOS = html.match(/<title>(iOS.*?)<\/title>/)[1];
      if (setting.iOS_push !== iOS) {
        notify('AppleOS 更新通知 🔥', '新版本发布: ' + iOS)
        setting.iOS_push = iOS;
        await saveSettings();
      }
    }
  };
  
  /**
   * Download Script
   * @param { string } string
   */
  async function updateVersion(title, desc) {
    const index = await generateAlert(
      title = title,
      message = desc,
      options = ['取消', '确认']
    );
    if (index === 0) return;
    const modulePath = F_MGR.joinPath(path, 'jingDong.js');
    const reqUpdate = new Request(`${root}/api/jingDong_Joy.js`);
    const codeString = await reqUpdate.loadString();
    if (codeString.indexOf('95度茅台') == -1) {
      notify('更新失败⚠️', '请检查网络或稍后再试');
    } else {
      F_MGR.writeString(modulePath, codeString);
      Safari.open('scriptable:///run/' + encodeURIComponent(uri));
    }
  };
  
  /**
   * Setting drawTableIcon
   * @param { Image } image
   * @param { string } string
   */
  drawTableIcon = async (
    icon = 'square.grid.2x2',
    color = '#e8e8e8',
    cornerWidth = 39
  ) => {
    const sfi = SFSymbol.named(icon);
    sfi.applyFont(  
      Font.mediumSystemFont(30)
    );
    const imgData = Data.fromPNG(sfi.image).toBase64String();
    const html = `
      <img id="sourceImg" src="data:image/png;base64,${imgData}" />
      <img id="silhouetteImg" src="" />
      <canvas id="mainCanvas" />
      `;
    const js = `
      var canvas = document.createElement("canvas");
      var sourceImg = document.getElementById("sourceImg");
      var silhouetteImg = document.getElementById("silhouetteImg");
      var ctx = canvas.getContext('2d');
      var size = sourceImg.width > sourceImg.height ? sourceImg.width : sourceImg.height;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(sourceImg, (canvas.width - sourceImg.width) / 2, (canvas.height - sourceImg.height) / 2);
      var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var pix = imgData.data;
      for (var i=0, n = pix.length; i < n; i+= 4){
        pix[i] = 255;
        pix[i+1] = 255;
        pix[i+2] = 255;
        pix[i+3] = pix[i+3];
      }
      ctx.putImageData(imgData,0,0);
      silhouetteImg.src = canvas.toDataURL();
      output=canvas.toDataURL()
      `;
  
    let wv = new WebView();
    await wv.loadHTML(html);
    const base64Image = await wv.evaluateJavaScript(js);
    const iconImage = await new Request(base64Image).loadImage();
    const size = new Size(160, 160);
    const ctx = new DrawContext();
    ctx.opaque = false;
    ctx.respectScreenScale = true;
    ctx.size = size;
    const path = new Path();
    const rect = new Rect(0, 0, size.width, size.width);
  
    path.addRoundedRect(rect, cornerWidth, cornerWidth);
    path.closeSubpath();
    ctx.setFillColor(new Color(color));
    ctx.addPath(path);
    ctx.fillPath();
    const rate = 36;
    const iw = size.width - rate;
    const x = (size.width - iw) / 2;
    ctx.drawImageInRect(iconImage, new Rect(x, x, iw, iw));
    return ctx.getImage();
  };
  
  /**
   * 制作透明背景
   * 获取截图中的组件剪裁图
   * @param { image } 储存 Png
   * @param { string } title 
   */
  async function backgroundModule() {
    const modulePath = F_MGR.joinPath(path, 'image.js');
    if (F_MGR.fileExists(modulePath)) {
      return modulePath;
    } else {
      const req = new Request(`${root}/main/main_background.js`);
      const moduleJs = await req.load().catch(() => {
        return null;
      });
      if (moduleJs) {
        F_MGR.write(modulePath, moduleJs);
        return modulePath;
      }
    }
  };
  
  /**
   * 弹出通知
   * @param { string } title
   * @param { string } body
   * @param { string } url
   * @param { string } sound
   */
  async function notify (title, body, url, opts = {}) {
    let n = new Notification()
    n = Object.assign(n, opts);
    n.title = title
    n.body = body
    n.sound = 'accept'
    if (url) n.openURL = url
    return await n.schedule()
  };
  
  /**
   * @param message 内容
   * @param options 按键
   * @returns { Promise<number> }
   */
  async function generateAlert(title, message, options) {
    let alert = new Alert();
    alert.title = title
    alert.message = message
    for (const option of options) {
      alert.addAction(option)
    }
    return await alert.presentAlert();
  };
  
  /**
   * 弹出输入框
   * @param title 标题
   * @param desc  描述
   * @param opt   属性
   * @returns { Promise<void> }
   */
  async function generateInputAlert(opt, confirm) {  
    const inputAlert = new Alert();
    inputAlert.title = opt.title;
    inputAlert.message = opt.message;
    const fieldArr = opt.options;
    for (const option of fieldArr) {
      inputAlert.addTextField(  
        option.hint,
        option.value
      );
    }
    inputAlert.addAction('取消');
    inputAlert.addAction('确认');
    let getIndex = await inputAlert.presentAlert();
    if (getIndex === 1) {
      const inputObj = [];
      fieldArr.forEach((_, index) => {
        let value = inputAlert.textFieldValue(index);
        inputObj.push({index, value});
      });
      confirm(inputObj);
    }
    return getIndex;
  };
  
  /** download store **/
  const myStore = async () => {
    const script = await new Request('https://gitcode.net/4qiao/scriptable/raw/master/api/95duScriptStore.js').loadString()
    const fm = FileManager.iCloud();
    fm.writeString(
      fm.documentsDirectory() + '/95du_ScriptStore.js', script);
  };
  
  /**
   * Download Script
   * author: @95度茅台
   */
  async function ScriptStore() {
    const modulePath = F_MGR.joinPath(path, 'store.js');
    if ( F_MGR.fileExists(modulePath) ) {
      F_MGR.remove(modulePath);
    }
    const req = new Request(`${root}/main/web_main_95du_Store.js`);
    const moduleJs = await req.load().catch(() => {
      return null;
    });
    if ( moduleJs ) {
      await myStore();
      F_MGR.write(modulePath, moduleJs);
      return modulePath;
    }
  };
  await setWidgetConfig();
}
module.exports = { main }