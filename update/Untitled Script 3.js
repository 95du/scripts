const encodeSpecialChars = (url) => {
  return url.replace(/([?=&#\s])|([^\x00-\x7F])/g, (match) => 
    match === ' ' ? '%20' : encodeURIComponent(match)
  );
};

return encodeSpecialChars(');

const encodeSpecialChars = (url) => {
  return url.replace(/([?=&#\s])|([^\x00-\x7F])/g, (match) => 
    match === ' ' ? '%20' : encodeURIComponent(match)
  );
};

// 示例测试
const url1 = 'https://example.com/search';
const url2 = 'https://example.com/update/api/icon.js';

const encodedUrl1 = encodeSpecialChars(url1);
const encodedUrl2 = encodeSpecialChars(url2);

console.log(encodedUrl1);  // 输出: https://example.com/search （原样输出）
console.log(encodedUrl2);  // 输出: https://example.com/update/api/icon.js （原样输出）
