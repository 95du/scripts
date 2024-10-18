(async () => {
    console.log('外部开始');
    await example(); // 等待 example() 的执行
    console.log('外部结束');
})();