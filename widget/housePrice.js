// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: home;
/**
* 幸福里房产大数据房屋估值
* 小组件作者：95度茅台
* Version 1.0.0
* 2022-12-15 16:23
* Telegram 交流群 https://t.me/+ViT7uEUrIUV0B_iy
* 在第 12 行替换图片URL
* 在第 13 行修改图片尺寸
* 感谢 @LSP的帮助
*/

const houseImageUrl = await new Request('https://raw.githubusercontent.com/95du/scripts/master/img/icon/houseLogo.png').loadImage();
const imageSize = 150

const uri = Script.name();
const F_MGR = FileManager.local();
const folder = F_MGR.joinPath(F_MGR.documentsDirectory(), "house");

const cacheFile = F_MGR.joinPath(folder, 'data.json');
const bgImage = F_MGR.joinPath(folder, uri + ".jpg");

if (F_MGR.fileExists(cacheFile)) {
  data = F_MGR.readString(cacheFile)
  obj = JSON.parse(data);
}

async function presentMenu() {
  let alert = new Alert();
  alert.title = '我的房子值多少钱'
  alert.message = 'Version 1.0.0\n\r幸福里房产大数据房屋估值\n此组件获取的数据仅供参考';
  alert.addDestructiveAction('更新代码');
  alert.addDestructiveAction('重置所有');
  alert.addAction('组件下载');
  alert.addAction('房屋估值');
  alert.addAction('预览组件');
  alert.addAction('取消操作');
  mainMenu = await alert.presentAlert();
  if (mainMenu === 5) return;
  if (mainMenu === 1) {
    if (F_MGR.fileExists(folder)) {
      await F_MGR.remove(folder);
      Safari.open('scriptable:///run/' + encodeURIComponent(uri));
    }
    return;
  }
  if (F_MGR.fileExists(cacheFile)) {
    if (mainMenu === 2) {
      await importModule(await downloadModule()).main();
    }
    if (mainMenu === 3) {
      await addHouseMsg();
    }
    if (mainMenu === 4) {
      await getHouseMsg(obj);
      await widget.presentMedium();
    }
  } else {
    await addHouseMsg();
  }
  if (mainMenu === 0) {
    const codeString = new Request('https://gitcode.net/4qiao/scriptable/raw/master/api/housePrice.js').loadString();
    if (codeString.indexOf('95度茅台') === -1) {
      notify('更新失败⚠️', '请检查网络或稍后再试');
    } else {
      F_MGR.writeString(  
        module.filename,
        codeString
      );
      notify('小组件更新成功', '');
      Safari.open('scriptable:///run/' + encodeURIComponent(uri));
    }
  }
}

async function createWidget(result) {
  const widget = new ListWidget();
  if (F_MGR.fileExists(bgImage)) {
    widget.backgroundImage = F_MGR.readImage(bgImage);
  } else {
    const gradient = new LinearGradient()
    color = [
    "#82B1FF",
    "#757575",
    "#99CCCC",
    "#BCBBBB"
    ]
    const items = color[Math.floor(Math.random() * color.length)];
    gradient.locations = [0, 1]
    gradient.colors = [
      new Color(items, 0.5),
      new Color('#00000000')
    ]
    widget.backgroundGradient = gradient
  }
  
  
  /**
  * Frame Layout
  * @param {Image} image
  * @param {string} string
  */
  widget.setPadding(15, 15, 15, 15);
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  mainStack.centerAlignContent();
  mainStack.addSpacer(32);
  
  // Top Stack
  const topStack = mainStack.addStack();
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  topStack.addSpacer();
  const nameText = topStack.addText(result.name);
  nameText.textOpacity = 0.8;
  nameText.font = Font.boldSystemFont(14);
  nameText.centerAlignText();
  topStack.addSpacer(5);
  
  const noticeStack = topStack.addStack();
  const symbol = SFSymbol.named(
    result.pricing > data.upDown ? 'arrow.up' : 'arrow.down'
  );
  const icon = noticeStack.addImage(symbol.image);
  icon.imageSize = new Size(16, 16);
  icon.tintColor = new Color(
    result.pricing > data.upDown ? '#00C853' : '#D50000'
  )
  topStack.addSpacer();
  
  // bottomStack
  const bottomStack = mainStack.addStack();
  bottomStack.layoutHorizontally();
  bottomStack.addSpacer();
  const logoStack = bottomStack.addStack();
  const houseImage = logoStack.addImage(houseImageUrl);
  houseImage.imageSize = new Size(imageSize, imageSize);
  bottomStack.addSpacer(30)
  
  // Right Stack
  const rightStack = bottomStack.addStack();
  rightStack.layoutVertically();
  rightStack.addSpacer();
  const priceStack = rightStack.addStack();
  const priceText = priceStack.addText(result.estimate_price_str + '.');
  priceText.font = new Font("Georgia-Bold", 50)
  priceText.textColor = new Color('#D50000');
  rightStack.addSpacer(8);

  const averagePriceText = rightStack.addText(`房屋均价 ${result.estimate_pricing_persqm_str}`)
  averagePriceText.textOpacity = 0.7;
  averagePriceText.font = Font.mediumSystemFont(11);
  rightStack.addSpacer(2);
  
  const neighborhood = rightStack.addText(`小区均价 ${result.neighborhood}`)
  neighborhood.textOpacity = 0.7;
  neighborhood.font = Font.mediumSystemFont(11);
  rightStack.addSpacer(2);

  const cityPriceText = rightStack.addText(`城市比率 ${result.estimate_price_in_city_level} %`)
  cityPriceText.textColor = Color.green();
  cityPriceText.font = Font.boldSystemFont(12);
  rightStack.addSpacer();
  bottomStack.addSpacer()
  mainStack.addSpacer();
  return widget
}

