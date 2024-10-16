const alwaysDark = false

const formatNum = (number) => number < 1e3 ? number.toString() : (number < 1e6 ? `${(number / 1e3).toFixed(1)}k` : `${(number / 1e6).toFixed(1)}M`)

const getBoxjs = async () => {
  try {
    const boxjs_data = await new Request('http://boxjs.com/query/data/shimo_cookie').loadJSON();
    const bearerToken = boxjs_data.val.split(" ")[1];
    return bearerToken;
  } catch (e) {
    Safari.open('quantumult-x://');
  }
};

const httpsRequest = async (url, token) => {
  const req = new Request(url);
  req.headers = {
    Authorization: `Bearer ${token}`
  };
  return await req.loadJSON();
};

const fetchStatus = async () => {
  let bearerToken = '1.a6f091d577c14e5dca3813b793015bf9b2a82bad09b442afa2e618d61f3ebf7e6bc0ae82f50e09b6df8f51522bec205e59745468e4c3c70408a38cd3c2142beb';
  const { error } = await httpsRequest('https://shimo.im/lizard-api/users/me', bearerToken);
  if (error) bearerToken = await getBoxjs();
  return bearerToken;
};

const fetchData = async () => {
  const bearerToken = await fetchStatus();
  const { list } = await httpsRequest('https://shimo.im/lizard-api/files?excerpt=true&limit=100&type=used', bearerToken);
  
  const modifiedList = await Promise.all(
    list.map(async (item) => {
      const amount = new Request(`https://shimo.im/api/newforms/forms/${item.guid}/responses?formGuid=${item.guid}&limit=30`);
      amount.headers = {
        Cookie: `shimo_token=${bearerToken}`,
      };

      const { total } = await amount.loadJSON();
      return { ...item, total };
    })
  );

  const filteredObjects = modifiedList.filter(({ guid }) => 
    ['16q8xN0DX9I02Lq7', 'KlkKvoEPOvfGE0qd', 'loqeM1Gad8IRNnqn', '5xkGozaxxXFOQMkX', 'XKq42DPGbrhVLNAN',
'2wAldZV7awirbxAP',
'aBAYMmJWWBCM6XAj',
'N2A1gDmrKJirlNqD',
'0l3NM1Lp6YUm2zAR'].includes(guid)
  );
  const randomObject = filteredObjects[Math.floor(Math.random() * filteredObjects.length)];

  return modifiedList
    .filter(item => !filteredObjects.includes(item))
    .concat({ ...randomObject });
};

// 获取样式
const getRank = async (stack, { column }) => {
  let i = -1;
  const rows = [];
  const add = async (fn) => {
    i++;
    if (i % column === 0) {
      stack.layoutVertically();
      rows.push(stack.addStack());
    }
    const r = Math.floor(i / column);
    await fn(rows[r]);
  };
  return { add };
};

// 添加数组
const addItem = async (widget, item, index, maxTotal, lastIndex) => {
  const stack = widget.addStack();
  stack.layoutHorizontally();
  stack.centerAlignContent();
  stack.size = new Size(-1, 13 + 7);
  stack.url = `shimo:/${item.url}`;
  
  const indexStack = stack.addStack();
  indexStack.size = new Size(14 * 1.4, -1);
  
  const indexText = indexStack.addText(String(index));
  const textColor = index <= 3 
    ? '#FF0000' : index <= 6
    ? '#FCA100' : '#00C400';
  indexText.textColor = new Color(textColor);
  indexText.font = Font.boldSystemFont(14);
  stack.addSpacer(4);

  const titleText = stack.addText(item.name);
  if (alwaysDark) {
    titleText.textColor = Color.white();
  }
  titleText.font = Font.mediumSystemFont(13.5);
  titleText.textOpacity = 0.9;
  stack.addSpacer(8);
  
  const total = item.total > 1e6 ? formatNum(item.total) : (item.total).toString();
  const totalText = stack.addText(total);
  totalText.font = Font.mediumSystemFont(14);
  totalText.textColor = 
    item.total === maxTotal 
      ? new Color('#FF3500') 
      : index === lastIndex 
        ? new Color('#FF9000') 
        : Color.blue();
  stack.addSpacer();
};

// 创建组件 { column: 1 } 竖排
const createWidget = async () => {
  const widget = new ListWidget();
  widget.setPadding(15, 18, 15, 15);
  if (alwaysDark) {
    widget.backgroundColor = Color.black();  
  }
  const stackItems = widget.addStack();
  const { add } = await getRank(stackItems, { column: 2 });
  
  const data = await fetchData();
  const max = 7 * 2
  for (let i = 0; i < max; ++i) {
    const maxTotal = Math.max(...data.map(item => item.total));
    await add(stack => addItem(stack, data[i], i + 1, maxTotal, max));
  };
    
  if (config.runsInApp) {
    widget.presentMedium();
  } else {
    Script.setWidget(widget);
    Script.complete();
  }
};

await createWidget();