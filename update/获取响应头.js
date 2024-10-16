// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: file-powerpoint;
const request = new Request('https://e.189.cn/store/user/balance_new.do');
request.method = 'POST';
const response = await request.loadJSON();
const cookies = request.response.cookies;

console.log(
  JSON.stringify(response, null, 2)
)


/**
获取全部响应头 name + value

let cookie = [];
cookie = cookies.map((item) => item.name + '=' + item.value);
cookie = cookie.join('; ');
console.log(cookie)
*/


let cookie = [];
cookies.forEach((item) => {
  const value = item.name + '=' + item.value;
  if (item.name === 'CZSSON') {
    cookie.push(value);
  }
});
cookie = cookie.join('=');
console.log(cookie)