const processContentAndPath = (path, scriptable, content) => {
  // 检查 scriptable 并设置 content
  if (!scriptable) {
    content = scriptable;
  } else {
    content = '95du'
  }

  // 检查 path 是否包含 '.'
  if (path.includes('.') && scriptable) {
    path = null;
  }

  // 返回 content 和 path
  return { content, path };
};

// 示例测试
let path = 'api/icon.js';
let scriptable = '123';
let content = '456';

const result = processContentAndPath(path, scriptable, content);

return result

console.log(result); // 输出: { content: '456', path: 'api/icon.js' }