async function downloadModule() {
  const modulePath = F_MGR.joinPath(folder, 'store.js');
  if (F_MGR.fileExists(modulePath)) {
    await F_MGR.remove(modulePath)
  }
  const req = new Request('https://gitcode.net/4qiao/scriptable/raw/master/vip/main95duStore.js');
  const moduleJs = await req.load().catch(() => {
    return null;
  });
  if (moduleJs) {
    F_MGR.write(modulePath, moduleJs);
    return modulePath;
  }
}

async function generateInputAlert(options,confirm) {  
  const inputAlert = new Alert();
  inputAlert.title = options.title;
  inputAlert.message = options.message;
  const fieldArr = options.options;
  for (const option of fieldArr) {
    inputAlert.addTextField(  
      option.hint,
      option.value
    );
  }
  inputAlert.addAction('取消');
  inputAlert.addAction('确认');
  let getIndex = await inputAlert.presentAlert();
  if (getIndex == 1) {
    const inputObj = [];
    fieldArr.forEach((_, index) => {
      let value = inputAlert.textFieldValue(index);
      inputObj.push({index, value});
    });
    confirm(inputObj);
  }
  return getIndex;
}

async function addHouseMsg() {  
  await generateInputAlert ({
    title: '输入房屋估值信息',
    options: [
      { hint: '城市', value: '' },
      { hint: '小区', value: '' },
      { hint: '年份', value: '' },
      { hint: '面积', value: '' },
      { hint: '几室', value: '' },
      { hint: '几厅', value: '' },
      { hint: '几卫', value: '' }]
    }, 
    async (inputArr) => {
      const city = await getJson('https://fangchan.toutiao.com/f100/api/city_search?full_text=' + encodeURIComponent(inputArr[0].value));
      const cityID = city.data.data[0].city_id
      // subdistrict
      const housing = await getJson('https://m.xflapp.com/f100/api/get_suggestion?city_id=15310&house_type=4&query=' + encodeURIComponent(inputArr[1].value) + '&only_neighborhood=1&source=h5');
      const houseList = housing.data
      const alert = new Alert();
      alert.title = '幸福里房产大数据';
      // forEach List
      houseList.forEach(item => {
        alert.addAction(item.text + '  在售' + item.tips + '🔥');
      });
      alert.addCancelAction('取消');
      const houseId = await alert.presentSheet();
      const num = houseList[houseId]
      if (houseId === -1) return;
      if (F_MGR.fileExists(cacheFile)) {
        await F_MGR.remove(cacheFile)
      }
      const obj = {
        cityID: cityID,
        num: num.id,
        name: num.rich_name.text,
        year: inputArr[2].value,
        squa: inputArr[3].value,
        room: inputArr[4].value,
        hall: inputArr[5].value,
        bath: inputArr[6].value
      }
      return await getHouseMsg(obj);
    }
  );
}


async function getHouseMsg(obj) {
  // House Valuation
  const house = await getJson(`https://m.xflapp.com/f100/api/estimate_house_price?city_id=${obj.cityID}&neighborhood_id=${obj.num}&squaremeter=${obj.squa}&floor_plan_room=${obj.room}&floor_plan_hall=${obj.hall}&floor_plan_bath=${obj.bath}&total_floor=1&floor=1&facing_type=3&decoration_type=4&built_year=${obj.year}&building_type=1&source=h5`);
  // neighborhood
  const neighborhood = await getJson(`https://m.xflapp.com/f100/api/neighborhood/info?neighborhood_id=${obj.num}&source=h5`);
  
  const pricing = house.data.estimate_pricing_persqm_str.split("元")[0];
  if (!F_MGR.fileExists(cacheFile)) {
    notify(obj.name, `房屋价值${house.data.estimate_price_str}万，均价${pricing}元/平方。`);
  }
  // Consolidate data
  const object = {
    ...obj,
    pricing: pricing,
    upDown: (obj.pricing) ? obj.pricing : pricing
  }
  // Initialization
  if (!F_MGR.fileExists(folder)) {
    F_MGR.createDirectory(folder);
    F_MGR.writeString(cacheFile, JSON.stringify(object));  
    Safari.open('scriptable:///run/' + encodeURIComponent(uri));
  }
  // Save Valuation
  if (pricing > obj.pricing || pricing < obj.pricing || !F_MGR.fileExists(cacheFile)) {
    F_MGR.writeString(cacheFile, JSON.stringify(object));
  }
  // output data
  const result = {
    ...house.data,
    name: obj.name,
    pricing: pricing,
    neighborhood: neighborhood.data.core_info[0].value
  }
  return widget = await createWidget(result);
}

const isMediumWidget =  config.widgetFamily === 'medium'
if (config.runsInApp) {
  await presentMenu();
} else {
  if (isMediumWidget) {
    await getHouseMsg(obj);
    Script.setWidget(widget);
    Script.complete();
  } else {
    createErrorWidget();
  }
}

async function notify (title, body, url, opts = {}) {
  let n = new Notification()
  n = Object.assign(n, opts);
  n.title = title
  n.body = body
  n.sound = 'alert'
  if (url) n.openURL = url
  return await n.schedule();
}

function createErrorWidget() {
  const widget = new ListWidget();
  const text = widget.addText('仅支持中尺寸');
  text.font = Font.systemFont(17);
  text.centerAlignText();
  Script.setWidget(widget);
}

async function getJson(url) {
  const req = await new Request(url);
  return await req.loadJSON();
}