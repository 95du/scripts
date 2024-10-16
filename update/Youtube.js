// https://youtu.be/E817KDkna8I?si=vVGTVeX6PY1qmPme

const url = Pasteboard.paste();
if (url?.includes('youtu')) {  
  const { data } = await new Request(`https://cdn33.savetube.me/info?url=${url}`).loadJSON();
  if (data?.video_formats) {
    const selectedVideo = data.video_formats.find(item => item.default_selected === 1 && item.url);
    if (selectedVideo) await action(selectedVideo.url);
  }
};

async function action(videoUrl) {
  const alert = new Alert();
  const actions = [
    '下载视频', '后台播放'
  ];

  actions.forEach(( action, index ) => {
  alert[ index === 0 ? 'addDestructiveAction' : 'addAction' ](action);
  });
  alert.addCancelAction('取消');
  
  const response = await alert.presentSheet();
  if (response === 0) {
    Pasteboard.copy(videoUrl)
    Safari.open("shortcuts://run-shortcut?name=YouTube&input=video")
  } else if (response === 1) {
    Safari.open(videoUrl);
  }
};