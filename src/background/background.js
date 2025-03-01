// 存储已经初始化的标签页
const initializedTabs = new Set();

// 监听扩展安装或更新
chrome.runtime.onInstalled.addListener(() => {
  console.log('扩展已安装/更新');
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    initializedTabs.delete(tabId);
  }
});

// 监听来自 content script 的就绪消息
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === 'contentScriptReady' && sender.tab) {
    initializedTabs.add(sender.tab.id);
  }
});

// 提供检查标签页是否初始化的方法
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkTabInitialized' && request.tabId) {
    sendResponse({ initialized: initializedTabs.has(request.tabId) });
  }
  return true;
});

// 监听扩展图标点击
chrome.action.onClicked.addListener((tab) => {
  console.log('扩展图标被点击');
});

// 处理消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'log') {
    console.log('来自内容脚本的消息:', request.message);
  }
  return true;
}); 