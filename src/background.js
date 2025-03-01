// 监听扩展图标点击
chrome.action.onClicked.addListener((tab) => {
  // 打开侧边栏
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// 监听安装事件
chrome.runtime.onInstalled.addListener(() => {
  // 设置侧边栏为默认打开
  chrome.sidePanel.setOptions({
    enabled: true,
    path: 'src/sidepanel/sidepanel.html'
  });
}); 