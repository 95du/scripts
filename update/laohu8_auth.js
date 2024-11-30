const key = "laohu8_auth_token";

if ($request) {
  // 拦截请求并提取 Authorization
  const auth = $request.headers["Authorization"];
  if (auth) {
    $prefs.setValueForKey(auth, key); // 存储到圈X的偏好设置中
    $notify("Authorization 已捕获", "成功获取到请求头信息", auth); // 推送通知
  }
  $done(); // 完成请求处理
} else {
  // 定时任务中检查存储的 Authorization 信息
  const savedAuth = $prefs.valueForKey(key);
  if (savedAuth) {
    $notify("当前 Authorization", "定时任务执行", savedAuth); // 推送通知显示已保存的信息
  } else {
    $notify("Authorization 获取失败", "未找到存储的值", "请确保规则正常运行");
  }
  $done();
}
